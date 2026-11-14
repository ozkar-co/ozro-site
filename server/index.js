import 'dotenv/config';
import { startAPI } from './api/server.js';
import { initializeMariaDB } from './services/mariadb.js';
import { initializeGameDb } from './api/services/gameDb.js';
import { initializeBackupTask } from './tasks/backup.js';

async function main() {
    await startAPI();

    try {
        await initializeMariaDB();
        await initializeGameDb();
        await initializeBackupTask();
        console.log('Base de datos y tareas iniciadas correctamente');
    } catch (error) {
        console.error('Error al iniciar base de datos o tareas; la web seguirá disponible:', error);
    }
}

main(); 