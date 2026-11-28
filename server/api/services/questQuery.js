/**
 * Quest catalog as quest_groups (+ synthetic 1-member groups for orphans).
 * Members keep targets/drops; NPCs come from ozro_quest_group_npcs.
 */
import { query } from '../../services/mariadb.js';
import { OZRO_PREFIX, parseJsonColumn, parsePagination, parseBool } from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';
import { getItemDisplayName } from './itemInfo.js';

const QUESTS = `${OZRO_PREFIX}quests`;
const QUEST_TARGETS = `${OZRO_PREFIX}quest_targets`;
const QUEST_DROPS = `${OZRO_PREFIX}quest_drops`;
const QUEST_GROUPS = `${OZRO_PREFIX}quest_groups`;
const QUEST_GROUP_MEMBERS = `${OZRO_PREFIX}quest_group_members`;
const QUEST_GROUP_NPCS = `${OZRO_PREFIX}quest_group_npcs`;
const QUEST_GROUP_EDGES = `${OZRO_PREFIX}quest_group_edges`;
const NPC_QUESTS = `${OZRO_PREFIX}npc_quests`;
const NPCS = `${OZRO_PREFIX}npcs`;
const MOBS = `${OZRO_PREFIX}mobs`;
const ITEMS = `${OZRO_PREFIX}items`;

const TARGET_LIMIT = 80;
const DROP_LIMIT = 40;
const NPC_LIMIT = 60;
const MEMBER_LIMIT = 80;
const EDGE_LIMIT = 40;

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

function parseReasons(raw) {
    const value = parseJsonColumn(raw, null);
    if (!Array.isArray(value)) return [];
    return value.map((r) => clean(r)).filter(Boolean);
}

function syntheticGroupId(questId) {
    return `qg_${questId}`;
}

function parseGroupIdParam(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;
    if (/^qg_\d+$/i.test(text)) {
        return { kind: 'group', groupId: `qg_${text.replace(/^qg_/i, '')}` };
    }
    if (/^\d+$/.test(text)) {
        return { kind: 'quest', questId: Number(text) };
    }
    return null;
}

/** Catalog: real groups UNION orphan quests as synthetic qg_{id}. */
function catalogFromSql() {
    return `
        SELECT
            g.group_id AS group_id,
            g.display_title AS display_title,
            g.member_count AS member_count,
            g.merge_reasons AS merge_reasons,
            g.primary_merge_reason AS primary_merge_reason,
            0 AS is_synthetic,
            (
                SELECT COALESCE(SUM(COALESCE(qq.target_count, 0)), 0)
                FROM \`${QUEST_GROUP_MEMBERS}\` m
                JOIN \`${QUESTS}\` qq ON qq.quest_id = m.quest_id
                WHERE m.group_id = g.group_id
            ) AS target_count,
            (
                SELECT COALESCE(SUM(COALESCE(qq.drop_count, 0)), 0)
                FROM \`${QUEST_GROUP_MEMBERS}\` m
                JOIN \`${QUESTS}\` qq ON qq.quest_id = m.quest_id
                WHERE m.group_id = g.group_id
            ) AS drop_count,
            (
                SELECT COUNT(*)
                FROM \`${QUEST_GROUP_NPCS}\` n
                WHERE n.group_id = g.group_id
            ) AS npc_count,
            (
                SELECT MAX(CASE WHEN qq.time_limit IS NOT NULL THEN 1 ELSE 0 END)
                FROM \`${QUEST_GROUP_MEMBERS}\` m
                JOIN \`${QUESTS}\` qq ON qq.quest_id = m.quest_id
                WHERE m.group_id = g.group_id
            ) AS has_time_limit_flag,
            (
                SELECT MIN(m.quest_id)
                FROM \`${QUEST_GROUP_MEMBERS}\` m
                WHERE m.group_id = g.group_id
            ) AS min_quest_id
        FROM \`${QUEST_GROUPS}\` g

        UNION ALL

        SELECT
            CONCAT('qg_', q.quest_id) AS group_id,
            q.title AS display_title,
            1 AS member_count,
            NULL AS merge_reasons,
            NULL AS primary_merge_reason,
            1 AS is_synthetic,
            COALESCE(q.target_count, 0) AS target_count,
            COALESCE(q.drop_count, 0) AS drop_count,
            (
                SELECT COUNT(*) FROM \`${NPC_QUESTS}\` l WHERE l.quest_id = q.quest_id
            ) AS npc_count,
            CASE WHEN q.time_limit IS NOT NULL THEN 1 ELSE 0 END AS has_time_limit_flag,
            q.quest_id AS min_quest_id
        FROM \`${QUESTS}\` q
        WHERE NOT EXISTS (
            SELECT 1 FROM \`${QUEST_GROUP_MEMBERS}\` m WHERE m.quest_id = q.quest_id
        )
    `;
}

