/**
 * Tasas de drop del servidor.
 *
 * Los valores viven en `server/api/config/dropRates.json` (versionado en git) y
 * reflejan rAthena `conf/import/battle_conf.txt` (100 = 1x). Si se cambia una
 * tasa en el servidor hay que actualizar ese JSON.
 */
import fs from 'fs';

const CONFIG_URL = new URL('../config/dropRates.json', import.meta.url);

const DEFAULT_CONFIG = {
    normal: { common: 500, heal: 1000, use: 1000, equip: 1500, card: 1000 },
    boss: { common: 500, heal: 1000, use: 1000, equip: 1500, card: 10000 },
    mvp: { common: 100, heal: 100, use: 100, equip: 100, card: 100 },
    mvpReward: 500,
    mvpDropMode: 0
};

function loadConfig() {
    const raw = JSON.parse(fs.readFileSync(CONFIG_URL, 'utf8'));
    return {
        normal: { ...DEFAULT_CONFIG.normal, ...(raw.normal || {}) },
        boss: { ...DEFAULT_CONFIG.boss, ...(raw.boss || {}) },
        mvp: { ...DEFAULT_CONFIG.mvp, ...(raw.mvp || {}) },
        mvpReward: Number.isFinite(raw.mvpReward) ? raw.mvpReward : DEFAULT_CONFIG.mvpReward,
        mvpDropMode: Number.isFinite(raw.mvpDropMode) ? raw.mvpDropMode : DEFAULT_CONFIG.mvpDropMode
    };
}

const config = loadConfig();

export const DROP_RATE_CONFIG = {
    normal: config.normal,
    boss: config.boss,
    mvp: config.mvp
};

/** Recompensa MVP directa (item_rate_mvp). */
export const MVP_REWARD_RATE = config.mvpReward;

/** Modo de reparto de drops MVP (item_drop_mvp_mode). */
export const MVP_DROP_MODE = config.mvpDropMode;

/** Tope efectivo de drop (item_drop_*_max / drop_rate_cap): 90%. */
export const DROP_RATE_MAX = 10000;

/**
 * Categoría de tasa a partir del tipo de item de rAthena (item_db.type).
 * Debe coincidir con el switch de `mob_drop_ratio_adjust` en src/map/mob.cpp.
 */
export function itemDropCategory(itemType) {
    switch (String(itemType || '').toLowerCase()) {
        case 'card':
            return 'card';
        case 'healing':
            return 'heal';
        case 'usable':
        case 'cash':
            return 'use';
        case 'weapon':
        case 'armor':
        case 'petarmor':
        case 'shadowgear':
        case 'armor2':
            return 'equip';
        default:
            // Etc, Ammo, Petegg, Delayconsume y desconocidos
            return 'common';
    }
}

/** Tier del monstruo dueño del drop: normal, boss (no MVP) o mvp. */
export function mobTier({ isMvp, isBoss } = {}) {
    if (isMvp) return 'mvp';
    if (isBoss) return 'boss';
    return 'normal';
}

/**
 * Multiplicador aplicable a un slot de drop.
 * @param {'normal'|'boss'|'mvp'} tier
 * @param {'normal'|'mvp'} dropType  - mvp = recompensa MVP (item_rate_mvp)
 * @param {string|null} itemType     - item_db.type
 */
export function dropMultiplier(tier, dropType, itemType) {
    if (dropType === 'mvp') return MVP_REWARD_RATE;
    const rates = DROP_RATE_CONFIG[tier] || DROP_RATE_CONFIG.normal;
    const category = itemDropCategory(itemType);
    return rates[category] ?? DROP_RATE_CONFIG.normal[category];
}

/**
 * Aplica el multiplicador igual que rAthena mob_drop_adjust:
 * rate = base * multiplier / 100, acotado a [1, 10000].
 */
export function applyDropRate(baseRate, multiplier) {
    if (!Number.isFinite(baseRate) || baseRate <= 0) return 0;
    if (!Number.isFinite(multiplier) || multiplier <= 0) return 0;
    const adjusted = Math.round((baseRate * multiplier) / 100);
    return Math.max(1, Math.min(DROP_RATE_MAX, adjusted));
}

/** Convierte una tasa rAthena (0-10000) a porcentaje. */
export function rateToPercent(rate) {
    if (!Number.isFinite(rate) || rate <= 0) return 0;
    return Math.min(rate, DROP_RATE_MAX) / 100;
}

/**
 * Probabilidades efectivas de los slots MVP en orden oficial
 * (item_drop_mvp_mode 0), igual que @mi en rAthena.
 */
export function effectiveMvpRates(rates) {
    if (MVP_DROP_MODE !== 0) return rates.map((rate) => rate);
    let remaining = 100;
    return rates.map((rate) => {
        const chance = (rate * remaining) / 10000;
        remaining = Math.max(0, remaining - chance);
        return Math.round(chance * 100);
    });
}
