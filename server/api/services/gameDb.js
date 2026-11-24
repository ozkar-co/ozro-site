/**
 * OzRo Master World Dataset access layer.
 * World/encyclopedia data comes only from ozro_* tables (see ozro-data/DATA.md).
 * Live player tables (login, mvplog, acc_reg_num, …) stay on the game DB.
 */
import { query } from '../../services/mariadb.js';

/** Configurable table prefix (default ozro_). */
export const OZRO_PREFIX = process.env.OZRO_TABLE_PREFIX || 'ozro_';

export const T = {
    MOBS: `${OZRO_PREFIX}mobs`,
    MOB_DROPS: `${OZRO_PREFIX}mob_drops`,
    MOB_SKILLS: `${OZRO_PREFIX}mob_skills`,
    SKILLS: `${OZRO_PREFIX}skills`,
    SKILL_ITEM_COSTS: `${OZRO_PREFIX}skill_item_costs`,
    SKILL_TEACHERS: `${OZRO_PREFIX}skill_teachers`,
    NPCS: `${OZRO_PREFIX}npcs`,
    NPC_FUNCTIONS: `${OZRO_PREFIX}npc_functions`,
    NPC_SHOPS: `${OZRO_PREFIX}npc_shops`,
    SPAWNS: `${OZRO_PREFIX}spawns`,
    MAPS: `${OZRO_PREFIX}maps`,
    MAP_CONNECTIONS: `${OZRO_PREFIX}map_connections`,
    ITEMS: `${OZRO_PREFIX}items`,
    ITEM_SCRIPTS: `${OZRO_PREFIX}item_scripts`,
    SKILL_SUMMONS: `${OZRO_PREFIX}skill_summons`,
    RECIPES: `${OZRO_PREFIX}recipes`,
    LEVEL_PENALTY: `${OZRO_PREFIX}dataset_level_penalty`,
    DATASET_RATES: `${OZRO_PREFIX}dataset_rates`,
    ACQUISITION: `${OZRO_PREFIX}acquisition_outputs`,
    NPC_SHOP_ITEMS: `${OZRO_PREFIX}npc_shop_items`
};

let worldDataAvailable = false;

export const ITEM_TYPES = [
    'Healing', 'Usable', 'Etc', 'Armor', 'Weapon', 'Card',
    'Petegg', 'Petarmor', 'Ammo', 'DelayConsume', 'Cash',
    'Shadowgear', 'Armor2'
];

/** UI "Armor" expands to these type strings in ozro_items (Shadowgear is its own filter). */
export const ITEM_ARMOR_DB_TYPES = ['Armor', 'Armor2'];

/**
 * API location filter key → JSON key in ozro_items.locations
 * (rAthena YAML style: Right_Hand, Head_Top, …).
 */
export const ITEM_LOCATION_JSON_KEYS = {
    headTop: 'Head_Top',
    headMid: 'Head_Mid',
    headLow: 'Head_Low',
    armor: 'Armor',
    rightHand: 'Right_Hand',
    leftHand: 'Left_Hand',
    garment: 'Garment',
    shoes: 'Shoes',
    rightAccessory: 'Right_Accessory',
    leftAccessory: 'Left_Accessory',
    costumeHeadTop: 'Costume_Head_Top',
    costumeHeadMid: 'Costume_Head_Mid',
    costumeHeadLow: 'Costume_Head_Low',
    costumeGarment: 'Costume_Garment',
    ammo: 'Ammo',
    shadowArmor: 'Shadow_Armor',
    shadowWeapon: 'Shadow_Weapon',
    shadowShield: 'Shadow_Shield',
    shadowShoes: 'Shadow_Shoes',
    shadowRightAccessory: 'Shadow_Right_Accessory',
    shadowLeftAccessory: 'Shadow_Left_Accessory'
};

