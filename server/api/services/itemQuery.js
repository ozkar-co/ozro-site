/**
 * Item queries against ozro_items (+ scripts / drops). Buy/sell are effective values.
 */
import { query } from '../../services/mariadb.js';
import { getMobsDroppingItem, getMobsDroppingItems } from './mobQuery.js';
import { findItemIdsByDisplayName, getItemDisplayName } from './itemInfo.js';
import {
    buildRelevanceOrderSql,
    buildTokenMatchClause
} from './textSearch.js';
import {
    isNaturalDropIndexReady,
    naturalDropFilterClause
} from './naturalDropIndex.js';
import {
    acquisitionSourceFilterClause,
    isAcquisitionAvailable,
    loadAcquisitionForItems,
    parseAcquisitionSourceTypes
} from './acquisitionQuery.js';
import {
    T,
    isMobDataAvailable,
    isSpawnDataAvailable,
    parsePagination,
    parseCsv,
    parseBool,
    parseJsonColumn,
    ITEM_CLASSES,
    ITEM_ARMOR_DB_TYPES,
    ITEM_LOCATION_JSON_KEYS,
    ITEM_JOB_JSON_KEYS
} from './gameDb.js';

function jsonTruthy(alias, jsonCol, pathKey) {
    // MariaDB: JSON_EXTRACT returns true/false or 1/0 depending on version
    return `(
        JSON_EXTRACT(${alias}.${jsonCol}, '$.${pathKey}') = TRUE
        OR JSON_EXTRACT(${alias}.${jsonCol}, '$.${pathKey}') = 1
        OR JSON_UNQUOTE(JSON_EXTRACT(${alias}.${jsonCol}, '$.${pathKey}')) IN ('true', '1')
    )`;
}

function mapItemLocations(row) {
    const locationsRaw = parseJsonColumn(row.locations, {}) || {};
    const reverse = Object.fromEntries(
        Object.entries(ITEM_LOCATION_JSON_KEYS).map(([api, yaml]) => [yaml, api])
    );
    const locations = {};
    for (const [key, value] of Object.entries(locationsRaw)) {
        if (!value) continue;
        const apiKey = reverse[key] || key;
        locations[apiKey] = true;
    }
    return locations;
}

function mapItemJobs(row) {
    const jobsRaw = parseJsonColumn(row.jobs, null);
    if (!jobsRaw || typeof jobsRaw !== 'object') {
        return { all: false, jobs: [] };
    }
    if (jobsRaw.All || jobsRaw.all) {
        return { all: true, jobs: Object.keys(ITEM_JOB_JSON_KEYS) };
    }
    const reverse = Object.fromEntries(
        Object.entries(ITEM_JOB_JSON_KEYS).map(([api, yaml]) => [yaml.toLowerCase(), api])
    );
    const jobs = [];
    for (const [key, value] of Object.entries(jobsRaw)) {
        if (!value) continue;
        const api = reverse[key.toLowerCase()] || key.toLowerCase();
        jobs.push(api);
    }
    return { all: false, jobs };
}

function mapItemClasses(row) {
    const classesRaw = parseJsonColumn(row.classes, null);
    if (!classesRaw || typeof classesRaw !== 'object') {
        return { all: false, classes: [] };
    }
    // YAML: All / Normal / Upper / Baby / Third / Third_Upper / Third_Baby / Fourth / All_Third / …
    const yamlToApi = {
        all: 'all',
        normal: 'normal',
        upper: 'upper',
        baby: 'baby',
        third: 'third',
        third_upper: 'third_upper',
        third_baby: 'third_baby',
        fourth: 'fourth',
        all_third: 'third' // UI "third" matches All_Third family
    };
    if (classesRaw.All || classesRaw.all) {
        return { all: true, classes: ITEM_CLASSES };
    }
    const classes = [];
    for (const [key, value] of Object.entries(classesRaw)) {
        if (!value) continue;
        const norm = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        const api = yamlToApi[norm] || norm;
        if (ITEM_CLASSES.includes(api) && !classes.includes(api)) classes.push(api);
        if (norm === 'all_third' && !classes.includes('third')) classes.push('third');
    }
    return { all: false, classes };
}

