/**
 * Invocaciones de jefes y MVPs generadas desde rAthena
 * (`db/re/mob_skill_db.txt` + `db/import/mob_skill_db.txt`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUMMONS_PATH = path.resolve(__dirname, '../../../assets/mobs/summons.json');

let loaded = false;
let summons = new Map();

function loadSummons() {
    if (loaded) return;
    loaded = true;
    try {
        const payload = JSON.parse(fs.readFileSync(SUMMONS_PATH, 'utf8'));
        summons = new Map(
            Object.entries(payload.summons || {}).map(([mobId, entry]) => [
                Number(mobId),
                entry.list || []
            ])
        );
    } catch (error) {
        console.warn(`No se pudieron cargar las invocaciones (${error.message})`);
        summons = new Map();
    }
}

export function getMobSummons(mobId) {
    loadSummons();
    return summons.get(Number(mobId)) || [];
}
