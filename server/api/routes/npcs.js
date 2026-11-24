import { Router } from 'express';
import { getNpcById, getNpcMeta, searchNpcs } from '../services/npcQuery.js';
import { responseCache } from '../services/responseCache.js';

const router = Router();

router.use(responseCache('npcs', 30 * 60 * 1000));

router.get('/meta', async (req, res) => {
    try {
        res.json(await getNpcMeta());
    } catch (error) {
        console.error('Error al obtener meta de NPCs:', error);
        res.status(500).json({ error: 'Error al obtener meta de NPCs' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const npc = await getNpcById(req.params.id);
        if (!npc) {
            return res.status(404).json({ error: 'NPC no encontrado' });
        }
        res.json(npc);
    } catch (error) {
        console.error('Error al obtener NPC:', error);
        res.status(500).json({ error: 'Error al obtener NPC' });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await searchNpcs(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error al buscar NPCs:', error);
        res.status(500).json({ error: 'Error al buscar NPCs' });
    }
});

export default router;
