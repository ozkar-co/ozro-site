export const API_BASE_URL = '/api';

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
  cardCatalogTotal: number;
  rankings: {
    account_id: number;
    userid: string;
    logincount: number;
    total_zeny: string;
    total_cards_distinct: string;
    total_mvp_cards: string;
    total_boss_cards: string;
    total_diamonds: string;
  }[];
}

export interface CardBookResponse {
  timestamp: string;
  account: {
    account_id: number;
    userid: string;
  };
  total_owned: number;
  owned: number[];
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

export interface RankingsMvpResponse {
  timestamp: string;
  rankings: {
    char_id: number;
    account_id: number;
    userid: string;
    name: string;
    class: number;
    kills: number;
    assistances: number;
  }[];
}

export interface RankingsMvpDetailResponse {
  timestamp: string;
  char_id: number;
  name: string;
  kills: number;
  assistances: number;
  entries: {
    mobId: number;
    name: string;
    nameAegis: string | null;
    kills: number;
    assistances: number;
  }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  results: T[];
}

export interface MobSpawnMapSummary {
  map: string;
  mapName?: string;
  amount: number;
  points: number;
  boss: boolean;
  instance: boolean;
}

export interface MobSpawnPoint {
  map: string;
  mapName?: string;
  x: number;
  y: number;
  xs: number;
  ys: number;
  amount: number;
  delay: number;
  delay2: number;
  boss: boolean;
  instance: boolean;
  source?: { file: string; line: number };
}

export interface MobSummon {
  mobId: number;
  mobAegis?: string | null;
  mobName: string;
  amount: number;
  conditions?: string[];
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
  spawnMaps?: MobSpawnMapSummary[];
  spawnMapCount?: number;
  spawnAmount?: number;
  hasWorldSpawn?: boolean;
  summons?: MobSummon[];
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
  sp?: number;
  attack2?: number;
  walkSpeed?: number;
  attackDelay?: number;
  skillRange?: number;
  chaseRange?: number;
  ai?: string;
  modes?: Record<string, boolean>;
  drops: MobDrop[];
  spawns?: MobSpawnPoint[];
}

export interface ItemSummary {
  id: number;
  name: string;
  nameAegis: string;
  nameEnglish?: string | null;
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
  gradable?: boolean;
  gender?: string;
  script?: string;
  equipScript?: string;
  unequipScript?: string;
  jobs?: { all: boolean; jobs: string[] };
  classes?: { all: boolean; classes: string[] };
  locations?: Record<string, boolean>;
  droppedBy?: {
    id: number;
    name: string;
    level: number;
    rate?: number;
    dropType?: string;
    chancePercent?: number | null;
    spawnMaps?: MobSpawnMapSummary[];
    spawnMapCount?: number;
    spawnAmount?: number;
    hasWorldSpawn?: boolean;
  }[];
}

export interface ItemDescriptionResponse {
  id: number;
  identified: string[];
  unidentified: string[];
}

export type MvpState = 'dead' | 'probable' | 'alive' | 'unknown';

export interface MvpLastKill {
  at: number;
  secondsAgo: number;
  killer: string | null;
}

export interface MvpEntry {
  id: string;
  mobId: number;
  name: string;
  nameAegis: string;
  level: number;
  hp: number;
  element: string;
  elementLevel: number;
  race: string;
  size: string;
  baseExp: number;
  jobExp: number;
  mvpExp: number;
  souls: number;
  map: string;
  amount: number;
  delay: number;
  delay2: number;
  state: MvpState;
  probabilityAlive: number | null;
  windowStart: number | null;
  windowEnd: number | null;
  respawnMinSeconds: number;
  respawnMaxSeconds: number;
  lastKill: MvpLastKill | null;
  summons?: MobSummon[];
}

export interface MvpRecentKill {
  mobId: number;
  map: string;
  at: number;
  secondsAgo: number;
  killer: string | null;
}

export interface MvpRadarResponse {
  serverTime: number;
  yellowWindowSeconds: number;
  mvps: MvpEntry[];
  recentKills: MvpRecentKill[];
}

export type MobSearchParams = Record<string, string | number | undefined>;
export type ItemSearchParams = Record<string, string | number | undefined>;

export interface ItemMetaResponse {
  types: string[];
  armorSubtypes: string[];
  weaponSubtypes: string[];
  cardLocations: string[];
  classes: string[];
  jobs: string[];
  defaults: {
    types: string[];
  };
}

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
  rankingsMvps: () => apiFetch<RankingsMvpResponse>('/rankings/mvps'),
  rankingsMvpDetail: (charId: number | string) =>
    apiFetch<RankingsMvpDetailResponse>(`/rankings/mvps/${charId}`),
  getCardBook: (accountId: number | string) =>
    apiFetch<CardBookResponse>(`/accounts/${accountId}/card-book`),
  uptime: () => apiFetch<UptimeResponse>('/uptime'),
  status: () => apiFetch<StatusResponse>('/status'),
  mvpRadar: () => apiFetch<MvpRadarResponse>('/mvps'),

  searchMobs: (params: MobSearchParams) =>
    apiFetch<PaginatedResponse<MobDetail>>(`/mobs${buildQuery(params)}`),

  getMob: (id: number | string) => apiFetch<MobDetail>(`/mobs/${id}`),

  searchItems: (params: ItemSearchParams) =>
    apiFetch<PaginatedResponse<ItemDetail>>(`/items${buildQuery(params)}`),

  getItemMeta: () => apiFetch<ItemMetaResponse>('/items/meta'),

  getItem: (id: number | string) => apiFetch<ItemDetail>(`/items/${id}`),

  getItemDescription: (id: number | string) =>
    apiFetch<ItemDescriptionResponse>(`/items/${id}/description`)
};
