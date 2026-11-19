import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../../services/mariadb.js';
import {
    effectiveItemsSql,
    effectiveMobsSql,
    isItemDataAvailable,
    isMobDataAvailable,
    isSpawnDataAvailable,
    mobDropColumns,
    parseBool,
    parseIntParam,
    parsePagination,
    spawnTableSql
} from './gameDb.js';
import { applyDropRate, dropMultiplier, effectiveMvpRates, mobTier, rateToPercent } from './dropRates.js';
import { applyMobHp } from './mobRates.js';
import { bestItemValue, initializeItemValues } from './itemValue.js';
import { getItemDisplayName } from './itemInfo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../../../assets');
const LEVEL_PENALTY_PATH = path.join(ASSETS_DIR, 'farming/levelPenalty.json');
const WORLDVIEW_PATH = path.join(ASSETS_DIR, 'world/worldview.json');
const WORLD_ACCESS_PATH = path.join(ASSETS_DIR, 'world/access.json');
const MIN_MZW = 10;
const INSTANCE_MAP_RE = /^(?:\d+@|@)|_i$/i;
const EVENT_MAP_RE = /^(?:evt|event|quiz|que_|job_)/i;

let ready = false;
let mobs = [];
let mobById = new Map();
let maps = [];
let mapByName = new Map();
let penaltyData = null;
let accessData = null;

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.warn(`No se pudo leer ${filePath}: ${error.message}`);
        return null;
    }
}

function rowTier(row) {
    return mobTier({
        isMvp: Number(row.mode_mvp) === 1 || Number(row.mvp_exp) > 0,
        isBoss: String(row.class || row.mob_class || '').toLowerCase() === 'boss',
        isTreasure: Number(row.racegroup_treasure) === 1
    });
}

function penaltyRate(type, levelDifference) {
    const rates = penaltyData?.penalties?.[type]?.rates;
    if (!Array.isArray(rates) || rates.length === 0) return 100;
    const minDiff = Number(penaltyData.minDiff) || 0;
    const index = Math.max(0, Math.min(rates.length - 1, levelDifference - minDiff));
    return Number(rates[index]) || 100;
}

function mapAccess(map) {
    const access = accessData?.maps?.[map];
    if (!access) return { accessDepth: null, accessLabel: 'NPC/Quest' };
    return {
        accessDepth: access.depth,
        accessLabel: access.label === 'Sin ruta' ? 'NPC/Quest' : (access.label || 'NPC/Quest')
    };
}

function isEventOrInstanceMap(map) {
    return INSTANCE_MAP_RE.test(map) || EVENT_MAP_RE.test(map);
}

function mapNameFor(map) {
    return mapByName.get(map) || map;
}

function buildDrop(column, rate, item, tier) {
    if (!item) return null;
    const { value, source } = bestItemValue(item);
    if (value <= 0) return null;

    const adjustedRate = applyDropRate(rate, dropMultiplier(tier, column.type, item.type));
    if (adjustedRate <= 0) return null;

    const expected = (adjustedRate / 10000) * value;
    if (expected <= 0) return null;

    return {
        id: Number(item.id),
        name: getItemDisplayName(item.id) ?? item.name_english,
        nameAegis: item.name_aegis,
        type: column.type,
        chancePercent: rateToPercent(adjustedRate),
        sell: value,
        valueSource: source,
        expected,
        expectedBase: expected
    };
}

function applyEffectiveMvpDrops(drops) {
    const mvpDrops = drops.filter((drop) => drop.type === 'mvp');
    if (mvpDrops.length === 0) return drops;

    const rates = effectiveMvpRates(mvpDrops.map((drop) => drop.rate));
    let mvpIndex = 0;
    return drops.map((drop) => {
        if (drop.type !== 'mvp') return drop;
        const rate = rates[mvpIndex++];
        const expected = (rate / 10000) * drop.sell;
        return {
            ...drop,
            rate,
            chancePercent: rateToPercent(rate),
            expected,
            expectedBase: expected
        };
    });
}

