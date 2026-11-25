import { resolveSprite, type SpriteRect } from './assets';

export interface NpcSpriteIndex {
  schemaVersion: number;
  generatedAt: string;
  atlas: string;
  count: number;
  sprites: Record<string, { x: number; y: number; w: number; h: number }>;
}

const NPC_ASSETS_BASE = '/assets/npcs';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

let spritesPromise: Promise<NpcSpriteIndex | null> | null = null;

export function loadNpcSprites(): Promise<NpcSpriteIndex> {
  if (!spritesPromise) {
    spritesPromise = fetchJson<NpcSpriteIndex>(`${NPC_ASSETS_BASE}/sprites/index.json`).catch(
      (error) => {
        spritesPromise = null;
        throw error;
      }
    );
  }
  return spritesPromise as Promise<NpcSpriteIndex>;
}

/** Atlas-only NPC sprite (no gif / custom fallback). */
export async function resolveNpcSprite(spriteKey: string | null): Promise<SpriteRect | null> {
  if (!spriteKey) return null;
  return (
    (await resolveSprite(spriteKey, 'npcs/sprites'))
    ?? (await resolveSprite(spriteKey.toLowerCase(), 'npcs/sprites'))
  );
}
