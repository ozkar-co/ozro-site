export interface NpcMapInfo {
  map: string;
  mapName: string;
  total: number;
  visible: number;
  custom?: number;
  instance: boolean;
}

export interface NpcMapsIndex {
  schemaVersion: number;
  generatedAt: string;
  maps: NpcMapInfo[];
}

export interface NpcQuestInfo {
  given?: number[];
  completed?: number[];
  checked?: number[];
}

export interface NpcShopRequiredItem {
  item: string;
  itemId?: number;
  amount?: number;
  refine?: number;
}

export interface NpcShopItem {
  itemId?: number;
  item?: string;
  price?: number;
  stock?: number;
  zeny?: number;
  refine?: number;
  requiredItems?: NpcShopRequiredItem[];
}

export interface NpcShop {
  type: string;
  items: NpcShopItem[];
}

export interface NpcEntry {
  id: string;
  name: string;
  x: number;
  y: number;
  dir: number | null;
  sprite: string | null;
  function: string;
  visible: boolean;
  isInstance: boolean;
  isCustom?: boolean;
  quests?: NpcQuestInfo;
  shop?: NpcShop;
}

export interface NpcSpriteInfo {
  file: string;
  w: number | null;
  h: number | null;
  id: number | null;
  name: string | null;
}

export interface NpcSpriteIndex {
  schemaVersion: number;
  generatedAt: string;
  source: string;
  attribution: string;
  counts: {
    keys: number;
    sprites: number;
    missing: number;
  };
  sprites: Record<string, NpcSpriteInfo>;
  missing: { key: string; reason: string }[];
}

export const NPC_ASSETS_BASE = '/assets/npcs';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

let mapsPromise: Promise<NpcMapsIndex> | null = null;

export function loadNpcMaps(): Promise<NpcMapsIndex> {
  if (!mapsPromise) {
    mapsPromise = fetchJson<NpcMapsIndex>(`${NPC_ASSETS_BASE}/maps.json`).catch((error) => {
      mapsPromise = null;
      throw error;
    });
  }
  return mapsPromise;
}

let spritesPromise: Promise<NpcSpriteIndex> | null = null;

export function loadNpcSprites(): Promise<NpcSpriteIndex> {
  if (!spritesPromise) {
    spritesPromise = fetchJson<NpcSpriteIndex>(`${NPC_ASSETS_BASE}/sprites/index.json`).catch(
      (error) => {
        spritesPromise = null;
        throw error;
      }
    );
  }
  return spritesPromise;
}

const mapCache = new Map<string, Promise<NpcEntry[]>>();

export function loadNpcMap(map: string): Promise<NpcEntry[]> {
  const cached = mapCache.get(map);
  if (cached) return cached;

  const promise = fetchJson<NpcEntry[]>(
    `${NPC_ASSETS_BASE}/npcs/${encodeURIComponent(map)}.json`
  ).catch((error) => {
    mapCache.delete(map);
    throw error;
  });
  mapCache.set(map, promise);
  return promise;
}

export function npcSpriteUrl(
  index: NpcSpriteIndex | null,
  spriteKey: string | null
): string | null {
  if (!index || !spriteKey) return null;
  const sprite = index.sprites[spriteKey];
  if (!sprite?.file) return null;
  return `${NPC_ASSETS_BASE}/sprites/${encodeURIComponent(sprite.file)}`;
}

export function npcDisplayName(npc: NpcEntry): string {
  return npc.name.split('#')[0].trim() || npc.name;
}

export function npcQuestCount(npc: NpcEntry): number {
  if (!npc.quests) return 0;
  return new Set([
    ...(npc.quests.given ?? []),
    ...(npc.quests.completed ?? []),
    ...(npc.quests.checked ?? [])
  ]).size;
}
