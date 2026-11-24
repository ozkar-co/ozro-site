import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../../services/mariadb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../../../assets');
const GARRETT_PATH = path.join(ASSETS_DIR, 'items/garrett.json');

let marketById = new Map();

function numberOrNull(value) {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function loadGarrettPrices() {
    const prices = new Map();
    try {
        const data = JSON.parse(fs.readFileSync(GARRETT_PATH, 'utf8'));
        for (const offer of data.offers || []) {
            const itemId = Number(offer.itemId);
            const value = numberOrNull(offer.price);
            if (Number.isFinite(itemId) && value !== null && value > 0) {
                prices.set(itemId, Math.max(prices.get(itemId) || 0, value));
            }
        }
        for (const mission of data.missions || []) {
            const itemId = Number(mission.itemId);
            const value = numberOrNull(mission.unitPrice);
            if (Number.isFinite(itemId) && value !== null && value > 0) {
                prices.set(itemId, Math.max(prices.get(itemId) || 0, value));
            }
        }
    } catch (error) {
        console.warn(`No se pudo leer ${GARRETT_PATH}: ${error.message}`);
    }
    return prices;
}

const garrettById = loadGarrettPrices();

/**
 * Carga la proyección del master de mercado. Si la tabla no existe, el sitio
 * sigue funcionando con Garrett y el valor NPC de item_db.
 */
export async function initializeItemValues() {
    try {
        const rows = await query(
            'SELECT item_id, npc_buy, mid, npc_sell FROM `ozro_market_item`'
        );
        marketById = new Map(
            rows.map((row) => [
                Number(row.item_id),
                {
                    npcBuy: numberOrNull(row.npc_buy),
                    mid: numberOrNull(row.mid),
                    npcSell: numberOrNull(row.npc_sell)
                }
            ])
        );
        console.log(`Valores de mercado cargados: ${marketById.size} items`);
    } catch (error) {
        marketById = new Map();
        console.warn(`No se pudo cargar ozro_market_item: ${error.message}`);
    }
}

export function npcValue(item) {
    if (!item || Number(item.trade_nosell) === 1) return 0;

    // Prefer Master World effective sell (already resolved in ozro_items).
    const effectiveSell = numberOrNull(item.sell_effective ?? item.price_sell);
    if (effectiveSell !== null && effectiveSell > 0) return effectiveSell;

    let buy = numberOrNull(item.buy_effective ?? item.price_buy);
    let sell = numberOrNull(item.sell_base ?? item.price_sell);

    if (buy === null && sell !== null) buy = sell * 2;
    if (sell === null && buy !== null) sell = Math.floor(buy / 2);

    if (buy === null) buy = 0;
    if (sell === null) sell = 0;

    if (buy / 124 < sell / 75) sell = 1;
    return sell > 0 ? sell : 0;
}

export function garrettValue(item) {
    if (!item) return null;
    return garrettById.get(Number(item.id)) ?? null;
}

export function marketValue(item) {
    if (!item) return null;
    const entry = marketById.get(Number(item.id));
    return entry?.npcBuy && entry.npcBuy > 0 ? entry.npcBuy : null;
}

export function marketMidValue(item) {
    if (!item) return null;
    const entry = marketById.get(Number(item.id));
    return entry?.mid && entry.mid > 0 ? entry.mid : null;
}

export function tasadorValue(item) {
    return null;
}

/**
 * Prioridad de venta:
 *   1. Garrett si el item está en su mesa (oferta o misión).
 *   2. Precio de compra NPC del master de mercado.
 *   3. Precio NPC de item_db como fallback.
 */
export function bestItemValue(item) {
    const garrett = garrettValue(item);
    if (garrett !== null && garrett > 0) {
        return { value: garrett, source: 'garrett' };
    }

    const market = marketValue(item);
    if (market !== null && market > 0) {
        return { value: market, source: 'market' };
    }

    const npc = npcValue(item);
    if (npc > 0) {
        return { value: npc, source: 'npc' };
    }

    return { value: 0, source: null };
}