function mapGroupSummary(row) {
    return {
        id: clean(row.group_id),
        title: clean(row.display_title) || clean(row.group_id) || 'Quest group',
        memberCount: Number(row.member_count) || 0,
        targetCount: Number(row.target_count) || 0,
        dropCount: Number(row.drop_count) || 0,
        npcCount: Number(row.npc_count) || 0,
        hasTimeLimit: Boolean(Number(row.has_time_limit_flag)),
        mergeReasons: parseReasons(row.merge_reasons),
        primaryMergeReason: clean(row.primary_merge_reason),
        isSynthetic: Boolean(Number(row.is_synthetic))
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
    const catalog = catalogFromSql();

    if (q) {
        if (/^qg_\d+$/i.test(q)) {
            conditions.push('c.group_id = ?');
            values.push(`qg_${q.replace(/^qg_/i, '')}`);
        } else if (/^\d+$/.test(q)) {
            const questId = Number(q);
            conditions.push(`(
                c.min_quest_id = ?
                OR EXISTS (
                    SELECT 1 FROM \`${QUEST_GROUP_MEMBERS}\` m
                    WHERE m.group_id = c.group_id AND m.quest_id = ?
                )
                OR (c.is_synthetic = 1 AND c.group_id = ?)
            )`);
            values.push(questId, questId, syntheticGroupId(questId));
        } else {
            const match = buildTokenMatchClause('c', [
                'c.display_title',
                'c.group_id'
            ], q);
            const memberMatch = buildTokenMatchClause('mq', [
                'mq.title',
                'CAST(mq.quest_id AS CHAR)'
            ], q);
            if (match && memberMatch) {
                // Orphans already match via c.display_title; members cover multi-step titles.
                conditions.push(`(
                    (${match.clause})
                    OR EXISTS (
                        SELECT 1 FROM \`${QUEST_GROUP_MEMBERS}\` mq
                        WHERE mq.group_id = c.group_id AND (${memberMatch.clause})
                    )
                )`);
                values.push(...match.values, ...memberMatch.values);
            } else if (match) {
                conditions.push(match.clause);
                values.push(...match.values);
            }
        }
    }

    if (hasTargets === true) conditions.push('COALESCE(c.target_count, 0) > 0');
    else if (hasTargets === false) conditions.push('COALESCE(c.target_count, 0) = 0');

    if (hasDrops === true) conditions.push('COALESCE(c.drop_count, 0) > 0');
    else if (hasDrops === false) conditions.push('COALESCE(c.drop_count, 0) = 0');

    if (hasNpc === true) conditions.push('COALESCE(c.npc_count, 0) > 0');
    else if (hasNpc === false) conditions.push('COALESCE(c.npc_count, 0) = 0');

    if (hasTimeLimit === true) conditions.push('COALESCE(c.has_time_limit_flag, 0) = 1');
    else if (hasTimeLimit === false) conditions.push('COALESCE(c.has_time_limit_flag, 0) = 0');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const titleRank = Boolean(q) && !/^\d+$/.test(q) && !/^qg_\d+$/i.test(q);
    const orderSql = titleRank
        ? 'CASE WHEN c.display_title LIKE ? THEN 0 ELSE 1 END ASC, c.min_quest_id ASC'
        : 'c.min_quest_id ASC';
    const orderValues = titleRank ? [`%${q}%`] : [];

    const fromSql = `FROM (${catalog}) c`;

    const [countRows, rows] = await Promise.all([
        query(`SELECT COUNT(*) AS total ${fromSql} ${whereClause}`, values),
        query(
            `SELECT c.group_id, c.display_title, c.member_count, c.merge_reasons,
                    c.primary_merge_reason, c.is_synthetic, c.target_count, c.drop_count,
                    c.npc_count, c.has_time_limit_flag, c.min_quest_id
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
        results: rows.map(mapGroupSummary)
    };
}

async function resolveGroupId(param) {
    const parsed = parseGroupIdParam(param);
    if (!parsed) return null;

    if (parsed.kind === 'group') {
        const real = await query(
            `SELECT group_id FROM \`${QUEST_GROUPS}\` WHERE group_id = ? LIMIT 1`,
            [parsed.groupId]
        );
        if (real.length) {
            return { groupId: parsed.groupId, focusQuestId: null, synthetic: false };
        }
        // Synthetic qg_N with no real group row
        const questId = Number(String(parsed.groupId).replace(/^qg_/i, ''));
        if (!Number.isFinite(questId)) return null;
        const orphan = await query(
            `SELECT quest_id FROM \`${QUESTS}\` q
             WHERE q.quest_id = ?
               AND NOT EXISTS (
                   SELECT 1 FROM \`${QUEST_GROUP_MEMBERS}\` m WHERE m.quest_id = q.quest_id
               )
             LIMIT 1`,
            [questId]
        );
        if (!orphan.length) return null;
        return { groupId: syntheticGroupId(questId), focusQuestId: questId, synthetic: true };
    }

    const questId = parsed.questId;
    const member = await query(
        `SELECT group_id FROM \`${QUEST_GROUP_MEMBERS}\` WHERE quest_id = ? LIMIT 1`,
        [questId]
    );
    if (member.length) {
        return {
            groupId: clean(member[0].group_id),
            focusQuestId: questId,
            synthetic: false
        };
    }
    const quest = await query(
        `SELECT quest_id FROM \`${QUESTS}\` WHERE quest_id = ? LIMIT 1`,
        [questId]
    );
    if (!quest.length) return null;
    return {
        groupId: syntheticGroupId(questId),
        focusQuestId: questId,
        synthetic: true
    };
}

async function loadFocusPayload(focusQuestId) {
    if (focusQuestId == null) {
        return { targets: [], drops: [], timeLimit: null, targetCount: 0, dropCount: 0 };
    }
    const [questRows, targets, drops] = await Promise.all([
        query(
            `SELECT time_limit, target_count, drop_count FROM \`${QUESTS}\` WHERE quest_id = ? LIMIT 1`,
            [focusQuestId]
        ),
        query(
            `SELECT t.quest_id, t.target_index, t.mob_subindex, t.objective_id,
                    t.mob_id, t.mob_aegis_name, t.count, t.location, t.race, t.min_level,
                    m.name AS mob_name
             FROM \`${QUEST_TARGETS}\` t
             LEFT JOIN \`${MOBS}\` m ON m.mob_id = t.mob_id
             WHERE t.quest_id = ?
             ORDER BY t.target_index ASC, t.mob_subindex ASC
             LIMIT ?`,
            [focusQuestId, TARGET_LIMIT]
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
            [focusQuestId, DROP_LIMIT]
        )
    ]);
    const qrow = questRows[0] || {};
    return {
        timeLimit: parseTimeLimit(qrow.time_limit),
        targetCount: Number(qrow.target_count) || targets.length,
        dropCount: Number(qrow.drop_count) || drops.length,
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
        }))
    };
}

