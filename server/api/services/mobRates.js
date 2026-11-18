/**
 * Tasas de monstruos del servidor.
 *
 * Los valores viven en `server/api/config/mobRates.json` (versionado en git) y
 * reflejan rAthena `conf/import/battle_conf.txt` (100 = 1x). Si se cambia una
 * tasa en el servidor hay que actualizar ese JSON.
 */
import fs from 'fs';

const CONFIG_URL = new URL('../config/mobRates.json', import.meta.url);

const DEFAULT_CONFIG = {
    monsterHpRate: 100,
    mvpHpRate: 100
};

function loadConfig() {
    const raw = JSON.parse(fs.readFileSync(CONFIG_URL, 'utf8'));
    return {
        monsterHpRate: Number.isFinite(raw.monsterHpRate) ? raw.monsterHpRate : DEFAULT_CONFIG.monsterHpRate,
        mvpHpRate: Number.isFinite(raw.mvpHpRate) ? raw.mvpHpRate : DEFAULT_CONFIG.mvpHpRate
    };
}

const config = loadConfig();

/** Multiplicador de HP aplicado por rAthena (monster_hp_rate / mvp_hp_rate). */
export function mobHpMultiplier(tier) {
    return tier === 'mvp' ? config.mvpHpRate : config.monsterHpRate;
}

/** HP efectiva del servidor para un monstruo, como `hp * rate / 100`. */
export function applyMobHp(hp, tier) {
    const value = Number(hp);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.floor((value * mobHpMultiplier(tier)) / 100);
}
