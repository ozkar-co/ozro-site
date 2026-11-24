import 'dotenv/config';
import { startAPI } from './api/server.js';
import { initializeMariaDB } from './services/mariadb.js';
import { initializeGameDb } from './api/services/gameDb.js';
import { initializeItemInfoIndex } from './api/services/itemInfo.js';
import { initializeSkillClientInfo } from './api/services/skillClientInfo.js';
import { initializeFarmingIndex } from './api/services/farmingIndex.js';
import { warmResponseCaches } from './api/services/warmup.js';
import { initializeNaturalDropIndex } from './api/services/naturalDropIndex.js';
import { initializeBackupTask } from './tasks/backup.js';

async function main() {
    await startAPI();

    try {
        await initializeMariaDB();
        await initializeGameDb();
        await initializeNaturalDropIndex();
        await Promise.all([
            initializeItemInfoIndex(),
            initializeSkillClientInfo()
        ]);
        try {
            await initializeFarmingIndex();
        } catch (error) {
            console.error('No se pudo construir el índice de farmeo:', error);
        }
        await warmResponseCaches();
        await initializeBackupTask();
        console.log('Base de datos y tareas iniciadas correctamente');
    } catch (error) {
        console.error('Error al iniciar base de datos o tareas; la web seguirá disponible:', error);
    }
}

main(); 