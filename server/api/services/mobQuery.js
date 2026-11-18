import { query } from '../../services/mariadb.js';
import {
    effectiveMobsSql,
    effectiveItemsSql,
    isSpawnDataAvailable,
    mobDropColumns,
    mobDropMatchSql,
    mobDropMatchParams,
    parsePagination,
    parseCsv,
    parseBool,
    parseIntParam,
    spawnTableSql,
    MOB_ELEMENTS,
    MOB_RACES,
    MOB_SIZES
} from './gameDb.js';
import {
    applyDropRate,
    dropMultiplier,
    effectiveMvpRates,
    mobTier,
    rateToPercent,
    MVP_REWARD_RATE
} from './dropRates.js';
import { applyMobHp } from './mobRates.js';
import { getMobSummons } from './mobSummons.js';
import { getItemDisplayName } from './itemInfo.js';

function mapMobSummary(row) {
    const tier = mobTierFromRow(row);
    return {
        id: row.id,
        name: row.name_english,
        nameAegis: row.name_aegis,
        nameJapanese: row.name_japanese,
        level: row.level,
        hp: applyMobHp(row.hp, tier),
        sp: row.sp,
        baseExp: row.base_exp,
        jobExp: row.job_exp,
        mvpExp: row.mvp_exp,
        attack: row.attack,
        attack2: row.attack2,
        defense: row.defense,
        magicDefense: row.magic_defense,
        attackRange: row.attack_range,
        element: row.element,
        elementLevel: row.element_level,
        race: row.race,
        size: row.size,
        isMvp: Boolean(row.mode_mvp) || (row.mvp_exp > 0),
        class: row.class,
        summons: getMobSummons(row.id)
    };
}

function mapMobModes(row) {
    const modeFields = [
        'mode_canmove', 'mode_looter', 'mode_aggressive', 'mode_assist',
        'mode_castsensoridle', 'mode_norandomwalk', 'mode_nocast', 'mode_canattack',
        'mode_castsensorchase', 'mode_changechase', 'mode_angry',
        'mode_changetargetmelee', 'mode_changetargetchase', 'mode_targetweak',
        'mode_randomtarget', 'mode_ignoremelee', 'mode_ignoremagic', 'mode_ignoreranged',
        'mode_mvp', 'mode_ignoremisc', 'mode_knockbackimmune', 'mode_teleportblock',
        'mode_fixeditemdrop', 'mode_detector', 'mode_statusimmune', 'mode_skillimmune'
    ];
    const modes = {};
    for (const field of modeFields) {
        modes[field.replace('mode_', '')] = Boolean(row[field]);
    }
    return modes;
}

function extractDrops(row) {
    const drops = [];
    for (const col of mobDropColumns()) {
        const item = row[col.item];
        const rate = row[col.rate];
        if (!item) continue;
        drops.push({
            itemAegis: item,
            rate: rate ?? 0,
            type: col.type
        });
    }
    return drops;
}

function mobTierFromRow(row) {
    return mobTier({
        isMvp: Number(row.mode_mvp) === 1 || Number(row.mvp_exp) > 0,
        isBoss: String(row.class || row.mob_class || '').toLowerCase() === 'boss'
    });
}

async function fetchDropItemInfo(drops) {
    if (drops.length === 0) return new Map();

    const aegisNames = [...new Set(drops.map((d) => d.itemAegis))];
    const placeholders = aegisNames.map(() => '?').join(', ');
    const items = await query(
        `SELECT id, name_aegis, name_english, type FROM ${effectiveItemsSql('i')}
         WHERE name_aegis IN (${placeholders})`,
        aegisNames
    );
    return new Map(items.map((item) => [item.name_aegis, item]));
}

async function fetchItemTypes(aegisNames) {
    if (aegisNames.length === 0) return new Map();

    const placeholders = aegisNames.map(() => '?').join(', ');
    const items = await query(
        `SELECT name_aegis, type FROM ${effectiveItemsSql('i')}
         WHERE name_aegis IN (${placeholders})`,
        aegisNames
    );
    return new Map(items.map((item) => [item.name_aegis, item.type]));
}