function decorateMob(mob, level, applyPenalty) {
    if (!applyPenalty || !level || !Number.isFinite(level)) {
        return {
            ...mob,
            mzw: mob.mzwBase,
            zenyPerHp: mob.zenyPerHpBase,
            penaltyRate: 100,
            drops: mob.drops.map((drop) => ({ ...drop, expected: drop.expectedBase }))
        };
    }

    const rate = mob.fixedDrop ? 100 : penaltyRate('drop', mob.level - level);
    const factor = rate / 100;
    const mzw = mob.mzwNormal * factor + mob.mzwMvp;
    return {
        ...mob,
        mzw,
        zenyPerHp: mob.hp > 0 ? mzw / mob.hp : 0,
        penaltyRate: rate,
        drops: mob.drops.map((drop) => ({
            ...drop,
            expected: drop.type === 'mvp' ? drop.expectedBase : drop.expectedBase * factor
        }))
    };
}

function buildMob(row, itemByAegis, spawnsByMob) {
    const tier = rowTier(row);
    let drops = [];

    for (const column of mobDropColumns()) {
        const aegis = row[column.item];
        if (!aegis) continue;
        const drop = buildDrop(column, Number(row[column.rate]) || 0, itemByAegis.get(aegis), tier);
        if (drop) drops.push(drop);
    }

    drops = applyEffectiveMvpDrops(drops).filter((drop) => drop.expected > 0);
    drops.sort((a, b) => b.expected - a.expected);

    const mzwNormal = drops
        .filter((drop) => drop.type === 'normal')
        .reduce((sum, drop) => sum + drop.expected, 0);
    const mzwMvp = drops
        .filter((drop) => drop.type === 'mvp')
        .reduce((sum, drop) => sum + drop.expected, 0);
    const mzw = mzwNormal + mzwMvp;

    if (mzw < MIN_MZW) return null;

    const hp = applyMobHp(Number(row.hp) || 0, tier);

    const spawnMaps = (spawnsByMob.get(Number(row.id)) || [])
        .filter((spawn) => !isEventOrInstanceMap(spawn.map))
        .map((spawn) => {
            const access = mapAccess(spawn.map);
            return {
                ...spawn,
                ...access,
                accessLabel: spawn.instance ? 'Instancia' : access.accessLabel,
                accessDepth: spawn.instance ? null : access.accessDepth
            };
        });
    const bestWorldSpawn = spawnMaps
        .filter((spawn) => !spawn.instance && spawn.accessDepth !== null)
        .sort((a, b) => a.accessDepth - b.accessDepth)[0];
    const instanceOnly = spawnMaps.length > 0 && spawnMaps.every((spawn) => spawn.instance);

    return {
        id: Number(row.id),
        name: row.name_english,
        nameAegis: row.name_aegis,
        level: Number(row.level) || 0,
        hp,
        baseExp: Number(row.base_exp) || 0,
        jobExp: Number(row.job_exp) || 0,
        mvpExp: Number(row.mvp_exp) || 0,
        class: row.class || null,
        isMvp: tier === 'mvp',
        isBoss: tier === 'boss',
        fixedDrop: Number(row.mode_fixeditemdrop) === 1,
        mzwBase: mzw,
        mzwNormal,
        mzwMvp,
        zenyPerHpBase: hp > 0 ? mzw / hp : 0,
        dropCount: drops.length,
        drops,
        spawnMaps,
        spawnMapCount: spawnMaps.length,
        spawnAmount: spawnMaps.reduce((sum, spawn) => sum + spawn.amount, 0),
        hasWorldSpawn: spawnMaps.some((spawn) => !spawn.instance),
        accessDepth: bestWorldSpawn?.accessDepth ?? null,
        accessLabel: bestWorldSpawn?.accessLabel ?? (instanceOnly ? 'Instancia' : 'NPC/Quest')
    };
}

