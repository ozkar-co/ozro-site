export interface FarmingDrop {
  id: number;
  name: string;
  nameAegis: string;
  type: 'normal' | 'mvp';
  chancePercent: number;
  sell: number;
  valueSource: string | null;
  expected: number;
  expectedBase: number;
}

export interface FarmingSpawnMap {
  map: string;
  amount: number;
  points: number;
  boss: boolean;
  instance: boolean;
  respawnMs: number | null;
  respawnMaxMs: number | null;
  accessDepth: number | null;
  accessLabel: string;
}

export interface FarmingMob {
  id: number;
  name: string;
  nameAegis: string;
  level: number;
  hp: number;
  baseExp: number;
  jobExp: number;
  mvpExp: number;
  class: string | null;
  isMvp: boolean;
  isBoss: boolean;
  fixedDrop: boolean;
  mzw: number;
  mzwBase: number;
  mzwNormal: number;
  mzwMvp: number;
  zenyPerHp: number;
  zenyPerHpBase: number;
  penaltyRate: number;
  dropCount: number;
  drops: FarmingDrop[];
  spawnMaps: FarmingSpawnMap[];
  spawnMapCount: number;
  spawnAmount: number;
  hasWorldSpawn: boolean;
  accessDepth: number | null;
  accessLabel: string;
}

export interface FarmingMapMob {
  id: number;
  name: string;
  nameAegis: string;
  level: number;
  amount: number;
  points: number;
  isMvp: boolean;
  isBoss: boolean;
  mzw: number;
  mzwBase: number;
  zenyPerHp: number;
  zenyPerHpBase: number;
  penaltyRate: number;
}

export interface FarmingMap {
  map: string;
  mapName: string;
  accessDepth: number | null;
  accessLabel: string;
  totalAmount: number;
  minRespawnMs: number | null;
  maxRespawnMs: number | null;
  mobCount: number;
  minMobLevel: number;
  maxMobLevel: number;
  weightedMzw: number;
  weightedZenyPerHp: number;
  maxMzw: number;
  mobs: FarmingMapMob[];
}

export interface FarmingMeta {
  total: number;
  page: number;
  limit: number;
  valueSource: string;
  playerLevel: number | null;
  penaltyApplied: boolean;
}

export interface FarmingMobsResponse extends FarmingMeta {
  results: FarmingMob[];
}

export interface FarmingMapsResponse extends FarmingMeta {
  results: FarmingMap[];
}

export type FarmingParams = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params: FarmingParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api/farming${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.hint || `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchFarmingMobs(params: FarmingParams = {}): Promise<FarmingMobsResponse> {
  return fetchJson<FarmingMobsResponse>(`/mobs${buildQuery(params)}`);
}

export function fetchFarmingMaps(params: FarmingParams = {}): Promise<FarmingMapsResponse> {
  return fetchJson<FarmingMapsResponse>(`/maps${buildQuery(params)}`);
}

export function fetchFarmingMob(id: number | string, params: FarmingParams = {}): Promise<FarmingMob> {
  return fetchJson<FarmingMob>(`/mobs/${encodeURIComponent(String(id))}${buildQuery(params)}`);
}

export function fetchFarmingMap(map: string, params: FarmingParams = {}): Promise<FarmingMap> {
  return fetchJson<FarmingMap>(`/maps/${encodeURIComponent(map)}${buildQuery(params)}`);
}
