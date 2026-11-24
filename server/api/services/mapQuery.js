/**
 * Map catalog: ozro_maps + spawn/npc aggregates.
 */
import { query } from '../../services/mariadb.js';
import {
    T,
    parseBool,
    parseCsv,
    parsePagination
} from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';

function num(value) {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function bool(value) {
    if (value == null) return false;
    if (typeof value === 'boolean') return value;
    return Number(value) === 1;
}

function parseJson(value, fallback = null) {
    if (value == null || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function mapSummary(row) {
    const categories = parseJson(row.categories, []);
    return {
        id: row.map_id,
        name: row.display_name || row.map_id,
        category: row.category || null,
        categories: Array.isArray(categories) ? categories : [],
        isTown: bool(row.is_town),
        isDungeon: bool(row.is_dungeon),
        isInstance: bool(row.is_instance),
        isQuestMap: bool(row.is_quest_map),
        isGuildMap: bool(row.is_guild_map),
        isInterior: bool(row.is_interior),
        isAccessible: bool(row.is_accessible),
        width: num(row.width),
        height: num(row.height),
        hasClientResource: bool(row.client_resource_present),
        spawnSpecies: Number(row.spawn_species) || 0,
        spawnAmount: Number(row.spawn_amount) || 0,
        spawnPoints: Number(row.spawn_points) || 0,
        hasBossSpawn: bool(row.has_boss_spawn),
        npcCount: Number(row.npc_count) || 0
    };
}

const SPAWN_AGG = `
    LEFT JOIN (
        SELECT map_id,
               COUNT(*) AS spawn_points,
               COUNT(DISTINCT mob_id) AS spawn_species,
               COALESCE(SUM(amount), 0) AS spawn_amount,
               MAX(CASE WHEN COALESCE(boss_flag, 0) > 0 THEN 1 ELSE 0 END) AS has_boss_spawn
        FROM \`${T.SPAWNS}\`
        WHERE map_id IS NOT NULL
        GROUP BY map_id
    ) sp ON sp.map_id = m.map_id
`;

const NPC_AGG = `
    LEFT JOIN (
        SELECT map_id, COUNT(*) AS npc_count
        FROM \`${T.NPCS}\`
        WHERE map_id IS NOT NULL
        GROUP BY map_id
    ) np ON np.map_id = m.map_id
`;

export async function getMapMeta() {
    const [categories, counts] = await Promise.all([
        query(
            `SELECT DISTINCT category AS value
             FROM \`${T.MAPS}\`
             WHERE COALESCE(category, '') <> ''
             ORDER BY category`
        ),
        query(
            `SELECT
                SUM(CASE WHEN is_town = 1 THEN 1 ELSE 0 END) AS towns,
                SUM(CASE WHEN is_dungeon = 1 THEN 1 ELSE 0 END) AS dungeons,
                SUM(CASE WHEN is_instance = 1 THEN 1 ELSE 0 END) AS instances,
                SUM(CASE WHEN is_quest_map = 1 THEN 1 ELSE 0 END) AS questMaps,
                COUNT(*) AS total
             FROM \`${T.MAPS}\``
        )
    ]);

    const c = counts[0] || {};
    return {
        categories: categories.map((row) => row.value).filter(Boolean),
        counts: {
            total: Number(c.total) || 0,
            towns: Number(c.towns) || 0,
            dungeons: Number(c.dungeons) || 0,
            instances: Number(c.instances) || 0,
            questMaps: Number(c.questMaps) || 0
        }
    };
}

export async function searchMaps(params) {
    const { page, limit, offset } = parsePagination(params);
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    const categories = parseCsv(params.category);
    const town = parseBool(params.town);
    const dungeon = parseBool(params.dungeon);
    const instance = parseBool(params.instance);
    const quest = parseBool(params.quest);
    const hasSpawns = parseBool(params.hasSpawns);
    const hasNpcs = parseBool(params.hasNpcs);
    const accessible = parseBool(params.accessible);

    const conditions = ['1=1'];
    const values = [];

    if (q) {
        const match = buildTokenMatchClause('m', ['m.map_id', 'm.display_name'], q);
        if (match) {
            conditions.push(match.clause);
            values.push(...match.values);
        }
    }

    if (categories.length > 0) {
        conditions.push(
            `m.category IN (${categories.map(() => '?').join(', ')})`
        );
        values.push(...categories);
    }
    // Legacy boolean filters still accepted if sent; UI no longer exposes them.
    if (town === true) conditions.push('m.is_town = 1');
    if (dungeon === true) conditions.push('m.is_dungeon = 1');
    if (instance === true) conditions.push('m.is_instance = 1');
    if (instance === false) conditions.push('COALESCE(m.is_instance, 0) = 0');
    if (quest === true) conditions.push('m.is_quest_map = 1');
    if (accessible === true) conditions.push('m.is_accessible = 1');
    if (hasSpawns === true) conditions.push('COALESCE(sp.spawn_points, 0) > 0');
    if (hasNpcs === true) conditions.push('COALESCE(np.npc_count, 0) > 0');

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const fromSql = `
        FROM \`${T.MAPS}\` m
        ${SPAWN_AGG}
        ${NPC_AGG}
    `;
    // Exact map_id → prefix map_id → name contains → alphabetical
    const orderSql = q
        ? `CASE
             WHEN m.map_id = ? THEN 0
             WHEN m.map_id LIKE ? THEN 1
             WHEN m.display_name LIKE ? THEN 2
             ELSE 3
           END ASC,
           m.map_id ASC`
        : 'COALESCE(sp.spawn_amount, 0) DESC, m.display_name ASC, m.map_id ASC';
    const orderValues = q
        ? [q, `${q}%`, `%${q}%`]
        : [];

    const selectCols = `
        m.map_id, m.display_name, m.category, m.categories,
        m.is_town, m.is_dungeon, m.is_instance, m.is_quest_map,
        m.is_guild_map, m.is_interior, m.is_accessible,
        m.width, m.height, m.client_resource_present,
        COALESCE(sp.spawn_points, 0) AS spawn_points,
        COALESCE(sp.spawn_species, 0) AS spawn_species,
        COALESCE(sp.spawn_amount, 0) AS spawn_amount,
        COALESCE(sp.has_boss_spawn, 0) AS has_boss_spawn,
        COALESCE(np.npc_count, 0) AS npc_count
    `;

    const [countRows, rows] = await Promise.all([
        query(`SELECT COUNT(*) AS total ${fromSql} ${whereClause}`, values),
        query(
            `SELECT ${selectCols}
             ${fromSql}
             ${whereClause}
             ORDER BY ${orderSql}
             LIMIT ? OFFSET ?`,
            [...values, ...orderValues, limit, offset]
        )
    ]);

    return {
        total: Number(countRows[0]?.total) || 0,
        page,
        limit,
        results: rows.map(mapSummary)
    };
}

export async function getMapById(mapId) {
    const id = String(mapId || '').trim();
    if (!id) return null;

    const rows = await query(
        `SELECT m.map_id, m.display_name, m.category, m.categories,
                m.is_town, m.is_dungeon, m.is_instance, m.is_quest_map,
                m.is_guild_map, m.is_interior, m.is_accessible,
                m.width, m.height, m.client_resource_present, m.client,
                COALESCE(sp.spawn_points, 0) AS spawn_points,
                COALESCE(sp.spawn_species, 0) AS spawn_species,
                COALESCE(sp.spawn_amount, 0) AS spawn_amount,
                COALESCE(sp.has_boss_spawn, 0) AS has_boss_spawn,
                COALESCE(np.npc_count, 0) AS npc_count
         FROM \`${T.MAPS}\` m
         ${SPAWN_AGG}
         ${NPC_AGG}
         WHERE m.map_id = ?
         LIMIT 1`,
        [id]
    );
    if (rows.length === 0) return null;

    const summary = mapSummary(rows[0]);
    const [connections, spawnRows, npcRows] = await Promise.all([
        query(
            `SELECT connection_id, connection_type, source_map_id, destination_map_id,
                    source_x, source_y, destination_x, destination_y,
                    warp_name, label, zeny_cost
             FROM \`${T.MAP_CONNECTIONS}\`
             WHERE source_map_id = ?
             ORDER BY destination_map_id ASC, connection_type ASC
             LIMIT 200`,
            [id]
        ),
        query(
            `SELECT s.spawn_id, s.mob_id, s.amount, s.x, s.y, s.x_area, s.y_area,
                    s.respawn_min, s.respawn_max, s.respawn_unit, s.boss_flag,
                    s.spawn_type, s.spawn_kind,
                    m.name AS mob_name, m.aegis_name AS mob_aegis,
                    m.level AS mob_level, m.hp_effective AS mob_hp,
                    m.is_mvp
             FROM \`${T.SPAWNS}\` s
             LEFT JOIN \`${T.MOBS}\` m ON m.mob_id = s.mob_id
             WHERE s.map_id = ?
             ORDER BY COALESCE(s.amount, 0) DESC, s.mob_id ASC, s.spawn_id ASC
             LIMIT 500`,
            [id]
        ),
        query(
            `SELECT n.npc_id, n.name, n.display_name, n.npc_type, n.x, n.y,
                    n.sprite_stem, n.facing
             FROM \`${T.NPCS}\` n
             WHERE n.map_id = ?
             ORDER BY COALESCE(n.display_name, n.name, n.npc_id) ASC
             LIMIT 800`,
            [id]
        )
    ]);

    return {
        ...summary,
        client: parseJson(rows[0].client, null),
        connections: connections.map((row) => ({
            id: row.connection_id,
            type: row.connection_type || null,
            from: row.source_map_id || null,
            to: row.destination_map_id || null,
            fromX: num(row.source_x),
            fromY: num(row.source_y),
            toX: num(row.destination_x),
            toY: num(row.destination_y),
            warpName: row.warp_name || row.label || null,
            zenyCost: num(row.zeny_cost)
        })),
        spawns: spawnRows.map((row) => ({
            id: row.spawn_id,
            mobId: num(row.mob_id),
            mobName: row.mob_name || row.mob_aegis || (row.mob_id != null ? `Mob #${row.mob_id}` : null),
            mobAegis: row.mob_aegis || null,
            level: num(row.mob_level),
            hp: num(row.mob_hp),
            amount: num(row.amount) ?? 0,
            x: num(row.x),
            y: num(row.y),
            xArea: num(row.x_area),
            yArea: num(row.y_area),
            respawnMin: num(row.respawn_min),
            respawnMax: num(row.respawn_max),
            respawnUnit: row.respawn_unit || null,
            boss: bool(row.boss_flag) || bool(row.is_mvp),
            spawnType: row.spawn_type || null,
            spawnKind: row.spawn_kind || null
        })),
        npcs: npcRows.map((row) => ({
            id: row.npc_id,
            name: row.display_name || row.name || row.npc_id,
            nameRaw: row.name || null,
            type: row.npc_type || null,
            x: num(row.x),
            y: num(row.y),
            spriteStem: row.sprite_stem || null,
            facing: num(row.facing)
        }))
    };
}
