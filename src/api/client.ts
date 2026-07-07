export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ozro-api.ozkr.net';

export interface HealthResponse {
  status: string;
}

export interface PlayersResponse {
  online: number;
}

export interface UptimeResponse {
  uptime: {
    seconds: number;
    milliseconds: number;
    formatted: string;
  };
}

export interface StatusResponse {
  timestamp: string;
  services: {
    login: { status: string };
    char: { status: string };
    map: { status: string };
  };
}

export interface StatsResponse {
  timestamp: string;
  accounts: {
    total: number;
    activeLastWeek: number;
  };
  characters: {
    total: number;
    activeLast24h: number;
    highestLevel: number;
    averageLevel: number;
    maxLevelCount: number;
  };
  guilds: {
    total: number;
  };
  economy: {
    totalZeny: string;
    bankZeny: string;
    averageZenyPerChar: number;
    averageZenyPerAccount: number;
  };
}

export interface RankingsAccountResponse {
  timestamp: string;
  rankings: {
    account_id: number;
    userid: string;
    logincount: number;
    total_zeny: string;
    total_cards: string;
    total_cards_distinct: string;
    total_mvp_cards: string;
    total_boss_cards: string;
    total_diamonds: string;
  }[];
}

export interface RankingsCharacterResponse {
  timestamp: string;
  rankings: {
    char_id: number;
    account_id: number;
    userid: string;
    name: string;
    class: number;
    base_level: number;
    base_exp: number;
    job_exp: string;
    fame: number;
  }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  results: T[];
}

export interface MobSummary {
  id: number;
  name: string;
  nameAegis: string;
  nameJapanese?: string;
  level: number;
  hp: number;
  baseExp: number;
  jobExp: number;
  mvpExp: number;
  attack: number;
  defense: number;
  magicDefense: number;
  element: string;
  elementLevel: number;
  race: string;
  size: string;
  isMvp: boolean;
  class?: string;
}

export interface MobDrop {
  itemId: number | null;
  itemName: string;
  itemAegis: string;
  rate: number;
  type: 'normal' | 'mvp';
  chancePercent: number | null;
}

export interface MobDetail extends MobSummary {
  str?: number;
  agi?: number;
  vit?: number;
  int?: number;
  dex?: number;
  luk?: number;
  modes?: Record<string, boolean>;
  drops: MobDrop[];
}

export interface ItemSummary {
  id: number;
  name: string;
  nameAegis: string;
  type: string;
  subtype?: string;
  attack?: number;
  magicAttack?: number;
  defense?: number;
  weight?: number;
  priceBuy?: number;
  priceSell?: number;
  slots?: number;
  equipLevelMin?: number;
  equipLevelMax?: number;
}

export interface ItemDetail extends ItemSummary {
  range?: number;
  weaponLevel?: number;
  armorLevel?: number;
  refineable?: boolean;
  script?: string;
  equipScript?: string;
  unequipScript?: string;
  jobs?: { all: boolean; jobs: string[] };
  classes?: { all: boolean; classes: string[] };
  locations?: Record<string, boolean>;
  droppedBy?: { id: number; name: string; level: number }[];
}

export type MobSearchParams = Record<string, string | number | undefined>;
export type ItemSearchParams = Record<string, string | number | undefined>;

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.hint || `API error ${response.status}`);
  }
  return response.json();
}

export const apiClient = {
  health: () => apiFetch<HealthResponse>('/health'),
  players: () => apiFetch<PlayersResponse>('/players'),
  stats: () => apiFetch<StatsResponse>('/stats'),
  rankingsAccounts: () => apiFetch<RankingsAccountResponse>('/rankings/accounts'),
  rankingsCharacters: () => apiFetch<RankingsCharacterResponse>('/rankings/characters'),
  uptime: () => apiFetch<UptimeResponse>('/uptime'),
  status: () => apiFetch<StatusResponse>('/status'),

  searchMobs: (params: MobSearchParams) =>
    apiFetch<PaginatedResponse<MobSummary>>(`/mobs${buildQuery(params)}`),

  getMob: (id: number | string) => apiFetch<MobDetail>(`/mobs/${id}`),

  searchItems: (params: ItemSearchParams) =>
    apiFetch<PaginatedResponse<ItemSummary>>(`/items${buildQuery(params)}`),

  getItem: (id: number | string) => apiFetch<ItemDetail>(`/items/${id}`)
};
