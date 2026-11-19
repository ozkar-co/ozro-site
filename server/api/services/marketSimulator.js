import fs from 'fs';
import { query } from '../../services/mariadb.js';

const CONFIG_URL = new URL('../config/marketSimulator.json', import.meta.url);
const config = JSON.parse(fs.readFileSync(CONFIG_URL, 'utf8'));

const MARKET_COLUMNS = `
    item_id, name, type, slots, refineable, price_status,
    low, mid, high, npc_buy, npc_sell,
    supply_open, supply_percentile, abundance_tier,
    difficulty_tier, demand_percentile, demand_tier,
    market_pressure, stock_hint, restock_weight, market_eligible
`;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value)));
}

export function liquidityFromRow(row, value) {
    const demand = row.demand_percentile == null ? 0.5 : Number(row.demand_percentile) / 100;
    const supply = row.supply_percentile == null ? 0.5 : Number(row.supply_percentile) / 100;
    const pressure = row.market_pressure == null ? 0 : Number(row.market_pressure) / 100;
    const cfg = config.liquidity;

    const base = clamp(
        0.10 + cfg.demandWeight * demand + cfg.pressureWeight * pressure - cfg.supplyWeight * supply,
        cfg.min,
        1
    );
    const priceDepth = 1 / (
        1 + Math.pow(Math.max(1, value) / cfg.priceDepthUnit, cfg.priceDepthExponent)
    );
    const typeDepth = config.typeDepth[row.type] ?? 0.70;
    return clamp(base * priceDepth * typeDepth, cfg.min, cfg.max);
}

export function saleFor(ask, fair, liquidity, dailyBase) {
    const cfg = config.sale;
    const ratio = fair > 0 ? fair / Math.max(1, ask) : 1;
    const priceFactor = clamp(Math.pow(ratio, cfg.priceElasticity), 0.05, 5);
    const dailyChance = clamp(
        dailyBase * priceFactor,
        cfg.minDailyChance,
        cfg.maxDailyChance
    );
    const medianDays = dailyChance >= 1
        ? 1
        : Math.min(cfg.maxMedianDays, Math.log(0.5) / Math.log(1 - dailyChance));
    const probability = (days) => 1 - Math.pow(1 - dailyChance, days);
    return {
        ask: Math.round(ask),
        dailyChance: Number(dailyChance.toFixed(6)),
        medianDays: Math.round(medianDays),
        probability: Object.fromEntries(config.horizons.map((days) => [String(days), Number(probability(days).toFixed(4))])),
        expected30: Math.round(ask * probability(30))
    };
}

async function fetchRows(itemIds) {
    const ids = [...new Set(itemIds.map(Number).filter((id) => Number.isFinite(id) && id > 0))];
    if (ids.length === 0) return new Map();
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
        `SELECT ${MARKET_COLUMNS} FROM \`ozro_market_item\` WHERE item_id IN (${placeholders})`,
        ids
    );
    return new Map(rows.map((row) => [Number(row.item_id), row]));
}

