/**
 * Mob / drop / spawn queries against ozro_* (precomputed effective HP/EXP/chances).
 */
import { query } from '../../services/mariadb.js';
import {
    T,
    isSpawnDataAvailable,
    parsePagination,
    parseCsv,
    parseBool,
    parseIntParam,
    parseJsonColumn,
    chanceToPercent,
    isWorldSpawnSql
} from './gameDb.js';
import { getItemDisplayName } from './itemInfo.js';
import {
    buildRelevanceOrderSql,
    buildTokenMatchClause
} from './textSearch.js';

function parseStats(row) {
    const stats = parseJsonColumn(row.stats, null);
    return stats && typeof stats === 'object' ? stats : null;
}

function parseModes(row) {
    // Prefer modes_effective (Ai ∨ YAML Modes ∨ Class). Sparse YAML `modes` is original-only.
    const raw = parseJsonColumn(row.modes_effective, null)
        ?? parseJsonColumn(row.modes, null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const modes = {};
    let any = false;
    for (const [key, value] of Object.entries(raw)) {
        if (!value) continue;
        const normalized = String(key).replace(/^mode_/i, '');
        if (!normalized || normalized.startsWith('_')) continue;
        modes[normalized] = true;
        any = true;
    }
    return any ? modes : null;
}

function num(value) {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function mapMobSummary(row) {
    const stats = parseStats(row);
    return {
        id: num(row.mob_id),
        name: row.name,
        nameAegis: row.aegis_name,
        nameJapanese: row.japanese_name || null,
        level: num(row.level),
        hp: num(row.hp_effective),
        hpBase: num(row.hp_base),
        hpStatus: row.hp_status || null,
        sp: num(row.sp),
        // Effective only — no silent fallback to base (would invent post-rate values).
        baseExp: num(row.base_exp_effective),
        jobExp: num(row.job_exp_effective),
        mvpExp: num(row.mvp_exp_effective),
        attack: num(row.attack),
        attack2: num(row.attack2),
        defense: num(row.defense),
        magicDefense: num(row.magic_defense),
        attackRange: stats ? num(stats.attack_range) : null,
        element: row.element || null,
        elementLevel: num(row.element_level),
        race: row.race || null,
        size: row.size || null,
        isMvp: row.is_mvp == null ? null : Boolean(row.is_mvp),
        class: row.mob_class || null,
        summons: []
    };
}

function mapMobDetailFromRow(row, drops = []) {
    const stats = parseStats(row);
    return {
        ...mapMobSummary(row),
        str: stats ? num(stats.str) : null,
        agi: stats ? num(stats.agi) : null,
        vit: stats ? num(stats.vit) : null,
        int: stats ? num(stats.int) : null,
        dex: stats ? num(stats.dex) : null,
        luk: stats ? num(stats.luk) : null,
        walkSpeed: stats ? num(stats.walk_speed) : null,
        attackDelay: stats ? num(stats.attack_delay) : null,
        skillRange: stats ? num(stats.skill_range) : null,
        chaseRange: stats ? num(stats.chase_range) : null,
        ai: stats && stats.ai != null ? String(stats.ai) : null,
        modes: parseModes(row),
        drops
    };
}

function mapDropCategory(row) {
    const cat = String(row.drop_category || '').toLowerCase();
    if (cat.includes('mvp')) return 'mvp';
    if (String(row.item_type || '').toLowerCase() === 'card') return 'card';
    if (cat) return cat;
    return null;
}

function mapDropRow(row) {
    const rate = num(row.chance_effective);
    const rateUnit = row.rate_unit || null;
    return {
        itemId: num(row.item_id),
        itemName: getItemDisplayName(row.item_id) || row.item_name || row.item_aegis_name || null,
        itemAegis: row.item_aegis_name || null,
        itemType: row.item_type || null,
        baseRate: num(row.chance_base),
        rate,
        type: mapDropCategory(row),
        chancePercent: rate != null && rateUnit
            ? chanceToPercent(rate, rateUnit)
            : null,
        rateUnit,
        isMapBonus: row.is_map_bonus == null ? null : Boolean(row.is_map_bonus)
    };
}

async function fetchDropsForMobs(mobIds, { includeMapBonus = false } = {}) {
    if (!mobIds.length) return new Map();
    const placeholders = mobIds.map(() => '?').join(', ');
    const bonusClause = includeMapBonus ? '' : ' AND d.is_map_bonus = 0';
    const rows = await query(
        `SELECT d.mob_id, d.item_id, d.item_aegis_name, d.drop_category,
                d.chance_base, d.chance_effective, d.rate_unit, d.is_map_bonus,
                i.name AS item_name, i.type AS item_type
         FROM \`${T.MOB_DROPS}\` d
         LEFT JOIN \`${T.ITEMS}\` i ON i.item_id = d.item_id
         WHERE d.mob_id IN (${placeholders})${bonusClause}
         ORDER BY d.chance_effective DESC`,
        mobIds
    );
    const byMob = new Map();
    for (const row of rows) {
        const id = Number(row.mob_id);
        if (!byMob.has(id)) byMob.set(id, []);
        byMob.get(id).push(mapDropRow(row));
    }
    return byMob;
}

async function attachDropsToMobRows(rows) {
    const dropsByMob = await fetchDropsForMobs(rows.map((r) => r.mob_id));
    return rows.map((row) =>
        mapMobDetailFromRow(row, dropsByMob.get(Number(row.mob_id)) || [])
    );
}

async function loadSummonsForMobs(mobIds) {
    if (!mobIds.length) return new Map();
    const placeholders = mobIds.map(() => '?').join(', ');
    const rows = await query(
        `SELECT s.parent_mob_id, s.summoned_mob_id, s.amount, s.summon_kind,
                s.skill_id, s.skill_name, s.conditions,
                m.name AS summoned_name, m.aegis_name AS summoned_aegis
         FROM \`${T.SKILL_SUMMONS}\` s
         LEFT JOIN \`${T.MOBS}\` m ON m.mob_id = s.summoned_mob_id
         WHERE s.parent_mob_id IN (${placeholders})
         ORDER BY s.skill_name, s.summoned_mob_id`,
        mobIds
    );
    const byParent = new Map();
    for (const row of rows) {
        const parent = Number(row.parent_mob_id);
        if (!byParent.has(parent)) byParent.set(parent, []);
        const conditions = parseJsonColumn(row.conditions, null);
        byParent.get(parent).push({
            mobId: num(row.summoned_mob_id),
            mobName: row.summoned_name || null,
            mobAegis: row.summoned_aegis || null,
            amount: num(row.amount),
            kind: row.summon_kind || null,
            skillId: num(row.skill_id),
            skillName: row.skill_name || null,
            conditions: conditions && typeof conditions === 'object' ? conditions : null
        });
    }
    return byParent;
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

    const ids = [...new Set(targets.map((t) => Number(t.id)).filter(Number.isFinite))];
    if (ids.length === 0) return targets;

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
        `SELECT s.mob_id, s.map_id AS map,
                SUM(COALESCE(s.amount, 0)) AS amount,
                COUNT(*) AS points,
                MAX(COALESCE(s.boss_flag, 0)) AS boss,
                MAX(CASE WHEN s.spawn_type = 'instance' OR mp.is_instance = 1 THEN 1 ELSE 0 END) AS instance
         FROM \`${T.SPAWNS}\` s
         LEFT JOIN \`${T.MAPS}\` mp ON mp.map_id = s.map_id
         WHERE s.mob_id IN (${placeholders})
           AND s.map_id IS NOT NULL
           AND s.spawn_type IN ('permanent', 'scripted', 'instance', 'event')
         GROUP BY s.mob_id, s.map_id
         ORDER BY s.mob_id ASC, instance ASC, s.map_id ASC`,
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
        `SELECT s.map_id AS map, s.x, s.y, s.x_area AS xs, s.y_area AS ys,
                s.amount, s.respawn_min AS delay, s.respawn_max AS delay2,
                s.boss_flag AS is_boss,
                CASE WHEN s.spawn_type = 'instance' OR mp.is_instance = 1 THEN 1 ELSE 0 END AS is_instance,
                s.script_path AS source_file, s.script_line AS source_line,
                s.spawn_type, s.spawn_route
         FROM \`${T.SPAWNS}\` s
         LEFT JOIN \`${T.MAPS}\` mp ON mp.map_id = s.map_id
         WHERE s.mob_id = ? AND s.map_id IS NOT NULL
         ORDER BY is_instance ASC, s.map_id ASC, s.amount DESC, s.x ASC, s.y ASC`,
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
        spawnType: row.spawn_type,
        spawnRoute: row.spawn_route,
        source: {
            file: row.source_file,
            line: row.source_line
        }
    }));
}

