/**
 * NPC queries against ozro_npcs (+ shops / functions / quests / rewards / teachers).
 */
import { query } from '../../services/mariadb.js';
import {
    OZRO_PREFIX,
    mapAccessibleSql,
    parsePagination,
    parseJsonColumn
} from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';
import { getItemDisplayName } from './itemInfo.js';

const NPCS = `${OZRO_PREFIX}npcs`;
const MAPS = `${OZRO_PREFIX}maps`;
const NPC_FUNCTIONS = `${OZRO_PREFIX}npc_functions`;
const NPC_SHOPS = `${OZRO_PREFIX}npc_shops`;
const NPC_SHOP_ITEMS = `${OZRO_PREFIX}npc_shop_items`;
const NPC_SHOP_LINKS = `${OZRO_PREFIX}npc_shop_links`;
const NPC_SHOP_LINK_SHOPS = `${OZRO_PREFIX}npc_shop_link_shops`;
const NPC_QUESTS = `${OZRO_PREFIX}npc_quests`;
const QUEST_GROUP_NPCS = `${OZRO_PREFIX}quest_group_npcs`;
const QUEST_GROUPS = `${OZRO_PREFIX}quest_groups`;
const NPC_SCRIPT_REWARDS = `${OZRO_PREFIX}npc_script_rewards`;
const QUESTS = `${OZRO_PREFIX}quests`;
const SKILL_TEACHERS = `${OZRO_PREFIX}skill_teachers`;
const SKILLS = `${OZRO_PREFIX}skills`;
const ITEMS = `${OZRO_PREFIX}items`;

const SHOP_ITEM_LIMIT = 80;
const QUEST_LIMIT = 40;
const REWARD_LIMIT = 40;
const TEACHER_LIMIT = 30;
const LINK_LIMIT = 20;

