/**
 * Item acquisition from ozro_acquisition_outputs (+ light enrichment).
 * Usable groupings for encyclopedia — not a raw row dump.
 */
import { query } from '../../services/mariadb.js';
import {
    T,
    OZRO_PREFIX,
    chanceToPercent,
    parseBool
} from './gameDb.js';

const SHOP_LIST_CAP = 20;
const BOX_LIST_CAP = 25;
const NPC_REWARD_CAP = 15;
const BARTER_CAP = 15;
const OTHER_CAP = 10;

export const ACQUISITION_SOURCE_TYPES = [
    'mob_drop',
    'map_drop',
    'npc_shop',
    'npc_barter',
    'box_reward',
    'crafting',
    'npc_reward',
    'quest_drop',
    'socketing',
    'enchanting'
];

const SOURCE_LABELS = {
    mob_drop: 'Drop de monstruo',
    map_drop: 'Drop de mapa',
    npc_shop: 'Tienda NPC',
    npc_barter: 'Trueque',
    box_reward: 'Cofre / caja',
    crafting: 'Crafteo',
    npc_reward: 'Recompensa NPC',
    quest_drop: 'Drop de quest',
    socketing: 'Socket',
    enchanting: 'Enchant'
};

let acquisitionAvailable = false;

export function setAcquisitionAvailable(value) {
    acquisitionAvailable = Boolean(value);
}

export function isAcquisitionAvailable() {
    return acquisitionAvailable;
}