function buildMaps(spawnRows, mobById) {
    const byMap = new Map();

    for (const row of spawnRows) {
        if (Number(row.instance) === 1 || isEventOrInstanceMap(row.map)) continue;
        const mob = mobById.get(Number(row.mob_id));
        if (!mob) continue;

        let entry = byMap.get(row.map);
        if (!entry) {
            entry = {
                map: row.map,
                mapName: mapNameFor(row.map),
                ...mapAccess(row.map),
                totalAmount: 0,
                minRespawnMs: null,
                maxRespawnMs: null,
                mobs: []
            };
            byMap.set(row.map, entry);
        }

        const amount = Number(row.amount) || 0;
        const points = Number(row.points) || 0;
        entry.totalAmount += amount;
        entry.mobs.push({
            id: mob.id,
            name: mob.name,
            nameAegis: mob.nameAegis,
            level: mob.level,
            amount,
            points,
            isMvp: mob.isMvp,
            isBoss: mob.isBoss
        });

        const minDelay = Number(row.minDelay);
        const maxDelay = Number(row.maxDelay);
        if (Number.isFinite(minDelay) && minDelay > 0) {
            entry.minRespawnMs = entry.minRespawnMs === null
                ? minDelay
                : Math.min(entry.minRespawnMs, minDelay);
        }
        if (Number.isFinite(maxDelay) && maxDelay > 0) {
            entry.maxRespawnMs = entry.maxRespawnMs === null
                ? maxDelay
                : Math.max(entry.maxRespawnMs, maxDelay);
        }
    }

    return [...byMap.values()].map((entry) => {
        const mobsInMap = entry.mobs
            .map((ref) => {
                const mob = mobById.get(ref.id);
                return {
                    ...ref,
                    mzwBase: mob.mzwBase,
                    zenyPerHpBase: mob.zenyPerHpBase,
                    mzw: mob.mzwBase,
                    zenyPerHp: mob.zenyPerHpBase
                };
            })
            .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'es'));

        const totalMobs = mobsInMap.reduce((sum, mob) => sum + mob.amount, 0);
        return {
            ...entry,
            mobs: mobsInMap,
            mobCount: mobsInMap.length,
            minMobLevel: Math.min(...mobsInMap.map((mob) => mob.level)),
            maxMobLevel: Math.max(...mobsInMap.map((mob) => mob.level)),
            weightedMzw: totalMobs > 0
                ? mobsInMap.reduce((sum, mob) => sum + mob.mzw * mob.amount, 0) / totalMobs
                : 0,
            weightedZenyPerHp: totalMobs > 0
                ? mobsInMap.reduce((sum, mob) => sum + mob.zenyPerHp * mob.amount, 0) / totalMobs
                : 0,
            maxMzw: mobsInMap.length > 0 ? Math.max(...mobsInMap.map((mob) => mob.mzw)) : 0
        };
    });
}

export function isFarmingReady() {
    return ready;
}

export async function initializeFarmingIndex() {
    ready = false;
    mobs = [];
    maps = [];
    mobById = new Map();
    mapByName = new Map();

    if (!isMobDataAvailable() || !isItemDataAvailable()) {
        return false;
    }

    await initializeItemValues();

    penaltyData = readJson(LEVEL_PENALTY_PATH);
    accessData = readJson(WORLD_ACCESS_PATH);

    const worldview = readJson(WORLDVIEW_PATH);
    for (const world of worldview?.worlds || []) {
        for (const map of world.maps || []) {
            mapByName.set(map.map, map.name || map.map);
        }
    }

    const [mobRows, itemRows] = await Promise.all([
        query(`SELECT m.* FROM ${effectiveMobsSql('m')}`),
        query(
            `SELECT i.id, i.name_aegis, i.name_english, i.type, i.price_buy, i.price_sell, i.trade_nosell
             FROM ${effectiveItemsSql('i')}`
        )
    ]);

    const itemByAegis = new Map(itemRows.map((item) => [item.name_aegis, item]));
    const spawnsByMob = new Map();
    let spawnRows = [];

    if (isSpawnDataAvailable()) {
        spawnRows = await query(
            `SELECT s.mob_id, s.map,
                    SUM(s.amount) AS amount,
                    COUNT(*) AS points,
                    MIN(s.delay) AS minDelay,
                    MAX(s.delay + s.delay2) AS maxDelay,
                    MAX(s.is_boss) AS boss,
                    MAX(s.is_instance) AS instance
             FROM ${spawnTableSql('s')}
             GROUP BY s.mob_id, s.map
             ORDER BY s.mob_id ASC, s.map ASC`
        );

        for (const row of spawnRows) {
            const mobId = Number(row.mob_id);
            if (!spawnsByMob.has(mobId)) spawnsByMob.set(mobId, []);
            spawnsByMob.get(mobId).push({
                map: row.map,
                amount: Number(row.amount) || 0,
                points: Number(row.points) || 0,
                boss: Boolean(row.boss),
                instance: Boolean(row.instance),
                respawnMs: row.minDelay != null ? Number(row.minDelay) : null,
                respawnMaxMs: row.maxDelay != null ? Number(row.maxDelay) : null
            });
        }
    }

    for (const row of mobRows) {
        const mob = buildMob(row, itemByAegis, spawnsByMob);
        if (!mob) continue;
        mobs.push(mob);
        mobById.set(mob.id, mob);
    }

    maps = buildMaps(spawnRows, mobById);
    ready = true;
    console.log(`Índice de farmeo listo: ${mobs.length} mobs, ${maps.length} mapas`);
    return true;
}