/** API job filter → JSON key in ozro_items.jobs */
export const ITEM_JOB_JSON_KEYS = {
    novice: 'Novice',
    swordman: 'Swordman',
    mage: 'Mage',
    archer: 'Archer',
    acolyte: 'Acolyte',
    merchant: 'Merchant',
    thief: 'Thief',
    knight: 'Knight',
    priest: 'Priest',
    wizard: 'Wizard',
    blacksmith: 'Blacksmith',
    hunter: 'Hunter',
    assassin: 'Assassin',
    crusader: 'Crusader',
    monk: 'Monk',
    sage: 'Sage',
    rogue: 'Rogue',
    alchemist: 'Alchemist',
    barddancer: 'BardDancer',
    taekwon: 'Taekwon',
    stargladiator: 'StarGladiator',
    soullinker: 'SoulLinker',
    gunslinger: 'Gunslinger',
    ninja: 'Ninja',
    kagerouoboro: 'KagerouOboro',
    rebellion: 'Rebellion',
    summoner: 'Summoner',
    spirit_handler: 'SpiritHandler',
    supernovice: 'SuperNovice'
};

export const ITEM_CLASSES = [
    'normal', 'upper', 'baby', 'third', 'third_upper', 'third_baby', 'fourth'
];

/** Armor subtype UI → location JSON key (when subtype column empty). */
export const ARMOR_SUBTYPE_LOCATION_JSON = {
    Head_Top: 'Head_Top',
    Head_Mid: 'Head_Mid',
    Head_Low: 'Head_Low',
    Shoes: 'Shoes',
    Garment: 'Garment',
    Armor: 'Armor',
    Left_Accessory: 'Left_Accessory',
    Right_Accessory: 'Right_Accessory'
};

export async function initializeGameDb() {
    const rows = await query('SHOW TABLES');
    const tableSet = new Set(rows.map((row) => Object.values(row)[0]));

    const required = [T.MOBS, T.ITEMS, T.MOB_DROPS, T.SPAWNS, T.MAPS];
    const missing = required.filter((name) => !tableSet.has(name));
    worldDataAvailable = missing.length === 0;

    const hasAcquisition = tableSet.has(T.ACQUISITION);
    // Lazy import to avoid circular init with acquisitionQuery ↔ gameDb
    const { setAcquisitionAvailable } = await import('./acquisitionQuery.js');
    setAcquisitionAvailable(hasAcquisition);

    console.log('OzRo Master World tables:', {
        prefix: OZRO_PREFIX,
        available: worldDataAvailable,
        missing: missing.length ? missing : undefined,
        optional: {
            item_scripts: tableSet.has(T.ITEM_SCRIPTS),
            skill_summons: tableSet.has(T.SKILL_SUMMONS),
            mob_skills: tableSet.has(T.MOB_SKILLS),
            skills: tableSet.has(T.SKILLS),
            skill_item_costs: tableSet.has(T.SKILL_ITEM_COSTS),
            skill_teachers: tableSet.has(T.SKILL_TEACHERS),
            level_penalty: tableSet.has(T.LEVEL_PENALTY),
            acquisition: hasAcquisition
        }
    });

    if (!worldDataAvailable) {
        console.warn(
            'Faltan tablas ozro_*. Corre ozro-data: pipeline.py schema --reset && pipeline.py sync'
        );
    }
}

export function isWorldDataAvailable() {
    return worldDataAvailable;
}

/** @deprecated use isWorldDataAvailable */
export function isMobDataAvailable() {
    return worldDataAvailable;
}

/** @deprecated use isWorldDataAvailable */
export function isItemDataAvailable() {
    return worldDataAvailable;
}

/** @deprecated use isWorldDataAvailable */
export function isSpawnDataAvailable() {
    return worldDataAvailable;
}

export function worldUnavailableError() {
    return {
        error: 'Master World Dataset no disponible',
        hint: 'Sincroniza ozro-data (pipeline.py sync) en esta base MySQL'
    };
}

