import { Router } from 'express';
import { getMarketItemRaw, simulateMarket } from '../services/marketSimulator.js';

const router = Router();

router.get('/item/:id', async (req, res) => {
    try {
        const itemId = Number.parseInt(req.params.id, 10);
        res.json(await getMarketItemRaw(itemId));
    } catch (error) {
        const status = error.status || 500;
        if (status >= 500) console.error('Error al leer item del master:', error);
        res.status(status).json({ error: error.message || 'Error al leer item del master' });
    }
});

router.get('/simulate', async (req, res) => {
    try {
        const itemId = Number.parseInt(req.query.itemId, 10);
        const refine = Number.parseInt(req.query.refine, 10) || 0;
        const enchantTier = typeof req.query.enchant === 'string' ? req.query.enchant : 'none';
        const ask = req.query.ask == null || req.query.ask === '' ? null : Number(req.query.ask);
        const randomValue = req.query.randomValue == null || req.query.randomValue === '' ? 0 : Number(req.query.randomValue);
        const cardIds = typeof req.query.cards === 'string' && req.query.cards.trim()
            ? req.query.cards.split(',').map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value))
            : [];

        const result = await simulateMarket({ itemId, refine, cardIds, enchantTier, randomValue, ask });
        res.json(result);
    } catch (error) {
        const status = error.status || 500;
        if (status >= 500) {
            console.error('Error al simular tasación:', error);
        }
        res.status(status).json({
            error: error.message || 'Error al simular tasación',
            hint: status === 500 ? 'Verifica que ozro_market_item esté importada' : undefined
        });
    }
});

export default router;
