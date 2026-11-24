export interface SpriteRect {
  atlasUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasPage {
  page: number;
  image: string;
  mapping: string;
  count?: number;
}

export interface AssetManifest {
  version: number;
  generatedAt: string;
  items: {
    icons: { pages: AtlasPage[] };
    illustrations: { pages: AtlasPage[] };
  };
  mobs: {
    sprites: { pages: AtlasPage[] };
  };
  npcs?: {
    sprites: { pages: AtlasPage[] };
  };
}

type AssetCategory = 'items/icons' | 'items/illustrations' | 'mobs/sprites' | 'npcs/sprites';

export const ASSETS_BASE = '/assets';

let manifestPromise: Promise<AssetManifest | null> | null = null;
const mappingCache = new Map<string, Record<string, SpriteRect & { page?: number }>>();

export function assetUrl(relativePath: string, cacheKey?: string): string {
  const path = `${ASSETS_BASE}/${relativePath.replace(/^\//, '')}`;
  if (!cacheKey) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}v=${encodeURIComponent(cacheKey)}`;
}

export async function loadManifest(): Promise<AssetManifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch(assetUrl('manifest.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

function categoryKey(category: AssetCategory, page: number): string {
  return `${category}:${page}`;
}

async function loadPageMapping(
  manifest: AssetManifest,
  category: AssetCategory
): Promise<Record<string, SpriteRect & { page?: number }>> {
  const section = category === 'items/icons'
    ? manifest.items.icons
    : category === 'items/illustrations'
      ? manifest.items.illustrations
      : category === 'npcs/sprites'
        ? manifest.npcs?.sprites
        : manifest.mobs.sprites;

  if (!section?.pages?.length) {
    return {};
  }

  const cacheKey = manifest.generatedAt || String(manifest.version || '');
  const merged: Record<string, SpriteRect & { page?: number }> = {};

  const pages = await Promise.all(section.pages.map(async (pageInfo) => {
    const key = categoryKey(category, pageInfo.page);
    if (mappingCache.has(key)) {
      return mappingCache.get(key)!;
    }
    const response = await fetch(assetUrl(pageInfo.mapping, cacheKey));
    if (!response.ok) return {};
    const mapping = await response.json() as Record<string, { x: number; y: number; w: number; h: number; page?: number }>;
    const withUrls: Record<string, SpriteRect & { page?: number }> = {};
    for (const [id, rect] of Object.entries(mapping)) {
      withUrls[id] = {
        ...rect,
        atlasUrl: assetUrl(pageInfo.image, cacheKey)
      };
    }
    mappingCache.set(key, withUrls);
    return withUrls;
  }));

  for (const pageMapping of pages) {
    Object.assign(merged, pageMapping);
  }

  return merged;
}

const categoryMappings = new Map<AssetCategory, Promise<Record<string, SpriteRect & { page?: number }>>>();

export async function resolveSprite(
  id: string | number,
  category: AssetCategory
): Promise<SpriteRect | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  if (!categoryMappings.has(category)) {
    categoryMappings.set(category, loadPageMapping(manifest, category));
  }

  const mapping = await categoryMappings.get(category)!;
  const key = String(id);
  const rect = mapping[key] ?? mapping[key.toLowerCase()];
  if (!rect) return null;

  return {
    atlasUrl: rect.atlasUrl,
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h
  };
}

/** true si el id está en el manifest del atlas. */
export function hasManifestSprite(resolved: SpriteRect | null): boolean {
  return resolved != null;
}
