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

export type MapImageSource = 'minimap' | 'walkable';

export interface MapImageVariant {
  image: string;
  width: number;
  height: number;
}

export interface MapImageInfo {
  /** Preferred/default preview (also used as thumb). */
  image: string;
  width: number;
  height: number;
  mapWidth: number;
  mapHeight: number;
  source?: MapImageSource | string;
  defaultSource?: MapImageSource | string;
  sources?: string[];
  minimap?: MapImageVariant;
  walkable?: MapImageVariant;
}

export interface MapImagesIndex {
  schemaVersion: number;
  generatedAt: string;
  prefer?: string;
  sources?: Record<string, number>;
  maps: Record<string, MapImageInfo>;
}

export const SPAWNS_BASE = '/assets/spawns';
export const MAP_IMAGES_BASE = '/assets/maps';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
    throw new Error(`Respuesta no JSON desde ${url} (${contentType || 'sin content-type'})`);
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

export function resolveMapImageVariant(
  info: MapImageInfo,
  preferred: MapImageSource
): { variant: MapImageVariant; source: MapImageSource } {
  if (preferred === 'minimap' && info.minimap) {
    return { variant: info.minimap, source: 'minimap' };
  }
  if (preferred === 'walkable' && info.walkable) {
    return { variant: info.walkable, source: 'walkable' };
  }
  if (info.minimap) return { variant: info.minimap, source: 'minimap' };
  if (info.walkable) return { variant: info.walkable, source: 'walkable' };
  return {
    variant: { image: info.image, width: info.width, height: info.height },
    source: (info.source === 'walkable' ? 'walkable' : 'minimap')
  };
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
