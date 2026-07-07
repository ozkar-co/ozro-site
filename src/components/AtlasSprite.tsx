import type { SpriteRect } from '../api/assets';

interface AtlasSpriteProps {
  sprite: SpriteRect | string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: string;
}

const AtlasSprite = ({
  sprite,
  alt = '',
  className = '',
  fallback = '/placeholder.png'
}: AtlasSpriteProps) => {
  if (!sprite) {
    return <img src={fallback} alt={alt} className={className} />;
  }

  if (typeof sprite === 'string') {
    return (
      <img
        src={sprite}
        alt={alt}
        className={className}
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallback;
        }}
      />
    );
  }

  const scale = sprite.w > 0 ? 1 : 1;
  const displayW = sprite.w * scale;
  const displayH = sprite.h * scale;

  return (
    <span
      className={className}
      role="img"
      aria-label={alt}
      style={{
        display: 'inline-block',
        width: displayW,
        height: displayH,
        backgroundImage: `url(${sprite.atlasUrl})`,
        backgroundPosition: `-${sprite.x}px -${sprite.y}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated'
      }}
    />
  );
};

export default AtlasSprite;