function includesTerm(mob, term) {
    if (!term) return true;
    if (`${mob.name} ${mob.nameAegis}`.toLowerCase().includes(term)) return true;
    return mob.drops.some((drop) => `${drop.name} ${drop.nameAegis}`.toLowerCase().includes(term));
}

function sortMobs(list, sort, order) {
    const direction = order === 'asc' ? 1 : -1;
    const compare = (a, b) => {
        switch (sort) {
            case 'name':
                return a.name.localeCompare(b.name, 'es') * direction;
            case 'level':
                return (a.level - b.level) * direction || b.mzw - a.mzw;
            case 'zenyPerHp':
                return (a.zenyPerHp - b.zenyPerHp) * direction || b.mzw - a.mzw;
            case 'spawnAmount':
                return (a.spawnAmount - b.spawnAmount) * direction || b.mzw - a.mzw;
            case 'dropCount':
                return (a.dropCount - b.dropCount) * direction || b.mzw - a.mzw;
            default:
                return (a.mzw - b.mzw) * direction || b.zenyPerHp - a.zenyPerHp;
        }
    };
    return list.sort(compare);
}

export function getFarmingMobs(params = {}) {
    const { page, limit, offset } = parsePagination(params);
    const level = parseIntParam(params.level);
    const applyPenalty = parseBool(params.penalty) === true;
    const term = typeof params.q === 'string' ? params.q.trim().toLowerCase() : '';
    const levelMin = parseIntParam(params.levelMin);
    const levelMax = parseIntParam(params.levelMax);
    const minMzw = parseIntParam(params.minMzw);
    const minZenyPerHp = Number(params.minZenyPerHp);
    const hasSpawn = parseBool(params.hasSpawn);
    const includeInstances = parseBool(params.includeInstances) === true;
    const mvp = parseBool(params.mvp);
    const minSpawnAmount = parseIntParam(params.minSpawnAmount);

    let results = mobs.map((mob) => decorateMob(mob, level, applyPenalty));

    results = results.filter((mob) => {
        if (!includesTerm(mob, term)) return false;
        if (levelMin !== null && mob.level < levelMin) return false;
        if (levelMax !== null && mob.level > levelMax) return false;
        if (minMzw !== null && mob.mzw < minMzw) return false;
        if (Number.isFinite(minZenyPerHp) && minZenyPerHp > 0 && mob.zenyPerHp < minZenyPerHp) return false;
        if (hasSpawn === true) {
            if (mob.spawnMapCount === 0) return false;
            if (!includeInstances && !mob.hasWorldSpawn) return false;
        } else if (hasSpawn === false && mob.spawnMapCount > 0) {
            return false;
        }
        if (mvp === true && !mob.isMvp) return false;
        if (mvp === false && mob.isMvp) return false;
        if (minSpawnAmount !== null && mob.spawnAmount < minSpawnAmount) return false;
        return true;
    });

    results = sortMobs(results, params.sort, params.order);
    const total = results.length;
    const pageResults = results.slice(offset, offset + limit);

    return {
        total,
        page,
        limit,
        valueSource: 'mixed',
        playerLevel: level,
        penaltyApplied: applyPenalty && level !== null,
        results: pageResults
    };
}