function num(value) {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function cleanName(value) {
    if (value == null) return null;
    const text = String(value).trim();
    return text || null;
}

function mapNpcSummary(row) {
    return {
        id: row.npc_id,
        name: cleanName(row.display_name) || cleanName(row.name) || row.npc_id,
        nameRaw: cleanName(row.name),
        type: row.npc_type || null,
        mapId: row.map_id || null,
        x: num(row.x),
        y: num(row.y),
        spriteStem: row.sprite_stem || null,
        hasSprite: row.has_sprite == null ? null : Boolean(row.has_sprite),
        scriptPath: row.script_path || null,
        shopCount: Number(row.shop_count) || 0,
        functionCount: Number(row.function_count) || 0,
        questCount: Number(row.quest_count) || 0,
        rewardCount: Number(row.reward_count) || 0,
        teacherCount: Number(row.teacher_count) || 0,
        shopLinkCount: Number(row.shop_link_count) || 0
    };
}

function parseCsvParam(value) {
    if (typeof value !== 'string') return [];
    return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function parseBoolFlag(value) {
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return null;
}

const FUNCTION_COUNT_SQL = `(SELECT COUNT(*) FROM \`${NPC_FUNCTIONS}\` f
    WHERE f.npc_id = n.npc_id AND f.function_name <> 'pending')`;
const SHOP_COUNT_SQL = `(SELECT COUNT(*) FROM \`${NPC_SHOPS}\` s WHERE s.npc_id = n.npc_id)`;
const QUEST_COUNT_SQL = `(
    (SELECT COUNT(*) FROM \`${QUEST_GROUP_NPCS}\` qg WHERE qg.npc_id = n.npc_id)
    + CASE
        WHEN EXISTS (
            SELECT 1 FROM \`${QUEST_GROUP_NPCS}\` qg2 WHERE qg2.npc_id = n.npc_id
        ) THEN 0
        ELSE (
            SELECT COUNT(*) FROM \`${NPC_QUESTS}\` q WHERE q.npc_id = n.npc_id
        )
      END
)`;
const REWARD_COUNT_SQL = `(SELECT COUNT(*) FROM \`${NPC_SCRIPT_REWARDS}\` r WHERE r.npc_id = n.npc_id)`;
const TEACHER_COUNT_SQL = `(SELECT COUNT(*) FROM \`${SKILL_TEACHERS}\` t WHERE t.npc_id = n.npc_id)`;
const SHOP_LINK_COUNT_SQL = `(SELECT COUNT(*) FROM \`${NPC_SHOP_LINKS}\` l WHERE l.caller_npc_id = n.npc_id)`;

export async function searchNpcs(params) {
    const { page, limit, offset } = parsePagination(params);
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    const types = parseCsvParam(params.type);
    const hasShop = parseBoolFlag(params.hasShop);
    const hasSprite = parseBoolFlag(params.hasSprite);
    const hasReward = parseBoolFlag(params.hasReward);
    const hasQuest = parseBoolFlag(params.hasQuest);
    const accessible = parseBoolFlag(params.accessible);
    const conditions = [];
    const values = [];

    if (types.length === 1) {
        conditions.push('n.npc_type = ?');
        values.push(types[0]);
    } else if (types.length > 1) {
        conditions.push(`n.npc_type IN (${types.map(() => '?').join(', ')})`);
        values.push(...types);
    }

    if (hasShop === true) {
        conditions.push(
            `EXISTS (SELECT 1 FROM \`${NPC_SHOPS}\` s WHERE s.npc_id = n.npc_id)`
        );
    } else if (hasShop === false) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM \`${NPC_SHOPS}\` s WHERE s.npc_id = n.npc_id)`
        );
    }

    if (hasReward === true) {
        conditions.push(
            `EXISTS (SELECT 1 FROM \`${NPC_SCRIPT_REWARDS}\` r WHERE r.npc_id = n.npc_id)`
        );
    } else if (hasReward === false) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM \`${NPC_SCRIPT_REWARDS}\` r WHERE r.npc_id = n.npc_id)`
        );
    }

    if (hasQuest === true) {
        conditions.push(
            `EXISTS (SELECT 1 FROM \`${NPC_QUESTS}\` q WHERE q.npc_id = n.npc_id)`
        );
    } else if (hasQuest === false) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM \`${NPC_QUESTS}\` q WHERE q.npc_id = n.npc_id)`
        );
    }

    if (hasSprite === true) {
        conditions.push('COALESCE(n.has_sprite, 0) = 1');
    } else if (hasSprite === false) {
        conditions.push('COALESCE(n.has_sprite, 0) = 0');
    }

    // NPC accessible ⇔ its map is traditionally reachable (Dijkstra / hubs).
    if (accessible === true) {
        conditions.push(
            `EXISTS (
                SELECT 1 FROM \`${MAPS}\` m
                WHERE m.map_id = n.map_id
                  AND ${mapAccessibleSql('m')}
            )`
        );
    } else if (accessible === false) {
        conditions.push(
            `(
                n.map_id IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM \`${MAPS}\` m
                    WHERE m.map_id = n.map_id
                      AND ${mapAccessibleSql('m')}
                )
            )`
        );
    }

    if (q) {
        if (/^npc_[0-9a-f]+$/i.test(q)) {
            conditions.push('n.npc_id = ?');
            values.push(q);
        } else {
            const match = buildTokenMatchClause(
                'n',
                ['n.name', 'n.display_name', 'n.map_id', 'n.npc_id', 'n.sprite_stem'],
                q
            );
            if (match) {
                conditions.push(match.clause);
                values.push(...match.values);
            }
        }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderSql = 'n.name ASC, n.npc_id ASC';

    const [countRows, rows] = await Promise.all([
        query(
            `SELECT COUNT(*) AS total FROM \`${NPCS}\` n ${whereClause}`,
            values
        ),
        query(
            `SELECT n.npc_id, n.name, n.display_name, n.npc_type, n.map_id, n.x, n.y,
                    n.sprite_stem, n.has_sprite, n.script_path,
                    ${SHOP_COUNT_SQL} AS shop_count,
                    ${FUNCTION_COUNT_SQL} AS function_count,
                    ${QUEST_COUNT_SQL} AS quest_count,
                    ${REWARD_COUNT_SQL} AS reward_count,
                    ${TEACHER_COUNT_SQL} AS teacher_count,
                    ${SHOP_LINK_COUNT_SQL} AS shop_link_count
             FROM \`${NPCS}\` n
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
        results: rows.map(mapNpcSummary)
    };
}

export async function getNpcById(npcId) {
    const id = String(npcId || '').trim();
    if (!id) return null;

    const rows = await query(
        `SELECT n.npc_id, n.name, n.display_name, n.npc_type, n.map_id, n.x, n.y,
                n.sprite_stem, n.has_sprite, n.script_path, n.script_line, n.facing,
                n.duplicate_of, n.client, n.script_analysis,
                ${SHOP_COUNT_SQL} AS shop_count,
                ${FUNCTION_COUNT_SQL} AS function_count,
                ${QUEST_COUNT_SQL} AS quest_count,
                ${REWARD_COUNT_SQL} AS reward_count,
                ${TEACHER_COUNT_SQL} AS teacher_count,
                ${SHOP_LINK_COUNT_SQL} AS shop_link_count
         FROM \`${NPCS}\` n
         WHERE n.npc_id = ?
         LIMIT 1`,
        [id]
    );
    if (rows.length === 0) return null;

    const base = mapNpcSummary(rows[0]);
    const [
        shops,
        functions,
        shopItems,
        shopItemCountRows,
        quests,
        rewards,
        teachers,
        shopLinks
    ] = await Promise.all([
        query(
            `SELECT shop_id, shop_name, shop_type, map_id, x, y, item_count, currency, sprite
             FROM \`${NPC_SHOPS}\`
             WHERE npc_id = ?
             ORDER BY shop_name ASC
             LIMIT 30`,
            [id]
        ),
        query(
            `SELECT function_name
             FROM \`${NPC_FUNCTIONS}\`
             WHERE npc_id = ? AND function_name <> 'pending'
             ORDER BY function_name ASC
             LIMIT 40`,
            [id]
        ),
        query(
            `SELECT i.shop_id, i.list_index, i.item_id, i.price, i.price_effective,
                    i.stock, i.price_source,
                    it.name AS item_name, it.aegis_name
             FROM \`${NPC_SHOP_ITEMS}\` i
             JOIN \`${NPC_SHOPS}\` s ON s.shop_id = i.shop_id
             LEFT JOIN \`${ITEMS}\` it ON it.item_id = i.item_id
             WHERE s.npc_id = ?
             ORDER BY s.shop_name ASC, i.list_index ASC
             LIMIT ?`,
            [id, SHOP_ITEM_LIMIT]
        ),
        query(
            `SELECT COUNT(*) AS total
             FROM \`${NPC_SHOP_ITEMS}\` i
             JOIN \`${NPC_SHOPS}\` s ON s.shop_id = i.shop_id
             WHERE s.npc_id = ?`,
            [id]
        ),
        query(
            `SELECT gn.link_id, gn.group_id, gn.reasons, gn.primary_reason,
                    gn.script_path, gn.script_line,
                    g.display_title, g.member_count
             FROM \`${QUEST_GROUP_NPCS}\` gn
             LEFT JOIN \`${QUEST_GROUPS}\` g ON g.group_id = gn.group_id
             WHERE gn.npc_id = ?
             ORDER BY
                CASE gn.primary_reason WHEN 'same_id' THEN 0 ELSE 1 END,
                COALESCE(g.display_title, gn.group_id) ASC
             LIMIT ?`,
            [id, QUEST_LIMIT]
        ),
        query(
            `SELECT r.npc_script_reward_id, r.item_id, r.quantity, r.refine,
                    r.delivery_kind, r.acquisition_type, r.script_path, r.script_line,
                    it.name AS item_name, it.aegis_name
             FROM \`${NPC_SCRIPT_REWARDS}\` r
             LEFT JOIN \`${ITEMS}\` it ON it.item_id = r.item_id
             WHERE r.npc_id = ?
             ORDER BY r.item_id ASC
             LIMIT ?`,
            [id, REWARD_LIMIT]
        ),
        query(
            `SELECT t.skill_teacher_id, t.skill_id, t.skill_aegis_name, t.grant_kind,
                    t.map_id, t.x, t.y, t.script_path, t.script_line,
                    sk.aegis_name AS skill_aegis, sk.description AS skill_description
             FROM \`${SKILL_TEACHERS}\` t
             LEFT JOIN \`${SKILLS}\` sk ON sk.skill_id = t.skill_id
             WHERE t.npc_id = ?
             ORDER BY t.skill_id ASC
             LIMIT ?`,
            [id, TEACHER_LIMIT]
        ),
        query(
            `SELECT l.link_id, l.target_name, l.item_count, l.resolve_status,
                    l.script_path, l.script_line, l.is_runtime,
                    ls.shop_id, s.shop_name, s.shop_type, s.npc_id AS shop_npc_id
             FROM \`${NPC_SHOP_LINKS}\` l
             LEFT JOIN \`${NPC_SHOP_LINK_SHOPS}\` ls ON ls.link_id = l.link_id
             LEFT JOIN \`${NPC_SHOPS}\` s ON s.shop_id = ls.shop_id
             WHERE l.caller_npc_id = ?
             ORDER BY l.target_name ASC, ls.shop_id ASC
             LIMIT ?`,
            [id, LINK_LIMIT]
        )
    ]);

    const itemsByShop = new Map();
    for (const row of shopItems) {
        const list = itemsByShop.get(row.shop_id) || [];
        list.push({
            itemId: num(row.item_id),
            name: getItemDisplayName(row.item_id) || cleanName(row.item_name) || cleanName(row.aegis_name) || `#${row.item_id}`,
            aegisName: cleanName(row.aegis_name),
            price: num(row.price_effective) ?? num(row.price),
            stock: num(row.stock),
            listIndex: num(row.list_index)
        });
        itemsByShop.set(row.shop_id, list);
    }

    const linksById = new Map();
    for (const row of shopLinks) {
        const existing = linksById.get(row.link_id) || {
            linkId: row.link_id,
            targetName: cleanName(row.target_name),
            itemCount: num(row.item_count),
            resolveStatus: row.resolve_status || null,
            isRuntime: row.is_runtime == null ? null : Boolean(row.is_runtime),
            scriptPath: row.script_path || null,
            scriptLine: num(row.script_line),
            shops: []
        };
        if (row.shop_id) {
            existing.shops.push({
                shopId: row.shop_id,
                shopName: cleanName(row.shop_name) || row.shop_id,
                shopType: row.shop_type || null,
                shopNpcId: row.shop_npc_id || null
            });
        }
        linksById.set(row.link_id, existing);
    }

    let questPayload = quests.map((row) => {
        const reasons = (() => {
            const value = parseJsonColumn(row.reasons, null);
            if (!Array.isArray(value)) return [];
            return value.map((r) => cleanName(r)).filter(Boolean);
        })();
        return {
            linkId: row.link_id,
            groupId: cleanName(row.group_id),
            memberCount: num(row.member_count),
            title: cleanName(row.display_title) || cleanName(row.group_id),
            reasons,
            primaryReason: cleanName(row.primary_reason),
            scriptPath: row.script_path || null,
            scriptLine: num(row.script_line)
        };
    });

    if (questPayload.length === 0) {
        const legacy = await query(
            `SELECT nq.link_id, nq.quest_id, nq.role, nq.script_path, nq.script_line,
                    q.title AS quest_title
             FROM \`${NPC_QUESTS}\` nq
             LEFT JOIN \`${QUESTS}\` q ON q.quest_id = nq.quest_id
             WHERE nq.npc_id = ?
             ORDER BY nq.quest_id ASC
             LIMIT ?`,
            [id, QUEST_LIMIT]
        );
        questPayload = legacy.map((row) => ({
            linkId: row.link_id,
            groupId: row.quest_id != null ? `qg_${row.quest_id}` : null,
            memberCount: 1,
            questId: num(row.quest_id),
            title: cleanName(row.quest_title)
                || (row.quest_id != null ? `Quest #${row.quest_id}` : null),
            reasons: ['same_id'],
            primaryReason: 'same_id',
            role: row.role || null,
            scriptPath: row.script_path || null,
            scriptLine: num(row.script_line)
        }));
    }

    return {
        ...base,
        facing: num(rows[0].facing),
        scriptLine: num(rows[0].script_line),
        duplicateOf: rows[0].duplicate_of || null,
        client: parseJsonColumn(rows[0].client, null),
        shops: shops.map((shop) => ({
            shopId: shop.shop_id,
            shopName: cleanName(shop.shop_name) || shop.shop_id,
            shopType: shop.shop_type || null,
            mapId: shop.map_id || null,
            x: num(shop.x),
            y: num(shop.y),
            itemCount: num(shop.item_count),
            currency: shop.currency || null,
            sprite: shop.sprite || null,
            items: itemsByShop.get(shop.shop_id) || []
        })),
        functions: functions.map((row) => row.function_name).filter(Boolean),
        quests: questPayload,
        rewards: rewards.map((row) => ({
            rewardId: row.npc_script_reward_id,
            itemId: num(row.item_id),
            name: getItemDisplayName(row.item_id) || cleanName(row.item_name) || cleanName(row.aegis_name) || `#${row.item_id}`,
            aegisName: cleanName(row.aegis_name),
            quantity: num(row.quantity),
            refine: num(row.refine),
            deliveryKind: row.delivery_kind || null,
            acquisitionType: row.acquisition_type || null
        })),
        teachers: teachers.map((row) => ({
            teacherId: row.skill_teacher_id,
            skillId: num(row.skill_id),
            skillName: cleanName(row.skill_description)
                || cleanName(row.skill_aegis)
                || cleanName(row.skill_aegis_name)
                || (row.skill_id != null ? `Skill #${row.skill_id}` : null),
            skillAegis: cleanName(row.skill_aegis) || cleanName(row.skill_aegis_name),
            grantKind: row.grant_kind || null,
            mapId: row.map_id || null,
            x: num(row.x),
            y: num(row.y)
        })),
        shopLinks: [...linksById.values()],
        shopItemTotal: Number(shopItemCountRows[0]?.total) || shopItems.length,
        questTotal: Number(rows[0].quest_count) || questPayload.length,
        rewardTotal: Number(rows[0].reward_count) || rewards.length,
        teacherTotal: Number(rows[0].teacher_count) || teachers.length,
        shopLinkTotal: Number(rows[0].shop_link_count) || linksById.size
    };
}

export async function getNpcMeta() {
    const rows = await query(
        `SELECT DISTINCT npc_type AS value
         FROM \`${NPCS}\`
         WHERE COALESCE(npc_type, '') <> ''
         ORDER BY npc_type`
    );
    return {
        types: rows.map((row) => row.value).filter(Boolean)
    };
}