function num(value) {
    if (value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function mapItemSummary(row) {
    return {
        id: num(row.item_id),
        name: getItemDisplayName(row.item_id) || row.display_name || row.name || row.aegis_name,
        nameAegis: row.aegis_name,
        nameEnglish: row.name,
        type: row.type,
        subtype: row.subtype,
        attack: num(row.attack),
        magicAttack: num(row.magic_attack),
        defense: num(row.defense),
        weight: num(row.weight),
        priceBuy: num(row.buy_effective ?? row.buy_base),
        priceSell: num(row.sell_effective ?? row.sell_base),
        slots: num(row.slots),
        equipLevelMin: num(row.equip_level_min),
        equipLevelMax: num(row.equip_level_max)
    };
}

function mapItemDetail(row, scripts = {}) {
    return {
        ...mapItemSummary(row),
        range: row.range_atk,
        weaponLevel: row.weapon_level,
        armorLevel: row.armor_level,
        refineable: row.refineable == null ? null : Boolean(row.refineable),
        gradable: null,
        gender: null,
        script: scripts.Script || null,
        equipScript: scripts.EquipScript || null,
        unequipScript: scripts.UnEquipScript || null,
        jobs: mapItemJobs(row),
        classes: mapItemClasses(row),
        locations: mapItemLocations(row),
        gender: row.gender || null,
        gradable: row.gradable == null ? null : Boolean(row.gradable),
        delay: parseJsonColumn(row.delay, null),
        noUse: parseJsonColumn(row.no_use, null),
        stack: parseJsonColumn(row.stack, null)
    };
}

async function loadScriptsForItems(itemIds) {
    if (!itemIds.length) return new Map();
    try {
        const placeholders = itemIds.map(() => '?').join(', ');
        const rows = await query(
            `SELECT item_id, script_kind, script_body
             FROM \`${T.ITEM_SCRIPTS}\`
             WHERE item_id IN (${placeholders})`,
            itemIds
        );
        const byItem = new Map();
        for (const row of rows) {
            if (!byItem.has(row.item_id)) byItem.set(row.item_id, {});
            byItem.get(row.item_id)[row.script_kind] = row.script_body;
        }
        return byItem;
    } catch {
        return new Map();
    }
}

function buildHasDropExists() {
    return `EXISTS (
        SELECT 1 FROM \`${T.MOB_DROPS}\` d
        WHERE d.item_id = i.item_id AND d.is_map_bonus = 0
    )`;
}

function buildItemFilters(params) {
    const conditions = [];
    const values = [];
    let orderBy = null;

    if (params.q) {
        const term = params.q.trim();
        if (/^\d+$/.test(term)) {
            conditions.push('i.item_id = ?');
            values.push(parseInt(term, 10));
            orderBy = buildRelevanceOrderSql(
                'i',
                ['i.name', 'i.display_name', 'i.aegis_name'],
                term,
                'i.item_id'
            );
        } else {
            const nameIds = findItemIdsByDisplayName(term);
            const tokenMatch = buildTokenMatchClause(
                'i',
                ['i.name', 'i.display_name', 'i.aegis_name'],
                term
            );
            const branches = [];
            const branchValues = [];

            if (tokenMatch) {
                branches.push(`(${tokenMatch.clause})`);
                branchValues.push(...tokenMatch.values);
            }
            if (nameIds.length > 0) {
                branches.push(`i.item_id IN (${nameIds.map(() => '?').join(', ')})`);
                branchValues.push(...nameIds);
            }
            if (branches.length > 0) {
                conditions.push(`(${branches.join(' OR ')})`);
                values.push(...branchValues);
            }
            orderBy = buildRelevanceOrderSql(
                'i',
                ['i.name', 'i.display_name', 'i.aegis_name'],
                term,
                'i.item_id'
            );
        }
    }

    const types = parseCsv(params.type).map((t) => (t === 'Delayconsume' ? 'DelayConsume' : t));
    if (types.length > 0) {
        const typeParts = [];
        const wantsCostume = types.includes('Costume');
        const wantsEnchant = types.includes('Enchant');
        const plainTypes = types.filter((t) => t !== 'Costume' && t !== 'Enchant');

        for (const typeName of plainTypes) {
            if (typeName === 'Armor') {
                // Real gear only — costumes are a separate virtual type.
                typeParts.push(
                    `(i.type IN (${ITEM_ARMOR_DB_TYPES.map(() => '?').join(', ')}) AND COALESCE(i.is_costume, 0) = 0)`
                );
                values.push(...ITEM_ARMOR_DB_TYPES);
            } else if (typeName === 'Card') {
                typeParts.push(
                    `(i.type = 'Card' AND COALESCE(i.item_subcategory, '') <> 'Enchant')`
                );
            } else {
                typeParts.push('i.type = ?');
                values.push(typeName);
            }
        }
        if (wantsCostume) {
            typeParts.push(`(COALESCE(i.is_costume, 0) = 1 OR i.item_category = 'Costume')`);
        }
        if (wantsEnchant) {
            typeParts.push(`(i.type = 'Card' AND i.item_subcategory = 'Enchant')`);
        }
        if (typeParts.length === 1) {
            conditions.push(typeParts[0]);
        } else if (typeParts.length > 1) {
            conditions.push(`(${typeParts.join(' OR ')})`);
        }
    }

    const classes = parseCsv(params.class);
    if (classes.length > 0) {
        // Map UI class tokens → YAML Classes JSON keys
        const classJsonKeys = {
            normal: ['Normal'],
            upper: ['Upper'],
            baby: ['Baby'],
            third: ['Third', 'All_Third'],
            third_upper: ['Third_Upper'],
            third_baby: ['Third_Baby'],
            fourth: ['Fourth']
        };
        const parts = [];
        for (const cls of classes) {
            const keys = classJsonKeys[cls] || [];
            for (const jsonKey of keys) {
                parts.push(jsonTruthy('i', 'classes', jsonKey));
            }
        }
        if (parts.length > 0) {
            conditions.push(`(
                JSON_EXTRACT(i.classes, '$.All') = TRUE
                OR JSON_EXTRACT(i.classes, '$.all') = TRUE
                OR (${parts.join(' OR ')})
            )`);
        }
    }

    const jobs = parseCsv(params.jobs);
    const jobsStrict = parseBool(params.jobsStrict) === true;
    if (jobs.length > 0) {
        const jobConditions = jobs
            .map((job) => ITEM_JOB_JSON_KEYS[job])
            .filter(Boolean)
            .map((jsonKey) => jsonTruthy('i', 'jobs', jsonKey));
        if (jobConditions.length > 0) {
            if (jobsStrict) {
                conditions.push(`(${jobConditions.join(' OR ')})`);
            } else {
                conditions.push(`(
                    JSON_EXTRACT(i.jobs, '$.All') = TRUE
                    OR JSON_EXTRACT(i.jobs, '$.all') = TRUE
                    OR (${jobConditions.join(' OR ')})
                )`);
            }
        }
    }

    const armorSubtypes = parseCsv(params.subtype);
    const costumeSubtypes = parseCsv(params.costumeSubtype);
    const weaponSubtypes = parseCsv(params.weaponSubtype);
    const shadowSubtypes = parseCsv(params.shadowSubtype);
    const ammoSubtypes = parseCsv(params.ammoSubtype);
    const subtypeParts = [];

    // Armor "subtypes" in ozro_* come from item_subcategory / equip_slot_key (subtype column is empty).
    if (armorSubtypes.length > 0) {
        const placeholders = armorSubtypes.map(() => '?').join(', ');
        const armorTypeList = ITEM_ARMOR_DB_TYPES.map(() => '?').join(', ');
        subtypeParts.push(
            `(i.type IN (${armorTypeList}) AND COALESCE(i.is_costume, 0) = 0 AND (
                i.item_subcategory IN (${placeholders})
                OR i.equip_slot_key IN (${placeholders})
                OR i.subtype IN (${placeholders})
            ))`
        );
        values.push(
            ...ITEM_ARMOR_DB_TYPES,
            ...armorSubtypes,
            ...armorSubtypes,
            ...armorSubtypes
        );
    }

    if (costumeSubtypes.length > 0) {
        const placeholders = costumeSubtypes.map(() => '?').join(', ');
        subtypeParts.push(
            `((COALESCE(i.is_costume, 0) = 1 OR i.item_category = 'Costume') AND (
                i.item_subcategory IN (${placeholders})
                OR i.equip_slot_key IN (${placeholders})
            ))`
        );
        values.push(...costumeSubtypes, ...costumeSubtypes);
    }

    if (weaponSubtypes.length > 0) {
        const placeholders = weaponSubtypes.map(() => '?').join(', ');
        subtypeParts.push(
            `(i.type = 'Weapon' AND (i.subtype IN (${placeholders}) OR i.item_subcategory IN (${placeholders})))`
        );
        values.push(...weaponSubtypes, ...weaponSubtypes);
    }

    if (shadowSubtypes.length > 0) {
        const placeholders = shadowSubtypes.map(() => '?').join(', ');
        subtypeParts.push(
            `(i.type = 'Shadowgear' AND (i.item_subcategory IN (${placeholders}) OR i.equip_slot_key IN (${placeholders})))`
        );
        values.push(...shadowSubtypes, ...shadowSubtypes);
    }

    if (ammoSubtypes.length > 0) {
        const placeholders = ammoSubtypes.map(() => '?').join(', ');
        subtypeParts.push(
            `(i.type = 'Ammo' AND (i.subtype IN (${placeholders}) OR i.item_subcategory IN (${placeholders})))`
        );
        values.push(...ammoSubtypes, ...ammoSubtypes);
    }

    if (subtypeParts.length === 1) {
        conditions.push(subtypeParts[0]);
    } else if (subtypeParts.length > 1) {
        conditions.push(`(${subtypeParts.join(' OR ')})`);
    }

    const cardInserts = parseCsv(params.cardInsert);
    if (cardInserts.length > 0) {
        const placeholders = cardInserts.map(() => '?').join(', ');
        conditions.push(
            `(i.type = 'Card' AND (
                i.card_insert_key IN (${placeholders})
                OR i.item_subcategory IN (${placeholders})
            ))`
        );
        values.push(...cardInserts, ...cardInserts);
    }

    if (params.script) {
        const tokenMatch = buildTokenMatchClause('s', ['s.script_body'], params.script);
        if (tokenMatch) {
            conditions.push(`EXISTS (
                SELECT 1 FROM \`${T.ITEM_SCRIPTS}\` s
                WHERE s.item_id = i.item_id AND (${tokenMatch.clause})
            )`);
            values.push(...tokenMatch.values);
        }
    }

    const slots = parseCsv(params.slots);
    if (slots.length > 0) {
        const slotValues = slots.map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
        if (slotValues.length > 0) {
            conditions.push(`i.slots IN (${slotValues.map(() => '?').join(', ')})`);
            values.push(...slotValues);
        }
    }

    const hasDrop = parseBool(params.hasDrop);
    if (hasDrop === true) {
        conditions.push(buildHasDropExists());
    } else if (hasDrop === false) {
        conditions.push(`NOT ${buildHasDropExists()}`);
    }

    const hasNaturalDrop = parseBool(params.hasNaturalDrop);
    if (hasNaturalDrop !== null && isSpawnDataAvailable()) {
        const naturalClause = naturalDropFilterClause('i', hasNaturalDrop);
        if (naturalClause) {
            conditions.push(naturalClause);
        } else if (!isNaturalDropIndexReady()) {
            console.warn('Filtro hasNaturalDrop ignorado: índice de drop natural aún no listo');
        }
    }

    const sourceTypes = parseAcquisitionSourceTypes(params);
    if (sourceTypes.length > 0) {
        const acqFilter = acquisitionSourceFilterClause('i', sourceTypes);
        if (acqFilter) {
            conditions.push(acqFilter.clause);
            values.push(...acqFilter.values);
        } else if (!isAcquisitionAvailable()) {
            console.warn('Filtro sourceType ignorado: ozro_acquisition_outputs no disponible');
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values, orderBy };
}

export async function searchItems(params) {
    const { page, limit, offset } = parsePagination(params);
    const { whereClause, values, orderBy } = buildItemFilters(params);
    const orderSql = orderBy?.orderSql
        ? orderBy.orderSql.replace(/\bi\.id\b/g, 'i.item_id')
        : 'i.name ASC, i.item_id ASC';
    const orderValues = orderBy?.values ?? [];

    const countRows = await query(
        `SELECT COUNT(*) AS total FROM \`${T.ITEMS}\` i ${whereClause}`,
        values
    );
    const rows = await query(
        `SELECT i.* FROM \`${T.ITEMS}\` i
         ${whereClause}
         ORDER BY ${orderSql}
         LIMIT ? OFFSET ?`,
        [...values, ...orderValues, limit, offset]
    );
    const total = Number(countRows[0].total);

    const scripts = await loadScriptsForItems(rows.map((r) => r.item_id));
    const results = rows.map((row) => mapItemDetail(row, scripts.get(row.item_id) || {}));

    if (isMobDataAvailable() && results.length > 0) {
        const dropsByItem = await getMobsDroppingItems(results.map((item) => item.nameAegis));
        for (const item of results) {
            item.droppedBy = dropsByItem.get(item.nameAegis) || [];
        }
    } else {
        for (const item of results) {
            item.droppedBy = [];
        }
    }

    if (isAcquisitionAvailable() && results.length > 0) {
        const acqByItem = await loadAcquisitionForItems(results.map((item) => item.id));
        for (const item of results) {
            item.acquisition = acqByItem.get(Number(item.id)) || null;
        }
    }

    return { total, page, limit, results };
}

export async function getItemById(id) {
    const rows = await query(
        `SELECT i.* FROM \`${T.ITEMS}\` i WHERE i.item_id = ?`,
        [id]
    );
    if (rows.length === 0) return null;

    const scripts = await loadScriptsForItems([id]);
    const item = mapItemDetail(rows[0], scripts.get(Number(id)) || {});
    item.droppedBy = isMobDataAvailable()
        ? await getMobsDroppingItem(rows[0].aegis_name)
        : [];
    if (isAcquisitionAvailable()) {
        const acqByItem = await loadAcquisitionForItems([id]);
        item.acquisition = acqByItem.get(Number(id)) || null;
    }
    return item;
}

export async function getItemMeta() {
    const armorTypePlaceholders = ITEM_ARMOR_DB_TYPES.map(() => '?').join(', ');
    const acquisitionSourcesPromise = isAcquisitionAvailable()
        ? query(
            `SELECT DISTINCT source_type AS value FROM \`${T.ACQUISITION}\`
             WHERE COALESCE(source_type, '') <> ''
             ORDER BY source_type`
        )
        : Promise.resolve([]);

    const [
        types,
        armorSubtypes,
        costumeSubtypes,
        weaponSubtypes,
        cardLocations,
        shadowSubtypes,
        ammoSubtypes,
        acquisitionSources,
        costumeCount,
        enchantCount
    ] = await Promise.all([
        query(`SELECT DISTINCT type AS value FROM \`${T.ITEMS}\` WHERE type IS NOT NULL ORDER BY type`),
        // Real armor only (exclude costumes).
        query(
            `SELECT DISTINCT value FROM (
                SELECT item_subcategory AS value FROM \`${T.ITEMS}\`
                 WHERE type IN (${armorTypePlaceholders})
                   AND COALESCE(is_costume, 0) = 0
                   AND COALESCE(item_subcategory, '') <> ''
                UNION
                SELECT equip_slot_key AS value FROM \`${T.ITEMS}\`
                 WHERE type IN (${armorTypePlaceholders})
                   AND COALESCE(is_costume, 0) = 0
                   AND COALESCE(equip_slot_key, '') <> ''
             ) AS armor_slots
             ORDER BY value`,
            [...ITEM_ARMOR_DB_TYPES, ...ITEM_ARMOR_DB_TYPES]
        ),
        query(
            `SELECT DISTINCT value FROM (
                SELECT item_subcategory AS value FROM \`${T.ITEMS}\`
                 WHERE (COALESCE(is_costume, 0) = 1 OR item_category = 'Costume')
                   AND COALESCE(item_subcategory, '') <> ''
                UNION
                SELECT equip_slot_key AS value FROM \`${T.ITEMS}\`
                 WHERE (COALESCE(is_costume, 0) = 1 OR item_category = 'Costume')
                   AND COALESCE(equip_slot_key, '') <> ''
             ) AS costume_slots
             ORDER BY value`
        ),
        query(
            `SELECT DISTINCT value FROM (
                SELECT subtype AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Weapon' AND COALESCE(subtype, '') <> ''
                UNION
                SELECT item_subcategory AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Weapon' AND COALESCE(item_subcategory, '') <> ''
             ) AS weapon_subs
             ORDER BY value`
        ),
        // Cards only — Enchant is a separate virtual type.
        query(
            `SELECT DISTINCT value FROM (
                SELECT card_insert_key AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Card'
                   AND COALESCE(item_subcategory, '') <> 'Enchant'
                   AND COALESCE(card_insert_key, '') <> ''
                UNION
                SELECT item_subcategory AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Card'
                   AND COALESCE(item_subcategory, '') <> ''
                   AND item_subcategory <> 'Enchant'
             ) AS card_slots
             ORDER BY value`
        ),
        query(
            `SELECT DISTINCT value FROM (
                SELECT item_subcategory AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Shadowgear' AND COALESCE(item_subcategory, '') <> ''
                UNION
                SELECT equip_slot_key AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Shadowgear' AND COALESCE(equip_slot_key, '') <> ''
             ) AS shadow_slots
             ORDER BY value`
        ),
        query(
            `SELECT DISTINCT value FROM (
                SELECT subtype AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Ammo' AND COALESCE(subtype, '') <> ''
                UNION
                SELECT item_subcategory AS value FROM \`${T.ITEMS}\`
                 WHERE type = 'Ammo' AND COALESCE(item_subcategory, '') <> ''
             ) AS ammo_subs
             ORDER BY value`
        ),
        acquisitionSourcesPromise,
        query(
            `SELECT COUNT(*) AS c FROM \`${T.ITEMS}\`
             WHERE COALESCE(is_costume, 0) = 1 OR item_category = 'Costume'`
        ),
        query(
            `SELECT COUNT(*) AS c FROM \`${T.ITEMS}\`
             WHERE type = 'Card' AND item_subcategory = 'Enchant'`
        )
    ]);

    const typeValues = types.map((r) => r.value).filter(Boolean);
    if (typeValues.length === 0) {
        const err = new Error('ozro_items.type DISTINCT vacío — meta de filtros no usable');
        err.status = 500;
        throw err;
    }

    // Virtual filter types (not ozro_items.type values).
    if (Number(costumeCount[0]?.c || 0) > 0 && !typeValues.includes('Costume')) {
        const armorIdx = typeValues.indexOf('Armor');
        if (armorIdx >= 0) typeValues.splice(armorIdx + 1, 0, 'Costume');
        else typeValues.push('Costume');
    }
    if (Number(enchantCount[0]?.c || 0) > 0 && !typeValues.includes('Enchant')) {
        const cardIdx = typeValues.indexOf('Card');
        if (cardIdx >= 0) typeValues.splice(cardIdx + 1, 0, 'Enchant');
        else typeValues.push('Enchant');
    }

    return {
        types: typeValues,
        armorSubtypes: armorSubtypes.map((r) => r.value),
        costumeSubtypes: costumeSubtypes.map((r) => r.value),
        weaponSubtypes: weaponSubtypes.map((r) => r.value),
        cardLocations: cardLocations.map((r) => r.value),
        shadowSubtypes: shadowSubtypes.map((r) => r.value),
        ammoSubtypes: ammoSubtypes.map((r) => r.value),
        acquisitionSources: acquisitionSources.map((r) => r.value),
        classes: ITEM_CLASSES,
        jobs: Object.keys(ITEM_JOB_JSON_KEYS)
    };
}