function decorateMap(map, level, applyPenalty, mvpFilter) {
    let activeMobs = map.mobs.map((ref) => {
        const mob = mobById.get(ref.id);
        if (!mob) return ref;
        const active = decorateMob(mob, level, applyPenalty);
        return {
            ...ref,
            mzw: active.mzw,
            zenyPerHp: active.zenyPerHp,
            penaltyRate: active.penaltyRate
        };
    });

    if (mvpFilter === true) activeMobs = activeMobs.filter((mob) => mob.isMvp);
    if (mvpFilter === false) activeMobs = activeMobs.filter((mob) => !mob.isMvp);

    const totalMobs = activeMobs.reduce((sum, mob) => sum + mob.amount, 0);
    return {
        ...map,
        mobs: activeMobs,
        mobCount: activeMobs.length,
        totalAmount: totalMobs,
        minMobLevel: activeMobs.length > 0 ? Math.min(...activeMobs.map((mob) => mob.level)) : 0,
        maxMobLevel: activeMobs.length > 0 ? Math.max(...activeMobs.map((mob) => mob.level)) : 0,
        weightedMzw: totalMobs > 0
            ? activeMobs.reduce((sum, mob) => sum + mob.mzw * mob.amount, 0) / totalMobs
            : 0,
        weightedZenyPerHp: totalMobs > 0
            ? activeMobs.reduce((sum, mob) => sum + mob.zenyPerHp * mob.amount, 0) / totalMobs
            : 0,
        maxMzw: activeMobs.length > 0 ? Math.max(...activeMobs.map((mob) => mob.mzw)) : 0
    };
}

function sortMaps(list, sort, order) {
    const direction = order === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
        switch (sort) {
            case 'name':
                return a.mapName.localeCompare(b.mapName, 'es') * direction;
            case 'access':
                return ((a.accessDepth ?? 99) - (b.accessDepth ?? 99)) * direction;
            case 'level':
                return (a.maxMobLevel - b.maxMobLevel) * direction || b.weightedMzw - a.weightedMzw;
            case 'zenyPerHp':
                return (a.weightedZenyPerHp - b.weightedZenyPerHp) * direction || b.weightedMzw - a.weightedMzw;
            case 'totalAmount':
                return (a.totalAmount - b.totalAmount) * direction || b.weightedMzw - a.weightedMzw;
            default:
                return (a.weightedMzw - b.weightedMzw) * direction || b.weightedZenyPerHp - a.weightedZenyPerHp;
        }
    });
}

export function getFarmingMaps(params = {}) {
    const { page, limit, offset } = parsePagination(params);
    const level = parseIntParam(params.level);
    const applyPenalty = parseBool(params.penalty) === true;
    const term = typeof params.q === 'string' ? params.q.trim().toLowerCase() : '';
    const levelMin = parseIntParam(params.levelMin);
    const levelMax = parseIntParam(params.levelMax);
    const minMzw = parseIntParam(params.minMzw);
    const accessMax = parseIntParam(params.accessMax);
    const minSpawnAmount = parseIntParam(params.minSpawnAmount);
    const mapFilter = typeof params.map === 'string' ? params.map.trim() : '';
    const mvp = parseBool(params.mvp);

    let results = maps
        .map((map) => decorateMap(map, level, applyPenalty, mvp))
        .filter((map) => map.mobCount > 0);

    results = results.filter((map) => {
        if (mapFilter && map.map !== mapFilter) return false;
        if (term) {
            const haystack = `${map.map} ${map.mapName} ${map.mobs.map((mob) => `${mob.name} ${mob.nameAegis}`).join(' ')}`.toLowerCase();
            if (!haystack.includes(term)) return false;
        }
        if (levelMin !== null && map.maxMobLevel < levelMin) return false;
        if (levelMax !== null && map.minMobLevel > levelMax) return false;
        if (minMzw !== null && map.weightedMzw < minMzw) return false;
        if (minSpawnAmount !== null && map.totalAmount < minSpawnAmount) return false;
        if (accessMax !== null && (map.accessDepth === null || map.accessDepth > accessMax)) return false;
        return true;
    });

    results = sortMaps(results, params.sort, params.order);
    const total = results.length;
    const pageResults = results.slice(offset, offset + limit);

    return {
        total,
        page,
        limit,
        valueSource: 'mixed',
        playerLevel: level,
        penaltyApplied: applyPenalty && level !== null,
        results: pageResults
    };
}

export function getFarmingMobById(id, params = {}) {
    const mob = mobById.get(Number(id));
    if (!mob) return null;
    const level = parseIntParam(params.level);
    const applyPenalty = parseBool(params.penalty) === true;
    return decorateMob(mob, level, applyPenalty);
}

export function getFarmingMapByName(mapName, params = {}) {
    if (isEventOrInstanceMap(mapName)) return null;
    const map = maps.find((entry) => entry.map === mapName);
    if (!map) return null;
    const level = parseIntParam(params.level);
    const applyPenalty = parseBool(params.penalty) === true;
    return decorateMap(map, level, applyPenalty, parseBool(params.mvp));
}
