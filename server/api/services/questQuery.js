/**
 * Quest catalog: ozro_quests + targets/drops + NPC links.
 * No narrative steps, required items/zeny, or turn-in rewards in the DB.
 */
import { query } from '../../services/mariadb.js';
import { OZRO_PREFIX, parseJsonColumn, parsePagination, parseBool } from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';
import { getItemDisplayName } from './itemInfo.js';

const QUESTS = `${OZRO_PREFIX}quests`;
const QUEST_TARGETS = `${OZRO_PREFIX}quest_targets`;
const QUEST_DROPS = `${OZRO_PREFIX}quest_drops`;
const NPC_QUESTS = `${OZRO_PREFIX}npc_quests`;
const NPCS = `${OZRO_PREFIX}npcs`;
const MOBS = `${OZRO_PREFIX}mobs`;
const ITEMS = `${OZRO_PREFIX}items`;

const TARGET_LIMIT = 80;
const DROP_LIMIT = 40;
const NPC_LIMIT = 40;

function num(value) {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function clean(value) {
    if (value == null) return null;
    const text = String(value).trim();
    return text || null;
}

function parseTimeLimit(raw) {
    const value = parseJsonColumn(raw, null);
    if (!value || typeof value !== 'object') return null;
    const seconds = num(value.seconds);
    return {
        seconds,
        raw: clean(value.raw) || null
    };
}

const NPC_COUNT_SQL = `(SELECT COUNT(*) FROM \`${NPC_QUESTS}\` l WHERE l.quest_id = q.quest_id)`;

function mapQuestSummary(row) {
    const timeLimit = parseTimeLimit(row.time_limit);
    return {
        id: Number(row.quest_id),
        title: clean(row.title) || `Quest #${row.quest_id}`,
        targetCount: Number(row.target_count) || 0,
        dropCount: Number(row.drop_count) || 0,
        npcCount: Number(row.npc_count) || 0,
        hasTimeLimit: Boolean(timeLimit),
        timeLimit,
        sourceFile: clean(row.source_file)
    };
}

export async function getQuestMeta() {
    return {
        filters: ['hasTargets', 'hasDrops', 'hasNpc', 'hasTimeLimit']
    };
}

export async function searchQuests(params) {
    const { page, limit, offset } = parsePagination(params);
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    const hasTargets = parseBool(params.hasTargets);
    const hasDrops = parseBool(params.hasDrops);
    const hasNpc = parseBool(params.hasNpc);
    const hasTimeLimit = parseBool(params.hasTimeLimit);
    const conditions = [];
    const values = [];

    if (q) {
        if (/^\d+$/.test(q)) {
            conditions.push('q.quest_id = ?');
            values.push(Number(q));
        } else {
            const match = buildTokenMatchClause('q', ['q.title', 'CAST(q.quest_id AS CHAR)'], q);
            if (match) {
                conditions.push(match.clause);
                values.push(...match.values);
            }
        }
    }

    if (hasTargets === true) conditions.push('COALESCE(q.target_count, 0) > 0');
    else if (hasTargets === false) conditions.push('COALESCE(q.target_count, 0) = 0');

    if (hasDrops === true) conditions.push('COALESCE(q.drop_count, 0) > 0');
    else if (hasDrops === false) conditions.push('COALESCE(q.drop_count, 0) = 0');

    if (hasNpc === true) {
        conditions.push(`EXISTS (SELECT 1 FROM \`${NPC_QUESTS}\` l WHERE l.quest_id = q.quest_id)`);
    } else if (hasNpc === false) {
        conditions.push(`NOT EXISTS (SELECT 1 FROM \`${NPC_QUESTS}\` l WHERE l.quest_id = q.quest_id)`);
    }

    if (hasTimeLimit === true) conditions.push('q.time_limit IS NOT NULL');
    else if (hasTimeLimit === false) conditions.push('q.time_limit IS NULL');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const titleRank = Boolean(q) && !/^\d+$/.test(q);
    const orderSql = titleRank
        ? 'CASE WHEN q.title LIKE ? THEN 0 ELSE 1 END ASC, q.quest_id ASC'
        : 'q.quest_id ASC';
    const orderValues = titleRank ? [`%${q}%`] : [];

    const [countRows, rows] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM \`${QUESTS}\` q ${whereClause}`, values),
        query(
            `SELECT q.quest_id, q.title, q.time_limit, q.target_count, q.drop_count, q.source_file,
                    ${NPC_COUNT_SQL} AS npc_count
             FROM \`${QUESTS}\` q
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
        results: rows.map(mapQuestSummary)
    };
}

export async function getQuestById(questId) {
    const id = Number(questId);
    if (!Number.isFinite(id)) return null;

    const rows = await query(
        `SELECT q.quest_id, q.title, q.time_limit, q.target_count, q.drop_count, q.source_file,
                ${NPC_COUNT_SQL} AS npc_count
         FROM \`${QUESTS}\` q
         WHERE q.quest_id = ?
         LIMIT 1`,
        [id]
    );
    if (rows.length === 0) return null;

    const base = mapQuestSummary(rows[0]);
    const [targets, drops, npcs] = await Promise.all([
        query(
            `SELECT t.quest_id, t.target_index, t.mob_subindex, t.objective_id,
                    t.mob_id, t.mob_aegis_name, t.count, t.location, t.race, t.min_level,
                    m.name AS mob_name
             FROM \`${QUEST_TARGETS}\` t
             LEFT JOIN \`${MOBS}\` m ON m.mob_id = t.mob_id
             WHERE t.quest_id = ?
             ORDER BY t.target_index ASC, t.mob_subindex ASC
             LIMIT ?`,
            [id, TARGET_LIMIT]
        ),
        query(
            `SELECT d.quest_id, d.drop_index, d.mob_id, d.mob_aegis_name,
                    d.item_id, d.item_aegis_name, d.rate, d.rate_unit,
                    m.name AS mob_name,
                    it.name AS item_name, it.aegis_name AS item_aegis
             FROM \`${QUEST_DROPS}\` d
             LEFT JOIN \`${MOBS}\` m ON m.mob_id = d.mob_id
             LEFT JOIN \`${ITEMS}\` it ON it.item_id = d.item_id
             WHERE d.quest_id = ?
             ORDER BY d.drop_index ASC
             LIMIT ?`,
            [id, DROP_LIMIT]
        ),
        query(
            `SELECT l.link_id, l.npc_id, l.quest_id, l.role, l.script_path, l.script_line, l.in_quest_db,
                    n.name, n.display_name, n.map_id, n.x, n.y, n.npc_type
             FROM \`${NPC_QUESTS}\` l
             LEFT JOIN \`${NPCS}\` n ON n.npc_id = l.npc_id
             WHERE l.quest_id = ?
             ORDER BY COALESCE(n.display_name, n.name, l.npc_id) ASC
             LIMIT ?`,
            [id, NPC_LIMIT]
        )
    ]);

    return {
        ...base,
        targets: targets.map((row) => ({
            targetIndex: num(row.target_index),
            mobSubindex: num(row.mob_subindex),
            objectiveId: num(row.objective_id),
            mobId: num(row.mob_id),
            mobName: clean(row.mob_name) || clean(row.mob_aegis_name),
            mobAegisName: clean(row.mob_aegis_name),
            count: num(row.count),
            location: clean(row.location),
            race: clean(row.race),
            minLevel: num(row.min_level)
        })),
        drops: drops.map((row) => ({
            dropIndex: num(row.drop_index),
            mobId: num(row.mob_id),
            mobName: clean(row.mob_name) || clean(row.mob_aegis_name),
            mobAegisName: clean(row.mob_aegis_name),
            itemId: num(row.item_id),
            itemName: getItemDisplayName(row.item_id)
                || clean(row.item_name)
                || clean(row.item_aegis)
                || clean(row.item_aegis_name)
                || (row.item_id != null ? `#${row.item_id}` : null),
            itemAegisName: clean(row.item_aegis) || clean(row.item_aegis_name),
            rate: num(row.rate),
            rateUnit: clean(row.rate_unit)
        })),
        npcs: npcs.map((row) => ({
            linkId: row.link_id,
            npcId: clean(row.npc_id),
            name: clean(row.display_name) || clean(row.name) || clean(row.npc_id),
            type: clean(row.npc_type),
            mapId: clean(row.map_id),
            x: num(row.x),
            y: num(row.y),
            role: clean(row.role),
            scriptPath: clean(row.script_path),
            scriptLine: num(row.script_line),
            inQuestDb: row.in_quest_db == null ? null : Boolean(row.in_quest_db)
        })),
        targetTotal: Number(rows[0].target_count) || targets.length,
        dropTotal: Number(rows[0].drop_count) || drops.length,
        npcTotal: Number(rows[0].npc_count) || npcs.length
    };
}
