import { Link } from 'react-router-dom';
import type { SpriteRect } from '../api/assets';
import type { NpcDetail, NpcShopItem, NpcShopLink } from '../api/client';
import { formatFilterLabel } from '../api/databaseMappers';
import { PLACEHOLDER_NPC_SPRITE, PLACEHOLDER_WARP_SPRITE } from '../api/placeholders';
import AtlasSprite from './AtlasSprite';

export type NpcResult = NpcDetail & {
  sprite?: SpriteRect | string | null;
};

interface NpcCardProps {
  result: NpcResult;
}

const numberFormat = new Intl.NumberFormat('es');

function formatPrice(price: number | null | undefined) {
  if (price == null || price < 0) return null;
  return `${numberFormat.format(price)}z`;
}

function ShopItemsList({ items }: { items: NpcShopItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="npc-shop-item-list">
      {items.map((item, index) => {
        const price = formatPrice(item.price);
        const stock = item.stock != null ? `stock ${numberFormat.format(item.stock)}` : null;
        const meta = [price, stock].filter(Boolean).join(' · ');
        return (
          <li key={`${item.itemId}-${item.listIndex ?? index}`}>
            {item.itemId != null ? (
              <Link to={`/database?tab=items&q=${item.itemId}&run=1`}>{item.name}</Link>
            ) : (
              <span>{item.name}</span>
            )}
            {meta && <span className="acquisition-meta"> · {meta}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function ShopLinksList({ links }: { links: NpcShopLink[] }) {
  if (!links.length) return null;
  return (
    <ul className="npc-shop-list">
      {links.map((link) => (
        <li key={link.linkId}>
          <strong>{link.targetName || link.linkId}</strong>
          {link.itemCount != null && (
            <span className="acquisition-meta"> · {link.itemCount} items</span>
          )}
          {link.resolveStatus && (
            <span className="acquisition-meta"> · {formatFilterLabel(link.resolveStatus)}</span>
          )}
          {link.shops.length > 0 && (
            <ul className="npc-shop-item-list">
              {link.shops.map((shop) => (
                <li key={shop.shopId}>
                  {shop.shopNpcId ? (
                    <Link to={`/database?tab=npcs&q=${encodeURIComponent(shop.shopNpcId)}&run=1`}>
                      {shop.shopName}
                    </Link>
                  ) : (
                    <span>{shop.shopName}</span>
                  )}
                  {shop.shopType && (
                    <span className="acquisition-meta"> · {formatFilterLabel(shop.shopType)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

const NpcCard = ({ result }: NpcCardProps) => {
  const sprite = result.sprite ?? null;
  const isWarp = result.type === 'warp' || result.type === 'warp2';
  const fallback = isWarp ? PLACEHOLDER_WARP_SPRITE : PLACEHOLDER_NPC_SPRITE;
  const shops = result.shops || [];
  const functions = result.functions || [];
  const quests = result.quests || [];
  const rewards = result.rewards || [];
  const teachers = result.teachers || [];
  const shopLinks = result.shopLinks || [];
  const shopItemShown = shops.reduce((n, shop) => n + (shop.items?.length || 0), 0);
  const shopItemTotal = result.shopItemTotal ?? shopItemShown;

  return (
    <div className="result-card result-card--npc">
      <div className="result-card-header npc-card-header">
        <AtlasSprite
          sprite={sprite}
          alt={result.name}
          className="npc-card-sprite"
          fallback={fallback}
          fit={{ maxWidth: 64, maxHeight: 64 }}
        />
        <div className="npc-card-heading">
          <h3>
            <span className="name-title">
              <Link to={`/database?tab=npcs&q=${encodeURIComponent(result.id)}&run=1`}>
                {result.name}
              </Link>
            </span>
            {result.type && (
              <>
                {' '}
                <span className="npc-type-badge">{formatFilterLabel(result.type)}</span>
              </>
            )}
          </h3>
          <div className="npc-card-meta">
            {result.mapId ? (
              <Link
                to={`/database?tab=maps&map=${encodeURIComponent(result.mapId!)}&npc=${encodeURIComponent(result.id)}`}
                className="dropped-by-map"
              >
                {result.mapId}
                {result.x != null && result.y != null ? ` (${result.x},${result.y})` : ''}
              </Link>
            ) : (
              <span>Sin mapa</span>
            )}
            {result.spriteStem && <span className="npc-sprite-stem">{result.spriteStem}</span>}
            {result.shopCount > 0 && (
              <span>{result.shopCount} shop{result.shopCount === 1 ? '' : 's'}</span>
            )}
            {(result.questCount ?? 0) > 0 && (
              <span>{result.questCount} quest{result.questCount === 1 ? '' : 's'}</span>
            )}
            {(result.rewardCount ?? 0) > 0 && (
              <span>{result.rewardCount} reward{result.rewardCount === 1 ? '' : 's'}</span>
            )}
            {(result.teacherCount ?? 0) > 0 && (
              <span>{result.teacherCount} skill{result.teacherCount === 1 ? '' : 's'}</span>
            )}
            {(result.shopLinkCount ?? 0) > 0 && (
              <span>{result.shopLinkCount} callshop</span>
            )}
            {result.functionCount > 0 && (
              <span>{result.functionCount} function{result.functionCount === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
      </div>

      {functions.length > 0 && (
        <div className="result-card-section">
          <div className="npc-tag-list">
            {functions.map((fn) => (
              <span key={fn} className="npc-tag">{formatFilterLabel(fn)}</span>
            ))}
          </div>
        </div>
      )}

      {shops.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Tiendas
            {shopItemTotal > 0 ? ` (${shopItemTotal} items)` : ''}
          </div>
          <ul className="npc-shop-list">
            {shops.map((shop) => (
              <li key={shop.shopId}>
                <strong>{shop.shopName}</strong>
                {shop.shopType && (
                  <span className="acquisition-meta"> · {formatFilterLabel(shop.shopType)}</span>
                )}
                {shop.itemCount != null && (
                  <span className="acquisition-meta"> · {shop.itemCount} items</span>
                )}
                {shop.currency && (
                  <span className="acquisition-meta"> · {shop.currency}</span>
                )}
                {shop.items && shop.items.length > 0 && <ShopItemsList items={shop.items} />}
              </li>
            ))}
          </ul>
          {shopItemTotal > shopItemShown && (
            <div className="acquisition-more">
              +{shopItemTotal - shopItemShown} items más
            </div>
          )}
        </div>
      )}

      {shopLinks.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Callshop ({result.shopLinkTotal ?? shopLinks.length})
          </div>
          <ShopLinksList links={shopLinks} />
        </div>
      )}

      {quests.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Quests ({result.questTotal ?? quests.length})
          </div>
          <ul className="npc-shop-list">
            {quests.map((quest) => (
              <li key={quest.linkId}>
                <strong>
                  {quest.questId != null ? `#${quest.questId} ` : ''}
                  {quest.title || 'Quest'}
                </strong>
                {quest.role && (
                  <span className="acquisition-meta"> · {formatFilterLabel(quest.role)}</span>
                )}
              </li>
            ))}
          </ul>
          {(result.questTotal ?? 0) > quests.length && (
            <div className="acquisition-more">
              +{(result.questTotal || 0) - quests.length} quests más
            </div>
          )}
        </div>
      )}

      {rewards.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Recompensas ({result.rewardTotal ?? rewards.length})
          </div>
          <ul className="npc-shop-item-list">
            {rewards.map((reward) => {
              const qty = reward.quantity != null && reward.quantity !== 1
                ? `×${numberFormat.format(reward.quantity)}`
                : null;
              const refine = reward.refine != null && reward.refine > 0
                ? `+${reward.refine}`
                : null;
              const meta = [qty, refine, reward.deliveryKind && formatFilterLabel(reward.deliveryKind)]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={reward.rewardId}>
                  {reward.itemId != null ? (
                    <Link to={`/database?tab=items&q=${reward.itemId}&run=1`}>{reward.name}</Link>
                  ) : (
                    <span>{reward.name}</span>
                  )}
                  {meta && <span className="acquisition-meta"> · {meta}</span>}
                </li>
              );
            })}
          </ul>
          {(result.rewardTotal ?? 0) > rewards.length && (
            <div className="acquisition-more">
              +{(result.rewardTotal || 0) - rewards.length} rewards más
            </div>
          )}
        </div>
      )}

      {teachers.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">
            Skills ({result.teacherTotal ?? teachers.length})
          </div>
          <ul className="npc-shop-list">
            {teachers.map((teacher) => (
              <li key={teacher.teacherId}>
                {teacher.skillId != null ? (
                  <Link to={`/database?tab=skills&q=${teacher.skillId}&run=1`}>
                    {teacher.skillName}
                  </Link>
                ) : (
                  <strong>{teacher.skillName}</strong>
                )}
                {teacher.grantKind && (
                  <span className="acquisition-meta"> · {formatFilterLabel(teacher.grantKind)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.scriptPath && (
        <div className="result-card-section npc-script-path">
          {result.scriptPath}
          {result.scriptLine != null ? `:${result.scriptLine}` : ''}
        </div>
      )}
    </div>
  );
};

export default NpcCard;
