import type { SpriteRect } from './assets';

/** Static fallbacks when an atlas sprite is missing (apple, item id 512). */
export const PLACEHOLDER_ITEM_ICON = '/placeholder-icon.png';
export const PLACEHOLDER_ITEM_ILLUSTRATION = '/placeholder-illustration.png';
export const PLACEHOLDER_MOB_SPRITE = '/placeholder-icon.png';

export function isPlaceholderAsset(sprite: SpriteRect | string | null | undefined): boolean {
  if (!sprite) return true;
  if (typeof sprite !== 'string') return false;
  return sprite === PLACEHOLDER_ITEM_ICON
    || sprite === PLACEHOLDER_ITEM_ILLUSTRATION
    || sprite === PLACEHOLDER_MOB_SPRITE;
}
