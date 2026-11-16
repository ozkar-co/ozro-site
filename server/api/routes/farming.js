import { Router } from 'express';
import { responseCache } from '../services/responseCache.js';
import {
    getFarmingMapByName,
    getFarmingMaps,
    getFarmingMobById,
    getFarmingMobs,
    isFarmingReady
} from '../services/farmingIndex.js';

const router = Router();

router.use((req, res, next) => {
    if (!isFarmingReady()) {
        return res.status(503).json({
            error: 'Datos de farmeo no disponibles',
            hint: 'El índice se construye al iniciar el sitio; intenta de nuevo en unos segundos'
        });
    }
    next();
});

router.use(responseCache('farming', 30 * 60 * 1000));

router.get('/mobs', (req, res) => {
    try {
        res.json(getFarmingMobs(req.query));
    } catch (error) {
        console.error('Error al calcular farmeo de mobs:', error);
        res.status(500).json({ error: 'Error al calcular farmeo de mobs' });
    }
});

router.get('/mobs/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'ID de monstruo inválido' });
        }
        const mob = getFarmingMobById(id, req.query);
        if (!mob) {
            return res.status(404).json({ error: 'Monstruo no encontrado o sin valor de farmeo' });
        }
        res.json(mob);
    } catch (error) {
        console.error('Error al calcular farmeo del monstruo:', error);
        res.status(500).json({ error: 'Error al calcular farmeo del monstruo' });
    }
});

router.get('/maps', (req, res) => {
    try {
        res.json(getFarmingMaps(req.query));
    } catch (error) {
        console.error('Error al calcular farmeo de mapas:', error);
        res.status(500).json({ error: 'Error al calcular farmeo de mapas' });
    }
});

router.get('/maps/:map', (req, res) => {
    try {
        const map = getFarmingMapByName(req.params.map, req.query);
        if (!map) {
            return res.status(404).json({ error: 'Mapa sin datos de farmeo' });
        }
        res.json(map);
    } catch (error) {
        console.error('Error al calcular farmeo del mapa:', error);
        res.status(500).json({ error: 'Error al calcular farmeo del mapa' });
    }
});

export default router;
