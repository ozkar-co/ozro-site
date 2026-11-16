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
}

type AssetCategory = 'items/icons' | 'items/illustrations' | 'mobs/sprites';

export const ASSETS_BASE = '/assets';

const CUSTOM_ITEM_DIRS: Partial<Record<AssetCategory, string>> = {
  'items/icons': 'items/custom/icons',
  'items/illustrations': 'items/custom/illustrations'
};
const CUSTOM_ITEM_EXTENSIONS = ['png', 'webp', 'jpg', 'jpeg'];

let manifestPromise: Promise<AssetManifest | null> | null = null;
const mappingCache = new Map<string, Record<string, SpriteRect & { page?: number }>>();
const customAssetCache = new Map<string, Promise<string | null>>();

async function findCustomAsset(category: AssetCategory, id: string): Promise<string | null> {
  const dir = CUSTOM_ITEM_DIRS[category];
  if (!dir) return null;

  for (const extension of CUSTOM_ITEM_EXTENSIONS) {
    const url = assetUrl(`${dir}/${id}.${extension}`);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) return url;
    } catch {
      // Keep trying the next extension.
    }
  }
  return null;
}

function resolveCustomAsset(category: AssetCategory, id: string): Promise<string | null> {
  const key = `${category}:${id}`;
  if (!customAssetCache.has(key)) {
    customAssetCache.set(key, findCustomAsset(category, id));
  }
  return customAssetCache.get(key)!;
}

export function assetUrl(relativePath: string): string {
  return `${ASSETS_BASE}/${relativePath.replace(/^\//, '')}`;
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
      : manifest.mobs.sprites;

  const merged: Record<string, SpriteRect & { page?: number }> = {};

  await Promise.all(section.pages.map(async (pageInfo) => {
    const key = categoryKey(category, pageInfo.page);
    if (mappingCache.has(key)) {
      Object.assign(merged, mappingCache.get(key));
      return;
    }
    const response = await fetch(assetUrl(pageInfo.mapping));
    if (!response.ok) return;
    const mapping = await response.json() as Record<string, { x: number; y: number; w: number; h: number; page?: number }>;
    const withUrls: Record<string, SpriteRect & { page?: number }> = {};
    for (const [id, rect] of Object.entries(mapping)) {
      withUrls[id] = {
        ...rect,
        atlasUrl: assetUrl(pageInfo.image)
      };
    }
    mappingCache.set(key, withUrls);
    Object.assign(merged, withUrls);
  }));

  return merged;
}

const categoryMappings = new Map<AssetCategory, Promise<Record<string, SpriteRect & { page?: number }>>>();

export async function resolveSprite(
  id: string,
  category: AssetCategory
): Promise<SpriteRect | string | null> {
  const manifest = await loadManifest();
  if (manifest) {
    if (!categoryMappings.has(category)) {
      categoryMappings.set(category, loadPageMapping(manifest, category));
    }

    const mapping = await categoryMappings.get(category)!;
    const rect = mapping[id];
    if (rect) {
      return {
        atlasUrl: rect.atlasUrl,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h
      };
    }
  }

  return resolveCustomAsset(category, id);
}
