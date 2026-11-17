export interface WorldRouteStep {
  kind: string;
  from: string;
  to: string;
  name: string;
}

export interface WorldAccessEntry {
  depth: number | null;
  label: string;
  path: WorldRouteStep[];
}

export interface WorldAccess {
  schemaVersion: number;
  generatedAt: string;
  source: string[];
  hubs: string[];
  maps: Record<string, WorldAccessEntry>;
  counts: {
    maps: number;
    hubs: number;
    reachable: number;
    unknown: number;
  };
}

export interface WorldMapEntry {
  region: number;
  map: string;
  msg: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  level: string;
  name: string;
  available: boolean;
}

export interface World {
  id: string;
  name: string;
  table: string;
  dungeonTable?: string;
  image: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  available: boolean;
  maps: WorldMapEntry[];
}

export interface Worldview {
  schemaVersion: number;
  generatedAt: string;
  source: Record<string, string>;
  worlds: World[];
}

export interface WorldRoute {
  kind: string;
  from: string;
  to: string;
  fromX?: number | null;
  fromY?: number | null;
  toX?: number | null;
  toY?: number | null;
  name?: string | null;
  sprite?: string | null;
  id?: number;
}

export interface WorldRoutesIndex {
  schemaVersion: number;
  generatedAt: string;
  routes: WorldRoute[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

let worldviewPromise: Promise<Worldview> | null = null;
let worldAccessPromise: Promise<WorldAccess> | null = null;
let worldRoutesPromise: Promise<WorldRoutesIndex> | null = null;

export function loadWorldview(): Promise<Worldview> {
  if (!worldviewPromise) {
    worldviewPromise = fetchJson<Worldview>('/assets/world/worldview.json').catch((error) => {
      worldviewPromise = null;
      throw error;
    });
  }
  return worldviewPromise;
}

export function loadWorldAccess(): Promise<WorldAccess> {
  if (!worldAccessPromise) {
    worldAccessPromise = fetchJson<WorldAccess>('/assets/world/access.json').catch((error) => {
      worldAccessPromise = null;
      throw error;
    });
  }
  return worldAccessPromise;
}

export function loadWorldRoutes(): Promise<WorldRoutesIndex> {
  if (!worldRoutesPromise) {
    worldRoutesPromise = fetchJson<WorldRoutesIndex>('/assets/world/routes.json').catch((error) => {
      worldRoutesPromise = null;
      throw error;
    });
  }
  return worldRoutesPromise;
}
