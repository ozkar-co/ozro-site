import { Router } from 'express';
import { getMvpRadar } from '../services/mvpQuery.js';
import {
    isMobDataAvailable,
    isSpawnDataAvailable,
    mobUnavailableError,
    spawnUnavailableError
} from '../services/gameDb.js';

const router = Router();

router.use((req, res, next) => {
    if (!isMobDataAvailable()) {
        return res.status(503).json(mobUnavailableError());
    }
    if (!isSpawnDataAvailable()) {
        return res.status(503).json(spawnUnavailableError());
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        res.json(await getMvpRadar());
    } catch (error) {
        console.error('Error al obtener el radar de MVPs:', error);
        if (error.message === 'SPAWN_TABLE_NOT_CONFIGURED') {
            return res.status(503).json(spawnUnavailableError());
        }
        res.status(500).json({ error: 'Error al obtener el radar de MVPs' });
    }
});

export default router;
