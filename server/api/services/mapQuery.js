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
        if (/^[A-Za-z0-9_@.-]+$/.test(q) && !q.includes(' ')) {
            // Prefer exact map_id, still allow fuzzy name
            const match = buildTokenMatchClause('m', ['m.map_id', 'm.display_name', 'm.category'], q);
            const clauses = ['m.map_id = ?'];
            values.push(q);
            if (match) {
                clauses.push(match.clause);
                values.push(...match.values);
            }
            conditions.push(`(${clauses.join(' OR ')})`);
        } else {
            const match = buildTokenMatchClause('m', ['m.map_id', 'm.display_name', 'm.category'], q);
            if (match) {
                conditions.push(match.clause);
                values.push(...match.values);
            }
        }
    }

    if (categories.length > 0) {
        conditions.push(
            `m.category IN (${categories.map(() => '?').join(', ')})`
        );
        values.push(...categories);
    }
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
    const orderSql = q
        ? 'm.display_name ASC, m.map_id ASC'
        : 'COALESCE(sp.spawn_amount, 0) DESC, m.display_name ASC, m.map_id ASC';

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
            [...values, limit, offset]
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
    const connections = await query(
        `SELECT connection_id, connection_type, source_map_id, destination_map_id,
                source_x, source_y, destination_x, destination_y,
                warp_name, label, zeny_cost
         FROM \`${T.MAP_CONNECTIONS}\`
         WHERE source_map_id = ?
         ORDER BY destination_map_id ASC
         LIMIT 80`,
        [id]
    ).catch(() => []);

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
        }))
    };
}
