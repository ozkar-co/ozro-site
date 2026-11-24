/**
 * Items dropped by world (non-instance) spawns — from ozro_spawns + ozro_mob_drops.
 */
import { query } from '../../services/mariadb.js';
import { T, isSpawnDataAvailable, isWorldSpawnSql } from './gameDb.js';

const CACHE_TABLE = 'ozro_cache_natural_drop';
let useTableCache = false;
let naturalDropItemIdSubquery = null;

function buildDistinctItemSql() {
    return `
        SELECT DISTINCT d.item_id
        FROM \`${T.MOB_DROPS}\` d
        INNER JOIN \`${T.SPAWNS}\` s ON s.mob_id = d.mob_id
        WHERE d.is_map_bonus = 0
          AND ${isWorldSpawnSql('s')}
    `;
}

export function isNaturalDropIndexReady() {
    return useTableCache || naturalDropItemIdSubquery !== null;
}

export async function initializeNaturalDropIndex() {
    useTableCache = false;
    naturalDropItemIdSubquery = null;

    if (!isSpawnDataAvailable()) {
        return;
    }

    const distinctSql = buildDistinctItemSql();

    try {
        await query(`
            CREATE TABLE IF NOT EXISTS ${CACHE_TABLE} (
                item_id INT NOT NULL,
                PRIMARY KEY (item_id)
            ) ENGINE=InnoDB
        `);
        // Migrate old aegis-based cache if present
        try {
            await query(`ALTER TABLE ${CACHE_TABLE} DROP COLUMN name_aegis`);
        } catch {
            /* ignore */
        }
        await query(`TRUNCATE TABLE ${CACHE_TABLE}`);
        await query(`
            INSERT INTO ${CACHE_TABLE} (item_id)
            ${distinctSql}
        `);
        const countRows = await query(`SELECT COUNT(*) AS cnt FROM ${CACHE_TABLE}`);
        console.log(`Índice drop natural listo: ${countRows[0].cnt} objetos (tabla ${CACHE_TABLE})`);
        useTableCache = true;
        return;
    } catch (error) {
        console.warn(
            `Tabla ${CACHE_TABLE} no disponible (${error.message}); usando subquery.`
        );
    }

    naturalDropItemIdSubquery = distinctSql;
    try {
        const countRows = await query(
            `SELECT COUNT(*) AS cnt FROM (${naturalDropItemIdSubquery}) AS counted`
        );
        console.log(`Índice drop natural listo: ${countRows[0].cnt} objetos (subquery)`);
    } catch (error) {
        console.error('No se pudo construir índice de drop natural:', error);
        naturalDropItemIdSubquery = null;
    }
}

export function naturalDropFilterClause(itemAlias, hasDrop) {
    if (useTableCache) {
        const exists = `EXISTS (
            SELECT 1 FROM ${CACHE_TABLE} nd
            WHERE nd.item_id = ${itemAlias}.item_id
        )`;
        return hasDrop ? exists : `NOT ${exists}`;
    }

    if (naturalDropItemIdSubquery) {
        const membership = `${itemAlias}.item_id IN (${naturalDropItemIdSubquery})`;
        return hasDrop ? membership : `${itemAlias}.item_id NOT IN (${naturalDropItemIdSubquery})`;
    }

    return null;
}
