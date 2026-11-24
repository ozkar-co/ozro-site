import { Router } from 'express';
import { getMapById, getMapMeta, searchMaps } from '../services/mapQuery.js';
import { isMobDataAvailable, mobUnavailableError } from '../services/gameDb.js';
import { responseCache } from '../services/responseCache.js';

const router = Router();

router.use((req, res, next) => {
    if (!isMobDataAvailable()) {
        return res.status(503).json(mobUnavailableError());
    }
    next();
});

router.use(responseCache('maps', 30 * 60 * 1000));

router.get('/meta', async (req, res) => {
    try {
        res.json(await getMapMeta());
    } catch (error) {
        console.error('Error al obtener meta de mapas:', error);
        res.status(500).json({ error: 'Error al obtener meta de mapas' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const map = await getMapById(req.params.id);
        if (!map) {
            return res.status(404).json({ error: 'Mapa no encontrado' });
        }
        res.json(map);
    } catch (error) {
        console.error('Error al obtener mapa:', error);
        res.status(500).json({ error: 'Error al obtener mapa' });
    }
});

router.get('/', async (req, res) => {
    try {
        res.json(await searchMaps(req.query));
    } catch (error) {
        console.error('Error al buscar mapas:', error);
        res.status(500).json({ error: 'Error al buscar mapas' });
    }
});

export default router;