function adjustDrop(drop, item, tier) {
    const multiplier = dropMultiplier(tier, drop.type, item?.type);
    const rate = applyDropRate(drop.rate, multiplier);
    return {
        itemId: item?.id ?? null,
        itemName: getItemDisplayName(item?.id) ?? item?.name_english ?? drop.itemAegis,
        itemAegis: drop.itemAegis,
        itemType: item?.type ?? null,
        baseRate: drop.rate,
        rate,
        type: drop.type,
        chancePercent: rateToPercent(rate)
    };
}

function applyEffectiveMvpRates(drops) {
    const mvpDrops = drops.filter((drop) => drop.type === 'mvp');
    if (mvpDrops.length === 0) return drops;

    const rates = effectiveMvpRates(mvpDrops.map((drop) => drop.rate));
    let mvpIndex = 0;
    return drops.map((drop) => {
        if (drop.type !== 'mvp') return drop;
        const rate = rates[mvpIndex++];
        return { ...drop, rate, chancePercent: rateToPercent(rate) };
    });
}

function mvpSiblingColumnsSql(alias = 'm') {
    return mobDropColumns()
        .filter((column) => column.type === 'mvp')
        .map((column) => `, ${alias}.${column.item} AS ${column.item}_sibling, ${alias}.${column.rate} AS ${column.rate}_sibling`)
        .join('');
}

function effectiveMvpRatesForRow(row) {
    const mvpColumns = mobDropColumns().filter((column) => column.type === 'mvp');
    const items = mvpColumns.map((column) => row[`${column.item}_sibling`]);
    const rates = mvpColumns.map((column) =>
        applyDropRate(Number(row[`${column.rate}_sibling`]) || 0, MVP_REWARD_RATE)
    );
    const effective = effectiveMvpRates(rates);
    const byItem = new Map();
    items.forEach((item, index) => {
        if (!item || effective[index] <= 0) return;
        byItem.set(item, Math.max(byItem.get(item) ?? 0, effective[index]));
    });
    return byItem;
}

function mapMobDetailFromRow(row, drops = []) {
    return {
        ...mapMobSummary(row),
        str: row.str,
        agi: row.agi,
        vit: row.vit,
        int: row.int,
        dex: row.dex,
        luk: row.luk,
        walkSpeed: row.walk_speed,
        attackDelay: row.attack_delay,
        skillRange: row.skill_range,
        chaseRange: row.chase_range,
        ai: row.ai,
        modes: mapMobModes(row),
        drops
    };
}

export async function attachSpawnSummaries(targets) {
    if (!Array.isArray(targets) || targets.length === 0) return targets;

    if (!isSpawnDataAvailable()) {
        for (const target of targets) {
            target.spawnMaps = [];
            target.spawnMapCount = 0;
            target.spawnAmount = 0;
            target.hasWorldSpawn = undefined;
        }
        return targets;
    }

    const ids = [...new Set(targets.map((target) => Number(target.id)).filter(Number.isFinite))];
    if (ids.length === 0) return targets;

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
        `SELECT mob_id, map,
                SUM(amount) AS amount,
                COUNT(*) AS points,
                MAX(is_boss) AS boss,
                MAX(is_instance) AS instance
         FROM ${spawnTableSql('s')}
         WHERE mob_id IN (${placeholders})
         GROUP BY mob_id, map
         ORDER BY mob_id ASC, instance ASC, map ASC`,
        ids
    );

    const byMob = new Map();
    for (const row of rows) {
        const mobId = Number(row.mob_id);
        if (!byMob.has(mobId)) byMob.set(mobId, []);
        byMob.get(mobId).push({
            map: row.map,
            mapName: row.map,
            amount: Number(row.amount) || 0,
            points: Number(row.points) || 0,
            boss: Boolean(row.boss),
            instance: Boolean(row.instance)
        });
    }

    for (const target of targets) {
        const maps = byMob.get(Number(target.id)) || [];
        target.spawnMaps = maps;
        target.spawnMapCount = maps.length;
        target.spawnAmount = maps.reduce((sum, item) => sum + item.amount, 0);
        target.hasWorldSpawn = maps.some((item) => !item.instance);
    }

    return targets;
}