function n(value) {
    if (value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function cleanNpcName(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    const hash = s.indexOf('#');
    return hash > 0 ? s.slice(0, hash).trim() : s;
}

function formatBoxChance(probability, unit, chanceStatus) {
    if (chanceStatus === 'guaranteed_all') {
        return { label: 'Garantizado', percent: 100 };
    }
    if (chanceStatus === 'zero_pool') {
        return { label: 'Sin chance (pool vacío)', percent: 0 };
    }
    const p = n(probability);
    if (p == null) return { label: null, percent: null };

    if (unit === 'per_10000' || unit === 'per_100000') {
        return {
            label: `${chanceToPercent(p, unit).toFixed(2)}%`,
            percent: chanceToPercent(p, unit)
        };
    }
    // raw_group_rate / unknown — do not invent a percent
    return { label: `peso ${p} en el grupo`, percent: null };
}

function formatRecipeSuccess(status, chance, unit) {
    if (status === 'variable') {
        return { label: 'Éxito variable (fórmula del skill)', percent: null, variable: true };
    }
    if (chance == null) {
        return { label: status || null, percent: null, variable: false };
    }
    const pct = chanceToPercent(chance, unit || 'per_10000');
    return { label: `${pct.toFixed(2)}%`, percent: pct, variable: false };
}

/**
 * Batch load acquisition for many items. Returns Map<itemId, AcquisitionPayload>.
 */
export async function loadAcquisitionForItems(itemIds) {
    const ids = [...new Set((itemIds || []).map((id) => Number(id)).filter((id) => id > 0))];
    const empty = new Map();
    if (!acquisitionAvailable || ids.length === 0) return empty;

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
        `SELECT acquisition_output_id, source_type, source_ref, item_id,
                quantity_min, quantity_max, probability, probability_unit,
                price, stock, zeny, refine, barter_name, box_id, group_name,
                algorithm, chance_status, npc_id, map_id, mob_id,
                command, script_path, role, list_index
         FROM \`${T.ACQUISITION}\`
         WHERE item_id IN (${placeholders})
         ORDER BY source_type, list_index, acquisition_output_id`,
        ids
    );

    const byItem = new Map();
    for (const id of ids) byItem.set(id, []);
    for (const row of rows) {
        const list = byItem.get(Number(row.item_id));
        if (list) list.push(row);
    }

    const shopRefs = [];
    const boxIds = new Set();
    const recipeIds = new Set();
    const barterItemIds = new Set();
    const npcIds = new Set();

    for (const row of rows) {
        if (row.source_type === 'npc_shop' && row.source_ref) shopRefs.push(row.source_ref);
        if (row.box_id) boxIds.add(row.box_id);
        if (row.source_type === 'crafting' && row.source_ref) recipeIds.add(row.source_ref);
        if (row.source_type === 'npc_barter' && row.source_ref) barterItemIds.add(row.source_ref);
        if (row.npc_id) npcIds.add(row.npc_id);
    }

    const [shopMap, openerMap, recipeMap, barterReqMap, npcMap] = await Promise.all([
        loadShopMeta(shopRefs),
        loadBoxOpeners([...boxIds]),
        loadRecipes([...recipeIds]),
        loadBarterRequirements([...barterItemIds]),
        loadNpcs([...npcIds])
    ]);

    const result = new Map();
    for (const id of ids) {
        result.set(id, buildPayload(byItem.get(id) || [], {
            shopMap,
            openerMap,
            recipeMap,
            barterReqMap,
            npcMap
        }));
    }
    return result;
}

export async function getAcquisitionForItem(itemId) {
    const map = await loadAcquisitionForItems([itemId]);
    return map.get(Number(itemId)) || emptyPayload();
}

function emptyPayload() {
    return {
        available: acquisitionAvailable,
        summary: {},
        labels: SOURCE_LABELS,
        shops: [],
        boxes: [],
        crafting: [],
        barters: [],
        npcRewards: [],
        questDrops: [],
        mapDrops: [],
        other: [],
        /** Drop rows live in droppedBy (richer spawn data); counts only here. */
        dropCount: 0,
        mapDropCount: 0
    };
}

function buildPayload(rows, ctx) {
    const summary = {};
    for (const row of rows) {
        const t = row.source_type || 'other';
        summary[t] = (summary[t] || 0) + 1;
    }

    const shops = [];
    const boxes = [];
    const crafting = [];
    const barters = [];
    const npcRewards = [];
    const questDrops = [];
    const mapDrops = [];
    const other = [];

    for (const row of rows) {
        const type = row.source_type;
        if (type === 'mob_drop') continue;

        if (type === 'npc_shop') {
            if (shops.length >= SHOP_LIST_CAP) continue;
            const meta = ctx.shopMap.get(row.source_ref) || {};
            const npc = ctx.npcMap.get(row.npc_id) || ctx.npcMap.get(meta.npcId) || {};
            shops.push({
                shopId: meta.shopId || null,
                shopName: cleanNpcName(meta.shopName) || cleanNpcName(npc.name) || 'Tienda',
                mapId: meta.mapId || npc.mapId || row.map_id || null,
                x: meta.x ?? npc.x ?? null,
                y: meta.y ?? npc.y ?? null,
                price: n(meta.priceEffective) ?? n(row.price),
                priceSource: meta.priceSource || null,
                runtimeMutated: Boolean(meta.runtimeMutated),
                inventoryDeclared: meta.inventoryDeclared != null
                    ? Boolean(meta.inventoryDeclared)
                    : null,
                stock: n(row.stock) ?? n(meta.stock)
            });
            continue;
        }

        if (type === 'box_reward') {
            if (boxes.length >= BOX_LIST_CAP) continue;
            const chance = formatBoxChance(
                row.probability,
                row.probability_unit,
                row.chance_status
            );
            boxes.push({
                boxId: row.box_id,
                groupName: row.group_name,
                algorithm: row.algorithm || null,
                chanceStatus: row.chance_status || null,
                chanceLabel: chance.label,
                chancePercent: chance.percent,
                quantityMin: n(row.quantity_min),
                quantityMax: n(row.quantity_max),
                openers: ctx.openerMap.get(row.box_id) || []
            });
            continue;
        }

        if (type === 'crafting') {
            const recipe = ctx.recipeMap.get(row.source_ref) || {};
            const success = formatRecipeSuccess(
                recipe.successStatus || null,
                recipe.successChance ?? row.probability,
                recipe.successChanceUnit || row.probability_unit
            );
            crafting.push({
                recipeId: row.source_ref,
                family: recipe.family || null,
                skillName: recipe.skillName || null,
                skillLevel: n(recipe.skillLevel),
                amount: n(recipe.resultAmount) ?? n(row.quantity_min) ?? 1,
                zenyCost: n(recipe.zenyCost),
                successStatus: recipe.successStatus || null,
                successLabel: success.label,
                successPercent: success.percent,
                successVariable: success.variable
            });
            continue;
        }

        if (type === 'npc_barter') {
            if (barters.length >= BARTER_CAP) continue;
            barters.push({
                barterName: row.barter_name || null,
                zeny: n(row.zeny),
                refine: n(row.refine),
                quantity: n(row.quantity_min) ?? 1,
                requires: ctx.barterReqMap.get(row.source_ref) || []
            });
            continue;
        }

        if (type === 'npc_reward') {
            if (npcRewards.length >= NPC_REWARD_CAP) continue;
            const npc = ctx.npcMap.get(row.npc_id) || {};
            npcRewards.push({
                npcName: cleanNpcName(npc.displayName || npc.name) || 'NPC',
                mapId: row.map_id || npc.mapId || null,
                quantityMin: n(row.quantity_min),
                quantityMax: n(row.quantity_max),
                command: row.command || null,
                scriptPath: row.script_path || null
            });
            continue;
        }

        if (type === 'quest_drop') {
            questDrops.push({
                sourceRef: row.source_ref,
                mapId: row.map_id || null,
                mobId: n(row.mob_id),
                probability: n(row.probability),
                probabilityUnit: row.probability_unit || null
            });
            continue;
        }

        if (type === 'map_drop') {
            if (mapDrops.length >= OTHER_CAP) continue;
            mapDrops.push({
                mapId: row.map_id || null,
                mobId: n(row.mob_id),
                probability: n(row.probability),
                probabilityUnit: row.probability_unit || null
            });
            continue;
        }

        if (other.length < OTHER_CAP) {
            other.push({
                sourceType: type,
                label: SOURCE_LABELS[type] || type,
                sourceRef: row.source_ref,
                mapId: row.map_id || null,
                npcId: row.npc_id || null
            });
        }
    }

    return {
        available: true,
        summary,
        labels: SOURCE_LABELS,
        shops,
        shopTotal: summary.npc_shop || 0,
        boxes,
        boxTotal: summary.box_reward || 0,
        crafting,
        barters,
        barterTotal: summary.npc_barter || 0,
        npcRewards,
        npcRewardTotal: summary.npc_reward || 0,
        questDrops,
        mapDrops,
        mapDropCount: summary.map_drop || 0,
        other,
        dropCount: summary.mob_drop || 0
    };
}

async function loadShopMeta(sourceRefs) {
    const map = new Map();
    const refs = [...new Set(sourceRefs.filter(Boolean))];
    if (refs.length === 0) return map;

    const shopsTable = `${OZRO_PREFIX}npc_shops`;
    const itemsTable = `${OZRO_PREFIX}npc_shop_items`;
    const placeholders = refs.map(() => '?').join(', ');
    const rows = await query(
        `SELECT si.shop_id, si.item_id, si.price, si.price_effective, si.price_source, si.stock,
                s.shop_name, s.map_id, s.x, s.y, s.npc_id, s.runtime_mutated, s.inventory_declared
         FROM \`${itemsTable}\` si
         JOIN \`${shopsTable}\` s ON s.shop_id = si.shop_id
         WHERE CONCAT(si.shop_id, ':', si.item_id) IN (${placeholders})`,
        refs
    );

    for (const row of rows) {
        const key = `${row.shop_id}:${row.item_id}`;
        map.set(key, {
            shopId: row.shop_id,
            shopName: row.shop_name,
            mapId: row.map_id,
            x: n(row.x),
            y: n(row.y),
            npcId: row.npc_id,
            priceEffective: n(row.price_effective),
            priceSource: row.price_source,
            stock: n(row.stock),
            runtimeMutated: row.runtime_mutated,
            inventoryDeclared: row.inventory_declared
        });
    }
    return map;
}

async function loadBoxOpeners(boxIds) {
    const map = new Map();
    if (boxIds.length === 0) return map;

    const linksTable = `${OZRO_PREFIX}box_item_links`;
    const placeholders = boxIds.map(() => '?').join(', ');
    const rows = await query(
        `SELECT l.box_id, l.item_id, i.name, i.aegis_name
         FROM \`${linksTable}\` l
         JOIN \`${T.ITEMS}\` i ON i.item_id = l.item_id
         WHERE l.box_id IN (${placeholders})
         ORDER BY l.item_id`,
        boxIds
    );

    for (const row of rows) {
        const list = map.get(row.box_id) || [];
        list.push({
            id: Number(row.item_id),
            name: row.name,
            nameAegis: row.aegis_name
        });
        map.set(row.box_id, list);
    }
    return map;
}

async function loadRecipes(recipeIds) {
    const map = new Map();
    if (recipeIds.length === 0) return map;

    const table = `${OZRO_PREFIX}recipes`;
    const placeholders = recipeIds.map(() => '?').join(', ');
    const rows = await query(
        `SELECT recipe_id, recipe_family, success_status, success_chance, success_chance_unit,
                require_skill_name, require_skill_lv, result_amount, zeny_cost
         FROM \`${table}\`
         WHERE recipe_id IN (${placeholders})`,
        recipeIds
    );

    for (const row of rows) {
        map.set(row.recipe_id, {
            family: row.recipe_family,
            successStatus: row.success_status,
            successChance: n(row.success_chance),
            successChanceUnit: row.success_chance_unit,
            skillName: row.require_skill_name,
            skillLevel: n(row.require_skill_lv),
            resultAmount: n(row.result_amount),
            zenyCost: n(row.zeny_cost)
        });
    }
    return map;
}

async function loadBarterRequirements(barterItemIds) {
    const map = new Map();
    if (barterItemIds.length === 0) return map;

    const table = `${OZRO_PREFIX}barter_required_items`;
    const placeholders = barterItemIds.map(() => '?').join(', ');
    const rows = await query(
        `SELECT r.barter_item_id, r.item_id, r.amount, i.name
         FROM \`${table}\` r
         LEFT JOIN \`${T.ITEMS}\` i ON i.item_id = r.item_id
         WHERE r.barter_item_id IN (${placeholders})
         ORDER BY r.item_id`,
        barterItemIds
    );

    for (const row of rows) {
        const list = map.get(row.barter_item_id) || [];
        list.push({
            id: Number(row.item_id),
            name: row.name || `#${row.item_id}`,
            amount: n(row.amount) ?? 1
        });
        map.set(row.barter_item_id, list);
    }
    return map;
}

async function loadNpcs(npcIds) {
    const map = new Map();
    if (npcIds.length === 0) return map;

    const table = `${OZRO_PREFIX}npcs`;
    const placeholders = npcIds.map(() => '?').join(', ');
    const rows = await query(
        `SELECT npc_id, name, display_name, map_id, x, y
         FROM \`${table}\`
         WHERE npc_id IN (${placeholders})`,
        npcIds
    );

    for (const row of rows) {
        map.set(row.npc_id, {
            name: row.name,
            displayName: row.display_name,
            mapId: row.map_id,
            x: n(row.x),
            y: n(row.y)
        });
    }
    return map;
}

/** SQL fragment: item has any of the given acquisition source_types. */
export function acquisitionSourceFilterClause(itemAlias, sourceTypes) {
    const types = (sourceTypes || []).filter((t) => ACQUISITION_SOURCE_TYPES.includes(t));
    if (!acquisitionAvailable || types.length === 0) return null;
    return {
        clause: `EXISTS (
            SELECT 1 FROM \`${T.ACQUISITION}\` acq
            WHERE acq.item_id = ${itemAlias}.item_id
              AND acq.source_type IN (${types.map(() => '?').join(', ')})
        )`,
        values: types
    };
}

export function parseAcquisitionSourceTypes(params) {
    const raw = params?.sourceType ?? params?.acquisition;
    if (!raw) return [];
    const list = String(raw)
        .split(',')
        .map((v) => v.trim())
        .filter((t) => ACQUISITION_SOURCE_TYPES.includes(t));
    return [...new Set(list)];
}

export { SOURCE_LABELS, parseBool };
