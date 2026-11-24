import type { SpriteRect } from '../api/assets';
import { PLACEHOLDER_ITEM_ICON } from '../api/placeholders';

interface AtlasSpriteProps {
  sprite: SpriteRect | string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: string;
  /** Scale atlas rect to fit inside this box (centered). Omit for 1:1. */
  fit?: { maxWidth: number; maxHeight: number };
  /** Explicit multiplier (e.g. 2 for 2×). Ignored when `fit` is set. */
  scale?: number;
}

const AtlasSprite = ({
  sprite,
  alt = '',
  className = '',
  fallback = PLACEHOLDER_ITEM_ICON,
  fit,
  scale: scaleProp = 1
}: AtlasSpriteProps) => {
  if (!sprite) {
    return <img src={fallback} alt={alt} className={className} />;
  }

  if (typeof sprite === 'string') {
    const imgStyle = fit
      ? {
          maxWidth: fit.maxWidth,
          maxHeight: fit.maxHeight,
          width: 'auto' as const,
          height: 'auto' as const,
          objectFit: 'contain' as const,
          imageRendering: 'pixelated' as const
        }
      : scaleProp !== 1
        ? {
            imageRendering: 'pixelated' as const,
            // Non-standard but reserves layout for 2× URL sprites in Chromium
            zoom: scaleProp
          }
        : { imageRendering: 'pixelated' as const };

    return (
      <img
        src={sprite}
        alt={alt}
        className={className}
        style={imgStyle}
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallback;
        }}
      />
    );
  }

  const scale = fit
    ? Math.min(1, fit.maxWidth / Math.max(1, sprite.w), fit.maxHeight / Math.max(1, sprite.h))
    : Math.max(0.01, scaleProp);
  const layoutW = Math.max(1, Math.round(sprite.w * scale));
  const layoutH = Math.max(1, Math.round(sprite.h * scale));

  return (
    <span
      className={className}
      role="img"
      aria-label={alt}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: layoutW,
        height: layoutH,
        overflow: 'hidden',
        verticalAlign: 'middle'
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: sprite.w,
          height: sprite.h,
          marginLeft: -sprite.w / 2,
          marginTop: -sprite.h / 2,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          backgroundImage: `url(${sprite.atlasUrl})`,
          backgroundPosition: `-${sprite.x}px -${sprite.y}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated'
        }}
      />
    </span>
  );
};

export default AtlasSprite;