export async function getQuestById(rawId) {
    const resolved = await resolveGroupId(rawId);
    if (!resolved) return null;

    const { groupId, focusQuestId: resolvedFocus, synthetic } = resolved;

    if (synthetic) {
        const questId = Number(String(groupId).replace(/^qg_/i, ''));
        const rows = await query(
            `SELECT quest_id, title, time_limit, target_count, drop_count, source_file
             FROM \`${QUESTS}\` WHERE quest_id = ? LIMIT 1`,
            [questId]
        );
        if (!rows.length) return null;
        const q = rows[0];
        const focusQuestId = resolvedFocus || questId;
        const focus = await loadFocusPayload(focusQuestId);
        const npcRows = await query(
            `SELECT l.link_id, l.npc_id, l.script_path, l.script_line,
                    n.name, n.display_name, n.map_id, n.x, n.y, n.npc_type
             FROM \`${NPC_QUESTS}\` l
             LEFT JOIN \`${NPCS}\` n ON n.npc_id = l.npc_id
             WHERE l.quest_id = ?
             ORDER BY COALESCE(n.display_name, n.name, l.npc_id) ASC
             LIMIT ?`,
            [questId, NPC_LIMIT]
        );
        const npcs = npcRows.map((row) => ({
            linkId: row.link_id,
            npcId: clean(row.npc_id),
            name: clean(row.display_name) || clean(row.name) || clean(row.npc_id),
            type: clean(row.npc_type),
            mapId: clean(row.map_id),
            x: num(row.x),
            y: num(row.y),
            reasons: ['same_id'],
            primaryReason: 'same_id',
            scriptPath: clean(row.script_path),
            scriptLine: num(row.script_line)
        }));

        return {
            id: groupId,
            title: clean(q.title) || `Quest #${questId}`,
            memberCount: 1,
            targetCount: Number(q.target_count) || 0,
            dropCount: Number(q.drop_count) || 0,
            npcCount: npcs.length,
            hasTimeLimit: Boolean(focus.timeLimit),
            timeLimit: focus.timeLimit,
            mergeReasons: [],
            primaryMergeReason: null,
            isSynthetic: true,
            focusQuestId,
            members: [{
                questId,
                title: clean(q.title),
                sortIndex: 0,
                inQuestDb: true,
                targetCount: Number(q.target_count) || 0,
                dropCount: Number(q.drop_count) || 0,
                hasTimeLimit: Boolean(focus.timeLimit)
            }],
            edges: [],
            npcs,
            targets: focus.targets,
            drops: focus.drops,
            targetTotal: focus.targetCount,
            dropTotal: focus.dropCount,
            npcTotal: npcs.length
        };
    }

    const groupRows = await query(
        `SELECT group_id, display_title, member_count, merge_reasons, primary_merge_reason
         FROM \`${QUEST_GROUPS}\`
         WHERE group_id = ?
         LIMIT 1`,
        [groupId]
    );
    if (!groupRows.length) return null;
    const g = groupRows[0];

    const [memberRows, npcRows, edgeRows] = await Promise.all([
        query(
            `SELECT m.quest_id, m.title, m.sort_index, m.in_quest_db,
                    q.target_count, q.drop_count, q.time_limit
             FROM \`${QUEST_GROUP_MEMBERS}\` m
             LEFT JOIN \`${QUESTS}\` q ON q.quest_id = m.quest_id
             WHERE m.group_id = ?
             ORDER BY m.sort_index ASC, m.quest_id ASC
             LIMIT ?`,
            [groupId, MEMBER_LIMIT]
        ),
        query(
            `SELECT gn.link_id, gn.npc_id, gn.reasons, gn.primary_reason,
                    gn.script_path, gn.script_line,
                    n.name, n.display_name, n.map_id, n.x, n.y, n.npc_type
             FROM \`${QUEST_GROUP_NPCS}\` gn
             LEFT JOIN \`${NPCS}\` n ON n.npc_id = gn.npc_id
             WHERE gn.group_id = ?
             ORDER BY
                CASE gn.primary_reason WHEN 'same_id' THEN 0 ELSE 1 END,
                COALESCE(n.display_name, n.name, gn.npc_id) ASC
             LIMIT ?`,
            [groupId, NPC_LIMIT]
        ),
        query(
            `SELECT edge_id, from_quest_id, to_quest_id, reasons, primary_reason
             FROM \`${QUEST_GROUP_EDGES}\`
             WHERE group_id = ?
             ORDER BY from_quest_id ASC, to_quest_id ASC
             LIMIT ?`,
            [groupId, EDGE_LIMIT]
        )
    ]);

    const members = memberRows.map((row) => ({
        questId: num(row.quest_id),
        title: clean(row.title),
        sortIndex: num(row.sort_index) ?? 0,
        inQuestDb: row.in_quest_db == null ? null : Boolean(row.in_quest_db),
        targetCount: Number(row.target_count) || 0,
        dropCount: Number(row.drop_count) || 0,
        hasTimeLimit: row.time_limit != null
    }));

    let focusQuestId = resolvedFocus;
    if (focusQuestId == null && members.length) {
        focusQuestId = members[0].questId;
    }

    const focus = await loadFocusPayload(focusQuestId);
    const npcs = npcRows.map((row) => ({
        linkId: row.link_id,
        npcId: clean(row.npc_id),
        name: clean(row.display_name) || clean(row.name) || clean(row.npc_id),
        type: clean(row.npc_type),
        mapId: clean(row.map_id),
        x: num(row.x),
        y: num(row.y),
        reasons: parseReasons(row.reasons),
        primaryReason: clean(row.primary_reason),
        scriptPath: clean(row.script_path),
        scriptLine: num(row.script_line)
    }));

    const targetSum = members.reduce((s, m) => s + (m.targetCount || 0), 0);
    const dropSum = members.reduce((s, m) => s + (m.dropCount || 0), 0);

    return {
        id: clean(g.group_id),
        title: clean(g.display_title) || clean(g.group_id),
        memberCount: Number(g.member_count) || members.length,
        targetCount: targetSum,
        dropCount: dropSum,
        npcCount: npcs.length,
        hasTimeLimit: members.some((m) => m.hasTimeLimit),
        timeLimit: focus.timeLimit,
        mergeReasons: parseReasons(g.merge_reasons),
        primaryMergeReason: clean(g.primary_merge_reason),
        isSynthetic: false,
        focusQuestId,
        members,
        edges: edgeRows.map((row) => ({
            edgeId: clean(row.edge_id),
            fromQuestId: num(row.from_quest_id),
            toQuestId: num(row.to_quest_id),
            reasons: parseReasons(row.reasons),
            primaryReason: clean(row.primary_reason)
        })),
        npcs,
        targets: focus.targets,
        drops: focus.drops,
        targetTotal: focus.targetCount,
        dropTotal: focus.dropCount,
        npcTotal: npcs.length
    };
}