export async function simulateMarket({ itemId, refine = 0, cardIds = [], enchantTier = 'none', ask = null }) {
    const baseId = Number(itemId);
    if (!Number.isFinite(baseId) || baseId <= 0) {
        const error = new Error('itemId inválido');
        error.status = 400;
        throw error;
    }
    if (cardIds.length > 4) {
        const error = new Error('Máximo 4 cartas');
        error.status = 400;
        throw error;
    }

    const rows = await fetchRows([baseId, ...cardIds]);
    const base = rows.get(baseId);
    if (!base) {
        const error = new Error('Item no encontrado en el master de mercado');
        error.status = 404;
        throw error;
    }

    const cards = cardIds.map((id) => {
        const row = rows.get(Number(id));
        if (!row || String(row.type).toLowerCase() !== 'card') {
            const error = new Error(`Carta inválida: ${id}`);
            error.status = 400;
            throw error;
        }
        return row;
    });

    if (cards.length > Number(base.slots || 0)) {
        const error = new Error('La cantidad de cartas supera los slots del item');
        error.status = 400;
        throw error;
    }

    const tier = Object.prototype.hasOwnProperty.call(config.enchant.tiers, enchantTier)
        ? enchantTier
        : 'none';
    const refineable = Number(base.refineable) === 1;
    const safeRefine = refineable ? Math.round(clamp(refine, 0, config.refineFactors.length - 1)) : 0;
    const refineFactor = config.refineFactors[safeRefine];
    const baseValue = Number(base.mid) * refineFactor;
    const cardValue = cards.reduce((sum, card) => sum + Number(card.mid), 0) * config.cardDiscount;
    const subtotal = baseValue + cardValue;
    const enchantValue = subtotal * config.enchant.tiers[tier];
    const fair = subtotal + enchantValue;

    const instant = fair * config.price.instant;
    const patient = fair * config.price.patient;
    const requestedAsk = Number.isFinite(Number(ask)) && Number(ask) > 0 ? Number(ask) : fair;

    const baseLiquidity = liquidityFromRow(base, fair);
    const cardLiquidity = cards.map((card) => liquidityFromRow(card, Number(card.mid)));
    const cardDepth = cardLiquidity.length
        ? config.liquidity.cardDepthFloor + (1 - config.liquidity.cardDepthFloor) * Math.min(...cardLiquidity)
        : 1;
    const refineDepth = clamp(1 - safeRefine * config.liquidity.refinePenalty, 0.55, 1);
    const enchantDepth = config.enchant.depth[tier] ?? 1;
    const liquidity = clamp(
        baseLiquidity * cardDepth * refineDepth * enchantDepth,
        config.liquidity.min,
        config.liquidity.max
    );
    const dailyBase = 1 - Math.exp(-config.liquidity.baseDailyRate * liquidity);

    const sale = saleFor(requestedAsk, fair, liquidity, dailyBase);
    const fairSale = saleFor(fair, fair, liquidity, dailyBase);
    const curve = config.curveAsks.map((multiplier) => saleFor(fair * multiplier, fair, liquidity, dailyBase));

    return {
        schemaVersion: 1,
        item: {
            itemId: baseId,
            name: base.name,
            type: base.type,
            slots: Number(base.slots) || 0,
            refineable,
            priceStatus: base.price_status,
            mid: Number(base.mid),
            npcBuy: Number(base.npc_buy),
            npcSell: Number(base.npc_sell),
            demandTier: base.demand_tier,
            abundanceTier: base.abundance_tier,
            stockHint: base.stock_hint
        },
        cards: cards.map((card) => ({
            itemId: Number(card.item_id),
            name: card.name,
            mid: Number(card.mid),
            demandTier: card.demand_tier,
            abundanceTier: card.abundance_tier
        })),
        composition: {
            refine: safeRefine,
            refineFactor,
            baseValue: Math.round(baseValue),
            cardValue: Math.round(cardValue),
            enchantTier: tier,
            enchantValue: Math.round(enchantValue),
            fair: Math.round(fair)
        },
        prices: {
            instant: Math.round(instant),
            fair: Math.round(fair),
            patient: Math.round(patient)
        },
        liquidity: {
            score: Number(liquidity.toFixed(6)),
            base: Number(baseLiquidity.toFixed(6)),
            cardDepth: Number(cardDepth.toFixed(6)),
            refineDepth: Number(refineDepth.toFixed(6)),
            enchantDepth: Number(enchantDepth.toFixed(6)),
            dailyBase: Number(dailyBase.toFixed(6))
        },
        sale,
        fairSale,
        curve,
        assumptions: {
            note: 'Simulación, no oferta. La venta real requiere custodia y worker.',
            typeDepth: config.typeDepth[base.type] ?? 0.70,
            cardDiscount: config.cardDiscount,
            priceElasticity: config.sale.priceElasticity,
            horizons: config.horizons
        }
    };
}
