import type { SpriteRect } from './assets';

/** Static fallbacks when an atlas sprite is missing (apple, item id 512). */
export const PLACEHOLDER_ITEM_ICON = '/placeholder-icon.png';
export const PLACEHOLDER_ITEM_ILLUSTRATION = '/placeholder-illustration.png';
export const PLACEHOLDER_MOB_SPRITE = '/placeholder-icon.png';
/** Generic RO-style skill button (paw) when atlas has no skill icon. */
export const PLACEHOLDER_SKILL_ICON = '/placeholder-skill-icon.png';
/** Standing NPC with "no img" sign when atlas has no sprite for the stem. */
export const PLACEHOLDER_NPC_SPRITE = '/placeholder-npc.png';
/** Warp portal effect preview when npc_type is warp/warp2 (no 2D stem). */
export const PLACEHOLDER_WARP_SPRITE = '/placeholder-warp.png';

export function isPlaceholderAsset(sprite: SpriteRect | string | null | undefined): boolean {
  if (!sprite) return true;
  if (typeof sprite !== 'string') return false;
  return sprite === PLACEHOLDER_ITEM_ICON
    || sprite === PLACEHOLDER_ITEM_ILLUSTRATION
    || sprite === PLACEHOLDER_MOB_SPRITE
    || sprite === PLACEHOLDER_SKILL_ICON
    || sprite === PLACEHOLDER_NPC_SPRITE
    || sprite === PLACEHOLDER_WARP_SPRITE;
}