export async function getMobSpawns(mobId) {
    if (!isSpawnDataAvailable()) return [];

    const rows = await query(
        `SELECT map, x, y, xs, ys, amount, delay, delay2,
                is_boss, is_instance, source_file, source_line
         FROM ${spawnTableSql('s')}
         WHERE mob_id = ?
         ORDER BY is_instance ASC, map ASC, amount DESC, x ASC, y ASC`,
        [mobId]
    );

    return rows.map((row) => ({
        map: row.map,
        mapName: row.map,
        x: row.x,
        y: row.y,
        xs: row.xs,
        ys: row.ys,
        amount: Number(row.amount) || 0,
        delay: row.delay,
        delay2: row.delay2,
        boss: Boolean(row.is_boss),
        instance: Boolean(row.is_instance),
        source: {
            file: row.source_file,
            line: row.source_line
        }
    }));
}

async function attachDropsToMobRows(rows) {
    if (rows.length === 0) return [];

    const dropsByMob = rows.map((row) => extractDrops(row));
    const itemInfo = await fetchDropItemInfo(dropsByMob.flat());

    return rows.map((row, index) => {
        const tier = mobTierFromRow(row);
        const drops = applyEffectiveMvpRates(
            dropsByMob[index]
                .map((drop) => adjustDrop(drop, itemInfo.get(drop.itemAegis), tier))
        );
        return mapMobDetailFromRow(row, drops);
    });
}