function buildMobKindFilter(kinds) {
    if (!Array.isArray(kinds) || kinds.length === 0 || kinds.length >= 3) {
        return null;
    }

    // Kind filters use DB flags/class only — no inventing MVP from exp.
    const clauses = [];
    if (kinds.includes('mvp')) {
        clauses.push('COALESCE(m.is_mvp, 0) = 1');
    }
    if (kinds.includes('boss')) {
        clauses.push(
            "(LOWER(COALESCE(m.mob_class, '')) = 'boss' AND COALESCE(m.is_mvp, 0) = 0)"
        );
    }
    if (kinds.includes('normal')) {
        clauses.push(
            "(LOWER(COALESCE(m.mob_class, '')) <> 'boss' AND COALESCE(m.is_mvp, 0) = 0)"
        );
    }

    if (clauses.length === 0) return '1 = 0';
    return `(${clauses.join(' OR ')})`;
}

function buildMobFilters(params) {
    const conditions = [];
    const values = [];
    let orderBy = null;

    if (params.q) {
        const term = params.q.trim();
        if (/^\d+$/.test(term)) {
            conditions.push('m.mob_id = ?');
            values.push(parseInt(term, 10));
            orderBy = buildRelevanceOrderSql(
                'm',
                ['m.name', 'm.aegis_name', 'm.japanese_name'],
                term,
                'm.mob_id'
            );
        } else {
            const tokenMatch = buildTokenMatchClause(
                'm',
                ['m.name', 'm.aegis_name', 'm.japanese_name'],
                term
            );
            if (tokenMatch) {
                conditions.push(`(${tokenMatch.clause})`);
                values.push(...tokenMatch.values);
            }
            orderBy = buildRelevanceOrderSql(
                'm',
                ['m.name', 'm.aegis_name', 'm.japanese_name'],
                term,
                'm.mob_id'
            );
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
        conditions.push('m.base_exp_effective >= ?');
        values.push(baseExpMin);
    }

    const baseExpMax = parseIntParam(params.baseExpMax);
    if (baseExpMax !== null) {
        conditions.push('m.base_exp_effective <= ?');
        values.push(baseExpMax);
    }

    const jobExpMin = parseIntParam(params.jobExpMin);
    if (jobExpMin !== null) {
        conditions.push('m.job_exp_effective >= ?');
        values.push(jobExpMin);
    }

    const jobExpMax = parseIntParam(params.jobExpMax);
    if (jobExpMax !== null) {
        conditions.push('m.job_exp_effective <= ?');
        values.push(jobExpMax);
    }

    const kinds = parseCsv(params.kinds).map((k) => k.toLowerCase());
    const kindFilter = buildMobKindFilter(kinds);
    if (kindFilter) {
        conditions.push(kindFilter);
    } else {
        const mvp = parseBool(params.mvp);
        if (mvp === true) {
            conditions.push('COALESCE(m.is_mvp, 0) = 1');
        } else if (mvp === false) {
            conditions.push('COALESCE(m.is_mvp, 0) = 0');
        }
    }

    const hasSpawn = parseBool(params.hasSpawn);
    if (hasSpawn !== null && isSpawnDataAvailable()) {
        const includeInstances = parseBool(params.includeInstances) === true;
        const instanceClause = includeInstances
            ? ''
            : ` AND ${isWorldSpawnSql('s')}`;
        const exists = `EXISTS (
            SELECT 1 FROM \`${T.SPAWNS}\` s
            WHERE s.mob_id = m.mob_id AND s.map_id IS NOT NULL${instanceClause}
        )`;
        conditions.push(hasSpawn ? exists : `NOT ${exists}`);
    }

    const spawnMap = typeof params.spawnMap === 'string' ? params.spawnMap.trim() : '';
    if (spawnMap && isSpawnDataAvailable()) {
        conditions.push(`EXISTS (
            SELECT 1 FROM \`${T.SPAWNS}\` s
            WHERE s.mob_id = m.mob_id AND s.map_id = ?
        )`);
        values.push(spawnMap);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values, orderBy };
}

export async function searchMobs(params) {
    const { page, limit, offset } = parsePagination(params);
    const { whereClause, values, orderBy } = buildMobFilters(params);
    const orderSql = orderBy?.orderSql
        ? orderBy.orderSql.replace(/\bm\.id\b/g, 'm.mob_id')
        : 'm.name ASC, m.mob_id ASC';
    const orderValues = orderBy?.values ?? [];

    const [countRows, rows] = await Promise.all([
        query(
            `SELECT COUNT(*) AS total FROM \`${T.MOBS}\` m ${whereClause}`,
            values
        ),
        query(
            `SELECT m.* FROM \`${T.MOBS}\` m
             ${whereClause}
             ORDER BY ${orderSql}
             LIMIT ? OFFSET ?`,
            [...values, ...orderValues, limit, offset]
        )
    ]);
    const total = Number(countRows[0].total);

    const results = await attachDropsToMobRows(rows);
    const summons = await loadSummonsForMobs(results.map((r) => r.id));
    for (const mob of results) {
        mob.summons = summons.get(Number(mob.id)) || [];
    }
    await attachSpawnSummaries(results);

    return { total, page, limit, results };
}

export async function getMobById(id) {
    const rows = await query(
        `SELECT m.* FROM \`${T.MOBS}\` m WHERE m.mob_id = ?`,
        [id]
    );
    if (rows.length === 0) return null;

    const [detail] = await attachDropsToMobRows(rows);
    const summons = await loadSummonsForMobs([id]);
    detail.summons = summons.get(Number(id)) || [];
    detail.spawns = await getMobSpawns(id);
    await attachSpawnSummaries([detail]);
    return detail;
}

export async function getMobMeta() {
    const [elements, races, sizes, classes] = await Promise.all([
        query(`SELECT DISTINCT element AS value FROM \`${T.MOBS}\` WHERE COALESCE(element, '') <> '' ORDER BY element`),
        query(`SELECT DISTINCT race AS value FROM \`${T.MOBS}\` WHERE COALESCE(race, '') <> '' ORDER BY race`),
        query(`SELECT DISTINCT size AS value FROM \`${T.MOBS}\` WHERE COALESCE(size, '') <> '' ORDER BY size`),
        query(`SELECT DISTINCT mob_class AS value FROM \`${T.MOBS}\` WHERE COALESCE(mob_class, '') <> '' ORDER BY mob_class`)
    ]);

    const elementValues = elements.map((r) => r.value).filter(Boolean);
    const raceValues = races.map((r) => r.value).filter(Boolean);
    const sizeValues = sizes.map((r) => r.value).filter(Boolean);
    if (elementValues.length === 0 || raceValues.length === 0 || sizeValues.length === 0) {
        const err = new Error(
            'ozro_mobs meta incompleto: DISTINCT element/race/size vacío — sin fallback'
        );
        err.status = 500;
        throw err;
    }

    return {
        elements: elementValues,
        races: raceValues,
        sizes: sizeValues,
        classes: classes.map((r) => r.value).filter(Boolean)
    };
}

async function buildDroppedByList(itemIdsOrAegis, { byAegis = false } = {}) {
    if (!itemIdsOrAegis.length) return byAegis ? new Map() : [];

    const placeholders = itemIdsOrAegis.map(() => '?').join(', ');
    const keyCol = byAegis ? 'd.item_aegis_name' : 'd.item_id';
    const rows = await query(
        `SELECT d.item_id, d.item_aegis_name, d.chance_base, d.chance_effective,
                d.rate_unit, d.drop_category, d.is_map_bonus,
                m.mob_id AS id, m.name, m.aegis_name AS nameAegis, m.level
         FROM \`${T.MOB_DROPS}\` d
         JOIN \`${T.MOBS}\` m ON m.mob_id = d.mob_id
         WHERE ${keyCol} IN (${placeholders})
           AND d.is_map_bonus = 0
         ORDER BY d.chance_effective DESC, m.level ASC, m.name ASC`,
        itemIdsOrAegis
    );

    const mobs = [];
    const seenMob = new Set();
    for (const row of rows) {
        if (seenMob.has(row.id)) continue;
        seenMob.add(row.id);
        mobs.push({
            id: row.id,
            name: row.name,
            nameAegis: row.nameAegis,
            level: row.level
        });
    }
    await attachSpawnSummaries(mobs);
    const mobMeta = new Map(mobs.map((m) => [m.id, m]));

    const mapRow = (row) => {
        const rate = num(row.chance_effective);
        const rateUnit = row.rate_unit || null;
        const cat = String(row.drop_category || '').toLowerCase();
        const mob = mobMeta.get(row.id) || {};
        return {
            id: row.id,
            name: row.name,
            nameAegis: row.nameAegis,
            level: num(row.level),
            baseRate: num(row.chance_base),
            rate,
            dropType: cat.includes('mvp') ? 'mvp' : (cat || null),
            chancePercent: rate != null && rateUnit
                ? chanceToPercent(rate, rateUnit)
                : null,
            spawnMaps: mob.spawnMaps,
            spawnMapCount: mob.spawnMapCount,
            spawnAmount: mob.spawnAmount,
            hasWorldSpawn: mob.hasWorldSpawn
        };
    };

    if (!byAegis) {
        return rows.map(mapRow).sort((a, b) =>
            Number(b.hasWorldSpawn === true) - Number(a.hasWorldSpawn === true) ||
            b.rate - a.rate ||
            a.level - b.level ||
            a.name.localeCompare(b.name)
        );
    }

    const byItem = new Map();
    for (const row of rows) {
        const key = row.item_aegis_name;
        if (!byItem.has(key)) byItem.set(key, []);
        byItem.get(key).push(mapRow(row));
    }
    for (const list of byItem.values()) {
        list.sort((a, b) =>
            Number(b.hasWorldSpawn === true) - Number(a.hasWorldSpawn === true) ||
            b.rate - a.rate ||
            a.level - b.level ||
            a.name.localeCompare(b.name)
        );
    }
    return byItem;
}

export async function getMobsDroppingItems(itemAegisList) {
    const aegisNames = [...new Set((itemAegisList || []).filter(Boolean))];
    if (aegisNames.length === 0) return new Map();
    return buildDroppedByList(aegisNames, { byAegis: true });
}

export async function getMobsDroppingItem(itemAegis) {
    if (!itemAegis) return [];
    const map = await buildDroppedByList([itemAegis], { byAegis: true });
    return map.get(itemAegis) || [];
}

export async function getMobsDroppingItemId(itemId) {
    return buildDroppedByList([itemId], { byAegis: false });
}
