import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { query } from '../services/mariadb.js';

async function getAllTables() {
    try {
        const result = await query('SHOW TABLES');
        return result.map(row => Object.values(row)[0]);
    } catch (error) {
        console.error('Error al obtener lista de tablas:', error);
        return [];
    }
}

function getBackupFolderName(isFull = false) {
    const now = new Date();
    const folderName = now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') + "_" +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0') +
           now.getSeconds().toString().padStart(2, '0');
    
    return isFull ? `${folderName}_full` : folderName;
}

function processBigIntValues(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(processBigIntValues);
    }

    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = processBigIntValues(value);
        }
        return result;
    }

    return obj;
}

async function getCreateTableSQL(tableName) {
    const result = await query(`SHOW CREATE TABLE \`${tableName}\``);
    const row = result[0];
    if (!row) {
        throw new Error(`No se pudo obtener la estructura de ${tableName}`);
    }
    const viewSQL = row['Create View'];
    if (viewSQL) {
        return { isView: true, sql: viewSQL };
    }
    return { isView: false, sql: row['Create Table'] };
}

function generateSchemaSQL(tableName, { isView, sql }) {
    const drop = isView ? `DROP VIEW IF EXISTS \`${tableName}\`;` : `DROP TABLE IF EXISTS \`${tableName}\`;`;
    return `${drop}\n${sql};\n`;
}

function generateSQLInsert(tableName, rows) {
    if (rows.length === 0) return '';
    
    // Obtener los nombres de las columnas del primer registro
    const columns = Object.keys(rows[0]);
    
    // Generar la parte INSERT INTO de la consulta
    let sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES\n`;
    
    // Generar los valores para cada fila
    const values = rows.map(row => {
        const rowValues = columns.map(column => {
            const value = row[column];
            if (value === null) return 'NULL';
            if (typeof value === 'bigint') return value.toString();
            if (typeof value === 'number') return value;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${value.toString().replace(/'/g, "''")}'`;
        });
        return `(${rowValues.join(', ')})`;
    });
    
    // Unir todo y añadir punto y coma al final
    return sql + values.join(',\n') + ';\n';
}

async function performBackup(isFull = false) {
    try {
        const timestamp = getBackupFolderName(isFull);
        const backupDir = path.join('./backups', timestamp);
        
        // Crear directorios para JSON, SQL y estructura
        const jsonDir = path.join(backupDir, 'json');
        const sqlDir = path.join(backupDir, 'sql');
        const schemaDir = path.join(backupDir, 'schema');
        await fs.mkdir(jsonDir, { recursive: true });
        await fs.mkdir(sqlDir, { recursive: true });
        await fs.mkdir(schemaDir, { recursive: true });
        
        // Los backups incluyen todas las tablas de la base de datos, sin listas manuales.
        const tables = await getAllTables();
        if (tables.length === 0) {
            throw new Error('No se encontraron tablas para respaldar; se cancela el backup');
        }
        let backupCount = 0;
        
        // Archivo SQL combinado autocontenido (estructura + datos)
        const database = process.env.MARIADB_DATABASE || '';
        const combinedParts = [
            '-- Backup generado por ozro-site',
            `-- Fecha: ${new Date().toISOString()}`,
            `-- Base de datos: ${database}`,
            '-- Restaurar con: mysql -u USER -p < full_backup.sql',
            '',
            'SET NAMES utf8mb4;',
            'SET FOREIGN_KEY_CHECKS = 0;',
            ''
        ];
        if (database) {
            combinedParts.push(
                `CREATE DATABASE IF NOT EXISTS \`${database}\`;`,
                `USE \`${database}\`;`,
                ''
            );
        }
        let schemaCount = 0;
        
        for (const table of tables) {
            try {
                // Obtener estructura de la tabla
                const structure = await getCreateTableSQL(table);
                const schemaSQL = generateSchemaSQL(table, structure);
                
                // Guardar estructura individual
                const schemaPath = path.join(schemaDir, `${table}.sql`);
                await fs.writeFile(schemaPath, schemaSQL);
                
                // Añadir estructura al SQL combinado antes de los datos
                combinedParts.push(`-- Estructura: ${table}`, schemaSQL, '');
                schemaCount++;
                
                // Obtener datos de la tabla
                const rows = await query(`SELECT * FROM \`${table}\``);
                
                // Procesar BigInt antes de guardar JSON
                const processedRows = processBigIntValues(rows);
                
                // Guardar JSON
                const jsonPath = path.join(jsonDir, `${table}.json`);
                await fs.writeFile(jsonPath, JSON.stringify(processedRows, null, 2));
                
                // Generar y guardar SQL individual (estructura + datos)
                const sqlInsert = structure.isView ? '' : generateSQLInsert(table, rows);
                const sqlPath = path.join(sqlDir, `${table}.sql`);
                await fs.writeFile(sqlPath, schemaSQL + sqlInsert);
                
                // Añadir datos al SQL combinado
                combinedParts.push(`-- Datos: ${table}`, sqlInsert, '');
                
                console.log(`Backup completado para ${table} (estructura, JSON y SQL)`);
                backupCount++;
            } catch (error) {
                console.error(`Error al realizar backup de ${table}:`, error);
                if (error.code === 'ER_CRASHED_ON_USAGE') {
                    console.error(`  → Reparar: mysql -u USER -p -e "REPAIR TABLE \\\`${table}\\\`;" rathena`);
                }
                if (error instanceof TypeError && error.message.includes('BigInt')) {
                    console.error('Error de BigInt detectado, asegúrate de que los datos estén siendo procesados correctamente');
                }
            }
        }
        
        // Guardar SQL combinado autocontenido
        if (schemaCount > 0) {
            combinedParts.push('SET FOREIGN_KEY_CHECKS = 1;', '');
            const combinedSQLPath = path.join(backupDir, 'full_backup.sql');
            await fs.writeFile(combinedSQLPath, combinedParts.join('\n'));
        }
        
        // Metadatos del backup para saber qué contiene
        const metadata = {
            createdAt: new Date().toISOString(),
            type: isFull ? 'full' : 'daily',
            scope: 'all_tables',
            database: process.env.MARIADB_DATABASE,
            tables: schemaCount,
            tableNames: tables
        };
        await fs.writeFile(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
        
        const backupType = isFull ? 'completo' : 'diario';
        console.log(`Backup ${backupType} completado en ${backupDir} (${backupCount}/${tables.length} tablas)`);
        return backupCount;
    } catch (error) {
        console.error('Error al realizar backup:', error);
        return 0;
    }
}

export async function initializeBackupTask() {
    // Realizar backup completo inicial
    console.log('Iniciando backup completo inicial...');
    const tablesBackedUp = await performBackup(true);
    
    if (tablesBackedUp > 0) {
        console.log('Backup inicial completado exitosamente');
    } else {
        console.warn('No se pudo realizar el backup inicial');
    }
    
    // Programar backup diario (3 AM)
    cron.schedule('0 3 * * *', async () => {
        console.log('Iniciando proceso de backup diario...');
        await performBackup(false);
    });
    
    // Programar backup completo semanal (Domingo 4 AM)
    cron.schedule('0 4 * * 0', async () => {
        console.log('Iniciando proceso de backup completo semanal...');
        await performBackup(true);
    });
    
    console.log('Tareas de backup programadas: diario (3 AM) y completo (Domingo 4 AM)');
} 