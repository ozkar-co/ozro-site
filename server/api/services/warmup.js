import { isItemDataAvailable, isMobDataAvailable } from './gameDb.js';
import { searchItems } from './itemQuery.js';
import { searchMobs } from './mobQuery.js';
import { primeResponseCache } from './responseCache.js';

const WARM_TTL = 24 * 60 * 60 * 1000;

export async function warmResponseCaches() {
    const tasks = [];

    if (isItemDataAvailable()) {
        tasks.push(
            searchItems({ page: 1, limit: 10 })
                .then((body) => primeResponseCache(
                    'items',
                    '/api/items?page=1&limit=10',
                    body,
                    WARM_TTL
                ))
                .catch((error) => console.error('No se pudo precalentar la caché de objetos:', error))
        );
    }

    if (isMobDataAvailable()) {
        tasks.push(
            searchMobs({ page: 1, limit: 10, hasSpawn: 'true' })
                .then((body) => primeResponseCache(
                    'mobs',
                    '/api/mobs?page=1&limit=10&hasSpawn=true',
                    body,
                    WARM_TTL
                ))
                .catch((error) => console.error('No se pudo precalentar la caché de monstruos:', error))
        );
    }

    await Promise.allSettled(tasks);
}
