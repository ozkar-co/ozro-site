/**
 * Skill catalog: ozro_skills + mob_skills aggregates + client JSONL lore.
 */
import { query } from '../../services/mariadb.js';
import { T, parsePagination } from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';
import {
    findSkillIdsByDisplayName,
    getClientOnlySkill,
    getSkillClientPayload
} from './skillClientInfo.js';
import {
    normalizeAegisTail,
    parseAegisPrefix,
    resolveSkillDisplayName
} from './skillNames.js';

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

function mapSkillSummary(row) {
    const id = num(row.skill_id);
    const aegisName = row.aegis_name || row.skill_name || null;
    const aegisPrefix = row.aegis_prefix || parseAegisPrefix(aegisName);
    const serverDescription = row.server_description || row.description_text || null;
    const client = getSkillClientPayload(id) || {};

    const displayName = resolveSkillDisplayName({
        clientDisplayName: client.displayName,
        serverDescription,
        aegisName
    });

    return {
        id,
        name: displayName,
        displayName,
        aegisName,
        aegisPrefix,
        type: aegisPrefix,
        skillType: row.skill_type || null,
        targetType: row.target_type || null,
        maxLv: num(row.max_level) ?? client.maxLv ?? null,
        isQuest: bool(row.is_quest),
        isPlatinum: bool(row.is_platinum),
        mobCount: Number(row.mob_count) || 0,
        useCount: Number(row.use_count) || 0,
        // Client lore only — never the server description column.
        description: client.description || [],
        resourceName: client.resourceName || null,
        clientType: client.clientType ?? null,
        spAmount: client.spAmount ?? null,
        attackRange: client.attackRange ?? null,
        separateLv: client.separateLv ?? null,
        apAmount: client.apAmount ?? null,
        needSkills: client.needSkills ?? null,
        skillScale: client.skillScale ?? null
    };
}

async function fetchMobAggregates(skillIds) {
    if (!skillIds.length) return new Map();
    const placeholders = skillIds.map(() => '?').join(', ');
    const rows = await query(
        `SELECT skill_id,
                COUNT(*) AS use_count,
                COUNT(DISTINCT mob_id) AS mob_count
         FROM \`${T.MOB_SKILLS}\`
         WHERE skill_id IN (${placeholders})
         GROUP BY skill_id`,
        skillIds
    );
    const map = new Map();
    for (const row of rows) {
        map.set(Number(row.skill_id), {
            useCount: Number(row.use_count) || 0,
            mobCount: Number(row.mob_count) || 0
        });
    }
    return map;
}

function attachMobCounts(summary, aggregates) {
    const agg = aggregates.get(summary.id);
    if (!agg) return summary;
    return {
        ...summary,
        useCount: agg.useCount,
        mobCount: agg.mobCount
    };
}

