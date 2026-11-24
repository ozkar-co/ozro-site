import { Router } from 'express';
import { getItemById, getItemMeta, searchItems } from '../services/itemQuery.js';
import { getItemDescription, isItemInfoAvailable } from '../services/itemInfo.js';
import { getBoxGroup } from '../services/acquisitionQuery.js';
import { responseCache } from '../services/responseCache.js';
import {
    isItemDataAvailable,
    isMobDataAvailable,
    itemUnavailableError,
    mobUnavailableError,
    parseBool
} from '../services/gameDb.js';

const router = Router();

router.use((req, res, next) => {
    if (!isItemDataAvailable()) {
        return res.status(503).json(itemUnavailableError());
    }

    const hasDrop = parseBool(req.query.hasDrop);
    if (hasDrop !== null && !isMobDataAvailable()) {
        return res.status(503).json({
            ...mobUnavailableError(),
            detail: 'El filtro hasDrop requiere tablas ozro_mobs / ozro_mob_drops'
        });
    }

    next();
});

router.use(responseCache('items', 30 * 60 * 1000));

router.get('/meta', async (req, res) => {
    try {
        const meta = await getItemMeta();
        res.json(meta);
    } catch (error) {
        console.error('Error al obtener meta de objetos:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Error al obtener meta de objetos'
        });
    }
});

router.get('/box-groups/:groupName', async (req, res) => {
    try {
        const group = await getBoxGroup(decodeURIComponent(req.params.groupName));
        res.json(group);
    } catch (error) {
        console.error('Error al obtener grupo de caja:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Error al obtener grupo de caja'
        });
    }
});

router.get('/:id/description', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'ID de objeto inválido' });
        }
        if (!isItemInfoAvailable()) {
            return res.status(503).json({
                error: 'Descripciones no disponibles',
                hint: 'Coloca client_item_descriptions.jsonl en data/ (ozro-cli build_client_descriptions) y reinicia el sitio'
            });
        }

        const description = await getItemDescription(id);
        if (!description) {
            return res.status(503).json({ error: 'Descripciones no disponibles' });
        }

        res.json({ id, ...description });
    } catch (error) {
        console.error('Error al obtener descripción del objeto:', error);
        res.status(500).json({ error: 'Error al obtener descripción del objeto' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'ID de objeto inválido' });
        }

        const item = await getItemById(id);
        if (!item) {
            return res.status(404).json({ error: 'Objeto no encontrado' });
        }

        res.json(item);
    } catch (error) {
        console.error('Error al obtener objeto:', error);
        res.status(500).json({ error: 'Error al obtener objeto' });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await searchItems(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error al buscar objetos:', error);
        res.status(500).json({ error: 'Error al buscar objetos' });
    }
});

export default router;
