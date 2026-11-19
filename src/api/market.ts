import { API_BASE_URL } from './client';

export interface ItemSearchResult {
  id: number;
  name: string;
  nameAegis: string;
  type: string;
  slots: number;
  refineable: boolean;
  priceBuy: number;
  priceSell: number;
}

export interface ItemSearchResponse {
  total: number;
  page: number;
  limit: number;
  results: ItemSearchResult[];
}

export interface SaleEstimate {
  ask: number;
  dailyChance: number;
  medianDays: number;
  probability: Record<string, number>;
  expected30: number;
}

export interface MarketSimulation {
  schemaVersion: number;
  item: {
    itemId: number;
    name: string;
    type: string;
    slots: number;
    refineable: boolean;
    priceStatus: string;
    mid: number;
    npcBuy: number;
    npcSell: number;
    demandTier: string;
    abundanceTier: string;
    stockHint: string;
  };
  cards: {
    itemId: number;
    name: string;
    mid: number;
    demandTier: string;
    abundanceTier: string;
  }[];
  composition: {
    refine: number;
    refineFactor: number;
    baseValue: number;
    cardValue: number;
    randomValue: number;
    enchantTier: string;
    enchantValue: number;
    fair: number;
  };
  prices: {
    instant: number;
    fair: number;
    patient: number;
  };
  liquidity: {
    score: number;
    base: number;
    cardDepth: number;
    refineDepth: number;
    enchantDepth: number;
    dailyBase: number;
  };
  sale: SaleEstimate;
  fairSale: SaleEstimate;
  curve: SaleEstimate[];
  assumptions: {
    note: string;
    typeDepth: number;
    cardDiscount: number;
    priceElasticity: number;
    horizons: number[];
  };
}

export interface MarketRawItem {
  item: Record<string, unknown>;
  tags: string[];
}

export interface SimulateMarketParams {
  itemId: number;
  refine?: number;
  cards?: number[];
  enchant?: string;
  randomValue?: number;
  ask?: number | null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.hint || `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function searchItems(params: {
  q?: string;
  type?: string;
  limit?: number;
  page?: number;
} = {}): Promise<ItemSearchResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.type) search.set('type', params.type);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.page) search.set('page', String(params.page));
  const query = search.toString();
  return fetchJson<ItemSearchResponse>(`/items${query ? `?${query}` : ''}`);
}

export function fetchMarketItemRaw(itemId: number): Promise<MarketRawItem> {
  return fetchJson<MarketRawItem>(`/market/item/${encodeURIComponent(String(itemId))}`);
}

export function simulateMarket(params: SimulateMarketParams): Promise<MarketSimulation> {
  const search = new URLSearchParams();
  search.set('itemId', String(params.itemId));
  if (params.refine) search.set('refine', String(params.refine));
  if (params.cards?.length) search.set('cards', params.cards.join(','));
  if (params.enchant && params.enchant !== 'none') search.set('enchant', params.enchant);
  if (params.randomValue) search.set('randomValue', String(params.randomValue));
  if (params.ask) search.set('ask', String(params.ask));
  return fetchJson<MarketSimulation>(`/market/simulate?${search.toString()}`);
}
