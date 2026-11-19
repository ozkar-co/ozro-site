import { query } from '../../services/mariadb.js';
import {
    effectiveMobsSql,
    isSpawnDataAvailable,
    mobDropColumns,
    spawnTableSql
} from './gameDb.js';

const CACHE_TABLE = 'ozro_cache_natural_drop';
let useTableCache = false;
let naturalDropAegisSubquery = null;

function buildDropUnionSql() {
    const cols = mobDropColumns();
    return cols.map((col) => `
        SELECT m.${col.item} AS name_aegis
        FROM ${spawnTableSql('s')}
        INNER JOIN ${effectiveMobsSql('m')} ON m.id = s.mob_id
        WHERE s.is_instance = 0
          AND COALESCE(m.${col.rate}, 0) > 0
          AND m.${col.item} IS NOT NULL
          AND m.${col.item} <> ''
    `).join(' UNION ');
}

export function isNaturalDropIndexReady() {
    return useTableCache || naturalDropAegisSubquery !== null;
}

/**
 * Precalcula objetos con drop en mapas del mundo (no instancia).
 * Preferimos tabla cache indexada; si no hay permisos CREATE, subquery materializada en SQL.
 */
export async function initializeNaturalDropIndex() {
    useTableCache = false;
    naturalDropAegisSubquery = null;

    if (!isSpawnDataAvailable()) {
        return;
    }

    const unionSql = buildDropUnionSql();
    const distinctSql = `SELECT DISTINCT name_aegis FROM (${unionSql}) AS src WHERE name_aegis IS NOT NULL AND name_aegis <> ''`;

    try {
        await query(`
            CREATE TABLE IF NOT EXISTS ${CACHE_TABLE} (
                name_aegis VARCHAR(100) NOT NULL,
                PRIMARY KEY (name_aegis)
            ) ENGINE=InnoDB
        `);
        await query(`TRUNCATE TABLE ${CACHE_TABLE}`);
        await query(`
            INSERT INTO ${CACHE_TABLE} (name_aegis)
            ${distinctSql}
        `);
        const countRows = await query(`SELECT COUNT(*) AS cnt FROM ${CACHE_TABLE}`);
        console.log(`Índice drop natural listo: ${countRows[0].cnt} objetos (tabla ${CACHE_TABLE})`);
        useTableCache = true;
        return;
    } catch (error) {
        console.warn(
            `Tabla ${CACHE_TABLE} no disponible (${error.message}); usando subquery sin correlacionar.`
        );
    }

    naturalDropAegisSubquery = distinctSql;
    try {
        const countRows = await query(`SELECT COUNT(*) AS cnt FROM (${naturalDropAegisSubquery}) AS counted`);
        console.log(`Índice drop natural listo: ${countRows[0].cnt} objetos (subquery)`);
    } catch (error) {
        console.error('No se pudo construir índice de drop natural:', error);
        naturalDropAegisSubquery = null;
    }
}

export function naturalDropFilterClause(itemAlias, hasDrop) {
    if (useTableCache) {
        const exists = `EXISTS (
            SELECT 1 FROM ${CACHE_TABLE} nd
            WHERE nd.name_aegis = ${itemAlias}.name_aegis
        )`;
        return hasDrop ? exists : `NOT ${exists}`;
    }

    if (naturalDropAegisSubquery) {
        const membership = `${itemAlias}.name_aegis IN (${naturalDropAegisSubquery})`;
        return hasDrop ? membership : `${itemAlias}.name_aegis NOT IN (${naturalDropAegisSubquery})`;
    }

    return null;
}