export async function searchSkills(params) {
    const { page, limit, offset } = parsePagination(params);
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    const conditions = ['1=1'];
    const values = [];

    if (q) {
        if (/^\d+$/.test(q)) {
            conditions.push('sk.skill_id = ?');
            values.push(parseInt(q, 10));
        } else {
            const clauses = [];
            const match = buildTokenMatchClause('sk', [
                'sk.aegis_name',
                'sk.description',
                'sk.aegis_prefix'
            ], q);
            if (match) {
                clauses.push(match.clause);
                values.push(...match.values);
            }
            const clientIds = findSkillIdsByDisplayName(q, 400);
            if (clientIds.length > 0) {
                clauses.push(
                    `sk.skill_id IN (${clientIds.map(() => '?').join(', ')})`
                );
                values.push(...clientIds);
            }
            // Normalized aegis-tail match (e.g. Guidedattack from NPC_GUIDEDATTACK)
            const normalizedNeedle = q.replace(/\s+/g, '').toLowerCase();
            if (normalizedNeedle.length >= 3) {
                clauses.push(
                    `LOWER(REPLACE(SUBSTRING_INDEX(sk.aegis_name, '_', -1), '_', '')) LIKE ?`
                );
                values.push(`%${normalizedNeedle}%`);
            }
            if (clauses.length > 0) {
                conditions.push(`(${clauses.join(' OR ')})`);
            }
        }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const orderSql = q
        ? 'sk.aegis_name ASC, sk.skill_id ASC'
        : 'COALESCE(ms.use_count, 0) DESC, sk.aegis_name ASC, sk.skill_id ASC';

    const fromSql = `
        FROM \`${T.SKILLS}\` sk
        LEFT JOIN (
            SELECT skill_id,
                   COUNT(*) AS use_count,
                   COUNT(DISTINCT mob_id) AS mob_count
            FROM \`${T.MOB_SKILLS}\`
            GROUP BY skill_id
        ) ms ON ms.skill_id = sk.skill_id
    `;

    const [countRows, rows] = await Promise.all([
        query(
            `SELECT COUNT(*) AS total
             FROM \`${T.SKILLS}\` sk
             ${whereClause}`,
            values
        ),
        query(
            `SELECT sk.skill_id, sk.aegis_name, sk.aegis_prefix,
                    sk.description AS server_description,
                    sk.max_level, sk.skill_type, sk.target_type,
                    sk.is_quest, sk.is_platinum,
                    COALESCE(ms.use_count, 0) AS use_count,
                    COALESCE(ms.mob_count, 0) AS mob_count
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
        results: rows.map(mapSkillSummary)
    };
}

async function fetchItemCosts(skillId) {
    const rows = await query(
        `SELECT c.skill_item_cost_id, c.skill_id, c.skill_aegis_name,
                c.item_aegis_name, c.amount, c.level,
                i.item_id, i.display_name
         FROM \`${T.SKILL_ITEM_COSTS}\` c
         LEFT JOIN \`${T.ITEMS}\` i ON i.aegis_name = c.item_aegis_name
         WHERE c.skill_id = ?
         ORDER BY c.level ASC, c.item_aegis_name ASC`,
        [skillId]
    );
    return rows.map((row) => ({
        itemId: num(row.item_id),
        itemAegisName: row.item_aegis_name || null,
        itemName: row.display_name || row.item_aegis_name || null,
        amount: num(row.amount),
        level: num(row.level)
    }));
}

async function fetchTeachers(skillId) {
    const rows = await query(
        `SELECT skill_teacher_id, grant_kind, skill_id, skill_aegis_name,
                npc_id, npc_display_name, map_id, x, y, script_path, script_line
         FROM \`${T.SKILL_TEACHERS}\`
         WHERE skill_id = ?
         ORDER BY grant_kind ASC, npc_display_name ASC, map_id ASC`,
        [skillId]
    );
    return rows.map((row) => ({
        grantKind: row.grant_kind || null,
        npcId: row.npc_id || null,
        npcName: row.npc_display_name || null,
        mapId: row.map_id || null,
        x: num(row.x),
        y: num(row.y),
        scriptPath: row.script_path || null,
        scriptLine: num(row.script_line)
    }));
}

async function fetchRecipes(skillId) {
    const rows = await query(
        `SELECT r.recipe_id, r.recipe_family, r.require_skill_id, r.require_skill_lv,
                r.require_skill_name, r.result_item_id, r.result_aegis_name,
                r.result_amount, i.display_name
         FROM \`${T.RECIPES}\` r
         LEFT JOIN \`${T.ITEMS}\` i ON i.item_id = r.result_item_id
         WHERE r.require_skill_id = ?
         ORDER BY r.recipe_family ASC, r.result_aegis_name ASC
         LIMIT 40`,
        [skillId]
    );
    return rows.map((row) => ({
        recipeId: row.recipe_id || null,
        family: row.recipe_family || null,
        skillLevel: num(row.require_skill_lv),
        resultItemId: num(row.result_item_id),
        resultAegisName: row.result_aegis_name || null,
        resultName: row.display_name || row.result_aegis_name || null,
        resultAmount: num(row.result_amount)
    }));
}

export async function getSkillById(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id)) return null;

    const skillRows = await query(
        `SELECT sk.skill_id, sk.aegis_name, sk.aegis_prefix,
                sk.description AS server_description,
                sk.max_level, sk.skill_type, sk.target_type,
                sk.is_quest, sk.is_platinum
         FROM \`${T.SKILLS}\` sk
         WHERE sk.skill_id = ?
         LIMIT 1`,
        [id]
    );

    let summary;
    if (skillRows.length === 0) {
        // Mob-only / client-only skill not in player catalog.
        const mobAgg = await query(
            `SELECT skill_id, skill_name,
                    COUNT(*) AS use_count,
                    COUNT(DISTINCT mob_id) AS mob_count
             FROM \`${T.MOB_SKILLS}\`
             WHERE skill_id = ?
             GROUP BY skill_id, skill_name`,
            [id]
        );
        if (mobAgg.length === 0) {
            return getClientOnlySkill(id);
        }
        const aegisName = mobAgg[0].skill_name || null;
        summary = mapSkillSummary({
            skill_id: id,
            aegis_name: aegisName,
            aegis_prefix: parseAegisPrefix(aegisName),
            server_description: normalizeAegisTail(aegisName),
            max_level: null,
            skill_type: null,
            target_type: null,
            is_quest: 0,
            is_platinum: 0,
            use_count: mobAgg[0].use_count,
            mob_count: mobAgg[0].mob_count
        });
    } else {
        summary = mapSkillSummary(skillRows[0]);
        const aggregates = await fetchMobAggregates([id]);
        summary = attachMobCounts(summary, aggregates);
    }

    const [entryRows, mobRows, itemCosts, teachers, recipes] = await Promise.all([
        query(
            `SELECT skill_lv, state, condition_type, condition_value, rate, COUNT(*) AS entries
             FROM \`${T.MOB_SKILLS}\`
             WHERE skill_id = ?
             GROUP BY skill_lv, state, condition_type, condition_value, rate
             ORDER BY entries DESC, skill_lv DESC
             LIMIT 40`,
            [id]
        ),
        query(
            `SELECT s.mob_id, m.name, m.aegis_name, COUNT(*) AS uses
             FROM \`${T.MOB_SKILLS}\` s
             LEFT JOIN \`${T.MOBS}\` m ON m.mob_id = s.mob_id
             WHERE s.skill_id = ?
             GROUP BY s.mob_id, m.name, m.aegis_name
             ORDER BY uses DESC, m.name ASC
             LIMIT 40`,
            [id]
        ),
        fetchItemCosts(id).catch(() => []),
        fetchTeachers(id).catch(() => []),
        fetchRecipes(id).catch(() => [])
    ]);

    return {
        ...summary,
        variants: entryRows.map((row) => ({
            skillLv: num(row.skill_lv),
            state: row.state || null,
            conditionType: row.condition_type || null,
            conditionValue: row.condition_value || null,
            rate: num(row.rate),
            entries: Number(row.entries) || 0
        })),
        mobs: mobRows.map((row) => ({
            id: num(row.mob_id),
            name: row.name || null,
            nameAegis: row.aegis_name || null,
            uses: Number(row.uses) || 0
        })),
        itemCosts,
        teachers,
        recipes
    };
}