function buildMobFilters(params) {
    const conditions = [];
    const values = [];

    if (params.q) {
        const term = params.q.trim();
        if (/^\d+$/.test(term)) {
            conditions.push('m.id = ?');
            values.push(parseInt(term, 10));
        } else {
            conditions.push('(m.name_english LIKE ? OR m.name_aegis LIKE ?)');
            const like = `%${term}%`;
            values.push(like, like);
        }
    }

    const elements = parseCsv(params.element);
    if (elements.length > 0) {
        conditions.push(`m.element IN (${elements.map(() => '?').join(', ')})`);
        values.push(...elements);
    }

    const races = parseCsv(params.race);
    if (races.length > 0) {
        conditions.push(`m.race IN (${races.map(() => '?').join(', ')})`);
        values.push(...races);
    }

    const sizes = parseCsv(params.size);
    if (sizes.length > 0) {
        conditions.push(`m.size IN (${sizes.map(() => '?').join(', ')})`);
        values.push(...sizes);
    }

    const levelMin = parseIntParam(params.levelMin);
    if (levelMin !== null) {
        conditions.push('m.level >= ?');
        values.push(levelMin);
    }

    const levelMax = parseIntParam(params.levelMax);
    if (levelMax !== null) {
        conditions.push('m.level <= ?');
        values.push(levelMax);
    }

    const baseExpMin = parseIntParam(params.baseExpMin);
    if (baseExpMin !== null) {
        conditions.push('m.base_exp >= ?');
        values.push(baseExpMin);
    }

    const baseExpMax = parseIntParam(params.baseExpMax);
    if (baseExpMax !== null) {
        conditions.push('m.base_exp <= ?');
        values.push(baseExpMax);
    }

    const jobExpMin = parseIntParam(params.jobExpMin);
    if (jobExpMin !== null) {
        conditions.push('m.job_exp >= ?');
        values.push(jobExpMin);
    }

    const jobExpMax = parseIntParam(params.jobExpMax);
    if (jobExpMax !== null) {
        conditions.push('m.job_exp <= ?');
        values.push(jobExpMax);
    }

    const attackRange = parseIntParam(params.attackRange);
    if (attackRange !== null) {
        conditions.push('m.attack_range = ?');
        values.push(attackRange);
    }

    const mvp = parseBool(params.mvp);
    if (mvp === true) {
        conditions.push('(m.mode_mvp = 1 OR m.mvp_exp > 0)');
    } else if (mvp === false) {
        conditions.push('(COALESCE(m.mode_mvp, 0) = 0 AND COALESCE(m.mvp_exp, 0) = 0)');
    }

    const hasSpawn = parseBool(params.hasSpawn);
    if (hasSpawn !== null && isSpawnDataAvailable()) {
        const includeInstances = parseBool(params.includeInstances) === true;
        const instanceClause = includeInstances ? '' : ' AND s.is_instance = 0';
        const exists = `EXISTS (
            SELECT 1 FROM ${spawnTableSql('s')}
            WHERE s.mob_id = m.id${instanceClause}
        )`;
        conditions.push(hasSpawn ? exists : `NOT ${exists}`);
    }

    const spawnMap = typeof params.spawnMap === 'string' ? params.spawnMap.trim() : '';
    if (spawnMap && isSpawnDataAvailable()) {
        conditions.push(`EXISTS (
            SELECT 1 FROM ${spawnTableSql('s')}
            WHERE s.mob_id = m.id AND s.map = ?
        )`);
        values.push(spawnMap);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
}

export async function searchMobs(params) {
    const { page, limit, offset } = parsePagination(params);
    const { whereClause, values } = buildMobFilters(params);
    const fromSql = effectiveMobsSql('m');

    const [countRows, rows] = await Promise.all([
        query(
            `SELECT COUNT(*) AS total FROM ${fromSql} ${whereClause}`,
            values
        ),
        query(
            `SELECT m.* FROM ${fromSql}
             ${whereClause}
             ORDER BY m.name_english ASC
             LIMIT ? OFFSET ?`,
            [...values, limit, offset]
        )
    ]);
    const total = Number(countRows[0].total);

    const results = await attachDropsToMobRows(rows);
    await attachSpawnSummaries(results);

    return {
        total,
        page,
        limit,
        results
    };
}

export async function getMobById(id) {
    const rows = await query(
        `SELECT m.* FROM ${effectiveMobsSql('m')} WHERE m.id = ?`,
        [id]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    const drops = extractDrops(row);
    const itemInfo = await fetchDropItemInfo(drops);
    const tier = mobTierFromRow(row);
    const adjustedDrops = applyEffectiveMvpRates(
        drops.map((drop) => adjustDrop(drop, itemInfo.get(drop.itemAegis), tier))
    );
    const mob = mapMobDetailFromRow(row, adjustedDrops);
    mob.spawns = await getMobSpawns(id);
    await attachSpawnSummaries([mob]);
    return mob;
}

export async function getMobMeta() {
    const [elements, races, sizes] = await Promise.all([
        query(`SELECT DISTINCT element AS value FROM ${effectiveMobsSql('m')} WHERE element IS NOT NULL ORDER BY element`),
        query(`SELECT DISTINCT race AS value FROM ${effectiveMobsSql('m')} WHERE race IS NOT NULL ORDER BY race`),
        query(`SELECT DISTINCT size AS value FROM ${effectiveMobsSql('m')} WHERE size IS NOT NULL ORDER BY size`)
    ]);

    return {
        elements: elements.map((r) => r.value),
        races: races.map((r) => r.value),
        sizes: sizes.map((r) => r.value),
        defaults: {
            elements: MOB_ELEMENTS,
            races: MOB_RACES,
            sizes: MOB_SIZES
        }
    };
}

export async function getMobsDroppingItems(itemAegisList) {
    const aegisNames = [...new Set((itemAegisList || []).filter(Boolean))];
    if (aegisNames.length === 0) return new Map();

    const placeholders = aegisNames.map(() => '?').join(', ');
    const dropColumns = mobDropColumns();
    const selects = dropColumns.map((col) => `
        SELECT m.id, m.name_english, m.name_aegis, m.level,
               m.class AS mob_class, m.mode_mvp, m.mvp_exp,
               m.${col.item} AS item_aegis,
               m.${col.rate} AS rate,
               '${col.type}' AS drop_type
               ${mvpSiblingColumnsSql('m')}
        FROM ${effectiveMobsSql('m')}
        WHERE m.${col.item} IN (${placeholders})
    `);
    const params = dropColumns.flatMap(() => aegisNames);

    const rows = await query(
        `(${selects.join(' UNION ALL ')})
         ORDER BY item_aegis ASC, rate DESC, level ASC, name_english ASC`,
        params
    );

    const itemTypes = await fetchItemTypes(aegisNames);

    const mobsById = new Map();
    for (const row of rows) {
        if (!mobsById.has(row.id)) {
            mobsById.set(row.id, {
                id: row.id,
                name: row.name_english,
                nameAegis: row.name_aegis,
                level: row.level
            });
        }
    }
    await attachSpawnSummaries([...mobsById.values()]);

    const byItem = new Map();
    const seen = new Map();
    for (const row of rows) {
        if (!row.item_aegis) continue;
        const dropType = row.drop_type || 'normal';
        const key = `${row.item_aegis}|${row.id}|${dropType}`;
        const baseRate = Number(row.rate) || 0;
        const tier = mobTierFromRow(row);
        const rate = dropType === 'mvp'
            ? (effectiveMvpRatesForRow(row).get(row.item_aegis) ?? 0)
            : applyDropRate(
                baseRate,
                dropMultiplier(tier, dropType, itemTypes.get(row.item_aegis))
            );
        if (rate <= 0) continue;
        const previous = seen.get(key);
        if (previous != null && previous >= rate) continue;
        seen.set(key, rate);

        if (!byItem.has(row.item_aegis)) byItem.set(row.item_aegis, []);
        const mob = mobsById.get(row.id) || {};
        byItem.get(row.item_aegis).push({
            id: mob.id,
            name: mob.name,
            nameAegis: mob.nameAegis,
            level: mob.level,
            baseRate,
            rate,
            dropType,
            chancePercent: rateToPercent(rate),
            spawnMaps: mob.spawnMaps,
            spawnMapCount: mob.spawnMapCount,
            spawnAmount: mob.spawnAmount,
            hasWorldSpawn: mob.hasWorldSpawn
        });
    }

    for (const drops of byItem.values()) {
        drops.sort((a, b) =>
            Number(b.hasWorldSpawn === true) - Number(a.hasWorldSpawn === true) ||
            b.rate - a.rate ||
            a.level - b.level ||
            a.name.localeCompare(b.name)
        );
    }

    return byItem;
}

export async function getMobsDroppingItem(itemAegis) {
    const dropColumns = mobDropColumns();
    const rateCase = dropColumns.map((col) => `WHEN m.${col.item} = ? THEN m.${col.rate}`).join(' ');
    const typeCase = dropColumns.map((col) => `WHEN m.${col.item} = ? THEN '${col.type}'`).join(' ');
    const rateParams = dropColumns.map(() => itemAegis);
    const typeParams = dropColumns.map(() => itemAegis);
    const whereParams = mobDropMatchParams(itemAegis);

    const rows = await query(
        `SELECT m.id, m.name_english, m.name_aegis, m.level,
                m.class AS mob_class, m.mode_mvp, m.mvp_exp,
                CASE ${rateCase} END AS rate,
                CASE ${typeCase} END AS drop_type
                ${mvpSiblingColumnsSql('m')}
         FROM ${effectiveMobsSql('m')}
         WHERE ${mobDropMatchSql('m')}
         ORDER BY rate DESC, m.level ASC, m.name_english ASC`,
        [...rateParams, ...typeParams, ...whereParams]
    );
    const itemTypes = await fetchItemTypes([itemAegis]);
    const itemType = itemTypes.get(itemAegis) ?? null;
    const results = rows.map((row) => {
        const dropType = row.drop_type || 'normal';
        const baseRate = Number(row.rate) || 0;
        const tier = mobTierFromRow(row);
        const rate = dropType === 'mvp'
            ? (effectiveMvpRatesForRow(row).get(itemAegis) ?? 0)
            : applyDropRate(baseRate, dropMultiplier(tier, dropType, itemType));
        if (rate <= 0) return null;
        return {
            id: row.id,
            name: row.name_english,
            nameAegis: row.name_aegis,
            level: row.level,
            baseRate,
            rate,
            dropType,
            chancePercent: rateToPercent(rate)
        };
    }).filter(Boolean);
    await attachSpawnSummaries(results);
    results.sort((a, b) =>
        Number(b.hasWorldSpawn === true) - Number(a.hasWorldSpawn === true) ||
        b.rate - a.rate ||
        a.level - b.level ||
        a.name.localeCompare(b.name)
    );
    return results;
}
