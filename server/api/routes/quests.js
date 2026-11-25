import { Router } from 'express';
import { getQuestById, getQuestMeta, searchQuests } from '../services/questQuery.js';
import { isWorldDataAvailable, worldUnavailableError } from '../services/gameDb.js';
import { responseCache } from '../services/responseCache.js';

const router = Router();

router.use((req, res, next) => {
    if (!isWorldDataAvailable()) {
        return res.status(503).json(worldUnavailableError());
    }
    next();
});

router.use(responseCache('quests', 30 * 60 * 1000));

router.get('/meta', async (req, res) => {
    try {
        res.json(await getQuestMeta());
    } catch (error) {
        console.error('Error al obtener meta de quests:', error);
        res.status(500).json({ error: 'Error al obtener meta de quests' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'ID de quest inválido' });
        }
        const quest = await getQuestById(id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest no encontrada' });
        }
        res.json(quest);
    } catch (error) {
        console.error('Error al obtener quest:', error);
        res.status(500).json({ error: 'Error al obtener quest' });
    }
});

router.get('/', async (req, res) => {
    try {
        res.json(await searchQuests(req.query));
    } catch (error) {
        console.error('Error al buscar quests:', error);
        res.status(500).json({ error: 'Error al buscar quests' });
    }
});

export default router;
