export interface SpawnMapInfo {
  map: string;
  mapName: string;
  points: number;
  species: number;
  amount: number;
  boss: boolean;
  instance: boolean;
}

export interface SpawnMapsIndex {
  schemaVersion: number;
  generatedAt: string;
  maps: SpawnMapInfo[];
}

export interface SpawnPoint {
  mobId: number;
  mobName: string;
  mobAegis?: string | null;
  map: string;
  x: number;
  y: number;
  xs: number;
  ys: number;
  amount: number;
  delay: number;
  delay2: number;
  boss: boolean;
  instance: boolean;
}

export interface MapImageInfo {
  image: string;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
}

export interface MapImagesIndex {
  schemaVersion: number;
  generatedAt: string;
  maps: Record<string, MapImageInfo>;
}

export const SPAWNS_BASE = '/assets/spawns';
export const MAP_IMAGES_BASE = '/assets/maps';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

let mapsPromise: Promise<SpawnMapsIndex> | null = null;

export function loadSpawnMaps(): Promise<SpawnMapsIndex> {
  if (!mapsPromise) {
    mapsPromise = fetchJson<SpawnMapsIndex>(`${SPAWNS_BASE}/maps.json`).catch((error) => {
      mapsPromise = null;
      throw error;
    });
  }
  return mapsPromise;
}

let mapImagesPromise: Promise<MapImagesIndex> | null = null;

export function loadMapImages(): Promise<MapImagesIndex> {
  if (!mapImagesPromise) {
    mapImagesPromise = fetchJson<MapImagesIndex>(`${MAP_IMAGES_BASE}/index.json`).catch((error) => {
      mapImagesPromise = null;
      throw error;
    });
  }
  return mapImagesPromise;
}

const mapSpawnsCache = new Map<string, Promise<SpawnPoint[]>>();

export function loadMapSpawns(map: string): Promise<SpawnPoint[]> {
  const cached = mapSpawnsCache.get(map);
  if (cached) return cached;

  const promise = fetchJson<SpawnPoint[]>(
    `${SPAWNS_BASE}/maps/${encodeURIComponent(map)}.json`
  ).catch((error) => {
    mapSpawnsCache.delete(map);
    throw error;
  });
  mapSpawnsCache.set(map, promise);
  return promise;
}
