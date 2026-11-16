import { query } from '../../services/mariadb.js';
import {
    effectiveMobsSql,
    isSpawnDataAvailable,
    spawnTableSql
} from './gameDb.js';

const YELLOW_WINDOW_SECONDS = 20 * 60;
let mvplogWarningShown = false;

function toNumber(value) {
    return Number(value) || 0;
}

function spawnKey(map, mobId) {
    return `${map}:${mobId}`;
}

async function getLatestKills() {
    try {
        const rows = await query(`
            SELECT l.monster_id, l.map,
                   UNIX_TIMESTAMP(l.mvp_date) AS killed_at,
                   c.name AS killer
            FROM mvplog l
            JOIN (
                SELECT monster_id, map, MAX(mvp_id) AS mvp_id
                FROM mvplog
                GROUP BY monster_id, map
            ) latest ON latest.mvp_id = l.mvp_id
            LEFT JOIN \`char\` c ON c.char_id = l.kill_char_id
        `);
        return rows;
    } catch (error) {
        if (!mvplogWarningShown) {
            console.warn('No se pudo leer mvplog para el radar de MVPs:', error.message);
            mvplogWarningShown = true;
        }
        return [];
    }
}

async function getRecentKills() {
    try {
        const rows = await query(`
            SELECT l.monster_id, l.map,
                   UNIX_TIMESTAMP(l.mvp_date) AS killed_at,
                   c.name AS killer
            FROM mvplog l
            LEFT JOIN \`char\` c ON c.char_id = l.kill_char_id
            ORDER BY l.mvp_id DESC
            LIMIT 20
        `);
        return rows;
    } catch {
        return [];
    }
}

function computeState(spawn, kill, now) {
    const delaySeconds = Math.max(1, Math.round(toNumber(spawn.delay) / 1000));
    const varianceSeconds = Math.max(0, Math.round(toNumber(spawn.delay2) / 1000));
    const respawnMinSeconds = delaySeconds;
    const respawnMaxSeconds = delaySeconds + varianceSeconds;
    const yellowSeconds = Math.max(varianceSeconds, YELLOW_WINDOW_SECONDS);

    if (!kill) {
        return {
            state: 'unknown',
            probabilityAlive: null,
            windowStart: null,
            windowEnd: null,
            respawnMinSeconds,
            respawnMaxSeconds,
            lastKill: null
        };
    }

    const killedAt = toNumber(kill.killed_at);
    const elapsed = Math.max(0, now - killedAt);
    const windowStart = killedAt + respawnMinSeconds;
    const windowEnd = windowStart + yellowSeconds;

    let state;
    let probabilityAlive = null;

    if (elapsed < respawnMinSeconds) {
        state = 'dead';
        probabilityAlive = 0;
    } else if (elapsed < respawnMinSeconds + yellowSeconds) {
        state = 'probable';
        const probabilitySpan = varianceSeconds > 0 ? varianceSeconds : yellowSeconds;
        probabilityAlive = Math.min(0.99, Math.max(0.01, (elapsed - respawnMinSeconds) / probabilitySpan));
    } else {
        state = 'alive';
    }

    return {
        state,
        probabilityAlive,
        windowStart: state === 'alive' ? null : windowStart,
        windowEnd: state === 'alive' ? null : windowEnd,
        respawnMinSeconds,
        respawnMaxSeconds,
        lastKill: {
            at: killedAt,
            secondsAgo: elapsed,
            killer: kill.killer || null
        }
    };
}

export async function getMvpRadar() {
    if (!isSpawnDataAvailable()) {
        throw new Error('SPAWN_TABLE_NOT_CONFIGURED');
    }

    const [timeRows, spawnRows, latestKills, recentKills] = await Promise.all([
        query('SELECT UNIX_TIMESTAMP() AS server_time'),
        query(`
            SELECT s.mob_id, s.map, s.amount, s.delay, s.delay2,
                   m.name_english, m.name_aegis, m.level, m.hp,
                   m.element, m.element_level, m.race, m.size,
                   m.base_exp, m.job_exp, m.mvp_exp
            FROM ${spawnTableSql('s')}
            JOIN ${effectiveMobsSql('m')} ON m.id = s.mob_id
            WHERE s.is_instance = 0
              AND (m.mode_mvp = 1 OR COALESCE(m.mvp_exp, 0) > 0)
            ORDER BY m.level ASC, m.name_english ASC
        `),
        getLatestKills(),
        getRecentKills()
    ]);

    const now = toNumber(timeRows[0]?.server_time) || Math.floor(Date.now() / 1000);
    const killsByKey = new Map();
    for (const kill of latestKills) {
        killsByKey.set(spawnKey(kill.map, kill.monster_id), kill);
    }

    const byKey = new Map();
    for (const row of spawnRows) {
        const key = spawnKey(row.map, row.mob_id);
        if (byKey.has(key)) continue;

        const computed = computeState(row, killsByKey.get(key), now);
        byKey.set(key, {
            id: key,
            mobId: toNumber(row.mob_id),
            name: row.name_english,
            nameAegis: row.name_aegis,
            level: toNumber(row.level),
            hp: toNumber(row.hp),
            element: row.element,
            elementLevel: toNumber(row.element_level),
            race: row.race,
            size: row.size,
            baseExp: toNumber(row.base_exp),
            jobExp: toNumber(row.job_exp),
            mvpExp: toNumber(row.mvp_exp),
            map: row.map,
            amount: toNumber(row.amount),
            delay: toNumber(row.delay),
            delay2: toNumber(row.delay2),
            ...computed
        });
    }

    const knownKeys = new Set(byKey.keys());
    const filteredRecent = recentKills
        .filter((kill) => knownKeys.has(spawnKey(kill.map, kill.monster_id)))
        .slice(0, 10)
        .map((kill) => ({
            mobId: toNumber(kill.monster_id),
            map: kill.map,
            at: toNumber(kill.killed_at),
            secondsAgo: Math.max(0, now - toNumber(kill.killed_at)),
            killer: kill.killer || null
        }));

    return {
        serverTime: now,
        yellowWindowSeconds: YELLOW_WINDOW_SECONDS,
        mvps: [...byKey.values()],
        recentKills: filteredRecent
    };
}
