/**
 * NPC queries against ozro_npcs (+ shops / functions).
 */
import { query } from '../../services/mariadb.js';
import { T, OZRO_PREFIX, parsePagination, parseJsonColumn } from './gameDb.js';
import { buildTokenMatchClause } from './textSearch.js';

const NPCS = `${OZRO_PREFIX}npcs`;
const NPC_FUNCTIONS = `${OZRO_PREFIX}npc_functions`;
const NPC_SHOPS = `${OZRO_PREFIX}npc_shops`;

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
        functionCount: Number(row.function_count) || 0
    };
}

export async function searchNpcs(params) {
    const { page, limit, offset } = parsePagination(params);
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    const type = typeof params.type === 'string' ? params.type.trim() : '';
    const conditions = [];
    const values = [];

    if (type) {
        conditions.push('n.npc_type = ?');
        values.push(type);
    }

    if (q) {
        if (/^npc_[0-9a-f]+$/i.test(q)) {
            conditions.push('n.npc_id = ?');
            values.push(q);
        } else {
            const match = buildTokenMatchClause(
                'n',
                ['n.name', 'n.display_name', 'n.map_id', 'n.npc_id'],
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
                    (SELECT COUNT(*) FROM \`${NPC_SHOPS}\` s WHERE s.npc_id = n.npc_id) AS shop_count,
                    (SELECT COUNT(*) FROM \`${NPC_FUNCTIONS}\` f WHERE f.npc_id = n.npc_id) AS function_count
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
                (SELECT COUNT(*) FROM \`${NPC_SHOPS}\` s WHERE s.npc_id = n.npc_id) AS shop_count,
                (SELECT COUNT(*) FROM \`${NPC_FUNCTIONS}\` f WHERE f.npc_id = n.npc_id) AS function_count
         FROM \`${NPCS}\` n
         WHERE n.npc_id = ?
         LIMIT 1`,
        [id]
    );
    if (rows.length === 0) return null;

    const base = mapNpcSummary(rows[0]);
    const [shops, functions] = await Promise.all([
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
             WHERE npc_id = ?
             ORDER BY function_name ASC
             LIMIT 40`,
            [id]
        )
    ]);

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
            sprite: shop.sprite || null
        })),
        functions: functions.map((row) => row.function_name).filter(Boolean)
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
