/**
 * Skill catalog: ozro_mob_skills + client JSONL descriptions.
 */
import { query } from '../../services/mariadb.js';
import { T, parsePagination } from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';
import {
    findSkillIdsByDisplayName,
    getClientOnlySkill,
    getSkillClientPayload
} from './skillClientInfo.js';

function num(value) {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function mergeClient(summary) {
    const client = getSkillClientPayload(summary.id);
    if (!client) return summary;
    return {
        ...summary,
        name: client.displayName || summary.name || client.aegisName || null,
        ...client
    };
}

function mapSkillSummary(row) {
    return mergeClient({
        id: num(row.skill_id),
        name: row.skill_name || null,
        mobCount: Number(row.mob_count) || 0,
        useCount: Number(row.use_count) || 0
    });
}

export async function searchSkills(params) {
    const { page, limit, offset } = parsePagination(params);
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    const conditions = ['s.skill_id IS NOT NULL'];
    const values = [];

    if (q) {
        if (/^\d+$/.test(q)) {
            conditions.push('s.skill_id = ?');
            values.push(parseInt(q, 10));
        } else {
            const clauses = [];
            const match = buildTokenMatchClause('s', ['s.skill_name'], q);
            if (match) {
                clauses.push(match.clause);
                values.push(...match.values);
            }
            const clientIds = findSkillIdsByDisplayName(q, 300);
            if (clientIds.length > 0) {
                clauses.push(
                    `s.skill_id IN (${clientIds.map(() => '?').join(', ')})`
                );
                values.push(...clientIds);
            }
            if (clauses.length > 0) {
                conditions.push(`(${clauses.join(' OR ')})`);
            }
        }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const orderSql = q
        ? 's.skill_name ASC, s.skill_id ASC'
        : 'use_count DESC, s.skill_name ASC, s.skill_id ASC';

    const [countRows, rows] = await Promise.all([
        query(
            `SELECT COUNT(*) AS total FROM (
                SELECT s.skill_id
                FROM \`${T.MOB_SKILLS}\` s
                ${whereClause}
                GROUP BY s.skill_id, s.skill_name
             ) x`,
            values
        ),
        query(
            `SELECT s.skill_id, s.skill_name,
                    COUNT(*) AS use_count,
                    COUNT(DISTINCT s.mob_id) AS mob_count
             FROM \`${T.MOB_SKILLS}\` s
             ${whereClause}
             GROUP BY s.skill_id, s.skill_name
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

export async function getSkillById(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id)) return null;

    const summaryRows = await query(
        `SELECT s.skill_id, s.skill_name,
                COUNT(*) AS use_count,
                COUNT(DISTINCT s.mob_id) AS mob_count
         FROM \`${T.MOB_SKILLS}\` s
         WHERE s.skill_id = ?
         GROUP BY s.skill_id, s.skill_name`,
        [id]
    );

    if (summaryRows.length === 0) {
        return getClientOnlySkill(id);
    }

    const summary = mapSkillSummary(summaryRows[0]);
    const [entryRows, mobRows] = await Promise.all([
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
        )
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
        }))
    };
}
