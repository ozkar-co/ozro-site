import { Router } from 'express';
import { getSkillById, searchSkills } from '../services/skillQuery.js';
import { isMobDataAvailable, mobUnavailableError } from '../services/gameDb.js';
import { responseCache } from '../services/responseCache.js';

const router = Router();

router.use((req, res, next) => {
    if (!isMobDataAvailable()) {
        return res.status(503).json(mobUnavailableError());
    }
    next();
});

router.use(responseCache('skills', 30 * 60 * 1000));

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'ID de skill inválido' });
        }
        const skill = await getSkillById(id);
        if (!skill) {
            return res.status(404).json({ error: 'Skill no encontrada' });
        }
        res.json(skill);
    } catch (error) {
        console.error('Error al obtener skill:', error);
        res.status(500).json({ error: 'Error al obtener skill' });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await searchSkills(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error al buscar skills:', error);
        res.status(500).json({ error: 'Error al buscar skills' });
    }
});

export default router;