export function mobUnavailableError() {
    return worldUnavailableError();
}

export function itemUnavailableError() {
    return worldUnavailableError();
}

export function spawnUnavailableError() {
    return worldUnavailableError();
}

/** chance_effective is per_10000 (10000 = 100%). */
export function chanceToPercent(chance, rateUnit = 'per_10000') {
    const n = Number(chance) || 0;
    if (rateUnit === 'per_100000') return Math.min(100, n / 1000);
    return Math.min(100, n / 100);
}

export function parseJsonColumn(value, fallback = null) {
    if (value == null) return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

/** World spawn = not instance/event/slave (permanent + scripted on open maps). */
export function isWorldSpawnSql(alias = 's') {
    return `(
        ${alias}.spawn_type IN ('permanent', 'scripted')
        AND (${alias}.map_id IS NOT NULL)
        AND NOT EXISTS (
            SELECT 1 FROM \`${T.MAPS}\` mp
            WHERE mp.map_id = ${alias}.map_id AND mp.is_instance = 1
        )
    )`;
}

export function parsePagination(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

export function parseCsv(value) {
    if (!value || typeof value !== 'string') return [];
    return value.split(',').map((v) => v.trim()).filter(Boolean);
}

export function parseBool(value) {
    if (value === undefined || value === null || value === '') return null;
    const normalized = String(value).toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return null;
}

export function parseIntParam(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

/* —— Live player helpers (still rAthena game tables) —— */

export const BANK_VAULT_KEY = '#BANKVAULT';
export const INTERNAL_ACCOUNT_USERIDS = ['S1'];
const internalAccountsSqlList = INTERNAL_ACCOUNT_USERIDS.map((id) => `'${id}'`).join(', ');

export function statsPlayerAccountSql(loginAlias = 'l') {
    return `${loginAlias}.group_id = 0 AND ${loginAlias}.userid NOT IN (${internalAccountsSqlList})`;
}

export function statsPlayerAccountWhereClause() {
    return `group_id = 0 AND userid NOT IN (${internalAccountsSqlList})`;
}

export function excludeInternalAccountsSql(loginAlias = 'l') {
    return `${loginAlias}.userid NOT IN (${internalAccountsSqlList})`;
}

export function bankVaultValueSql(accountIdExpr) {
    return `COALESCE((
        SELECT ar.value FROM acc_reg_num ar
        WHERE ar.account_id = ${accountIdExpr}
        AND ar.\`key\` = '${BANK_VAULT_KEY}'
        AND ar.\`index\` = 0
        LIMIT 1
    ), 0)`;
}

export const CARD_COLLECTOR_CATEGORIES = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z', 'BOSS', 'MVP'
];

const CARD_CT_KEYS_SQL = CARD_COLLECTOR_CATEGORIES
    .map((code) => `'#CARD_CT_${code}'`)
    .join(', ');

export function cardCollectorTotalSql(accountIdExpr) {
    return `COALESCE((
        SELECT SUM(ar.value) FROM acc_reg_num ar
        WHERE ar.account_id = ${accountIdExpr}
        AND ar.\`key\` IN (${CARD_CT_KEYS_SQL})
        AND ar.\`index\` = 0
    ), 0)`;
}

export function cardCollectorDistinctSql(accountIdExpr) {
    return `COALESCE((
        SELECT COUNT(*) FROM acc_reg_num ar
        WHERE ar.account_id = ${accountIdExpr}
        AND ar.\`key\` LIKE '#CARD_SEEN\\_%'
        AND ar.\`index\` = 0
        AND ar.value = 1
    ), 0)`;
}

export function cardExistsSql(itemIdExpr) {
    if (!worldDataAvailable) return '0 = 1';
    return `EXISTS (SELECT 1 FROM \`${T.ITEMS}\` cit WHERE cit.item_id = ${itemIdExpr} AND cit.type = 'Card')`;
}
