import { Link } from 'react-router-dom';
import { formatFilterLabel } from '../api/databaseMappers';

export interface NpcResult {
  id: string;
  name: string;
  nameRaw?: string | null;
  type: string | null;
  mapId: string | null;
  x: number | null;
  y: number | null;
  spriteStem?: string | null;
  shopCount: number;
  functionCount: number;
  scriptPath?: string | null;
  shops?: {
    shopId: string;
    shopName: string;
    shopType: string | null;
    mapId: string | null;
    x: number | null;
    y: number | null;
    itemCount: number | null;
    currency: string | null;
  }[];
  functions?: string[];
}

interface NpcCardProps {
  result: NpcResult;
}

const NpcCard = ({ result }: NpcCardProps) => {
  return (
    <div className="result-card result-card--npc">
      <div className="result-card-header">
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
              to={`/database?tab=maps&q=${encodeURIComponent(result.mapId)}&run=1`}
              className="dropped-by-map"
            >
              {result.mapId}
              {result.x != null && result.y != null ? ` (${result.x},${result.y})` : ''}
            </Link>
          ) : (
            <span>Sin mapa</span>
          )}
          {result.shopCount > 0 && <span>{result.shopCount} shop{result.shopCount === 1 ? '' : 's'}</span>}
          {result.functionCount > 0 && (
            <span>{result.functionCount} function{result.functionCount === 1 ? '' : 's'}</span>
          )}
        </div>
      </div>

      {result.functions && result.functions.length > 0 && (
        <div className="result-card-section">
          <div className="npc-tag-list">
            {result.functions.map((fn) => (
              <span key={fn} className="npc-tag">{formatFilterLabel(fn)}</span>
            ))}
          </div>
        </div>
      )}

      {result.shops && result.shops.length > 0 && (
        <div className="result-card-section">
          <div className="result-card-script-header">Tiendas</div>
          <ul className="npc-shop-list">
            {result.shops.map((shop) => (
              <li key={shop.shopId}>
                <strong>{shop.shopName}</strong>
                {shop.itemCount != null && (
                  <span className="acquisition-meta"> · {shop.itemCount} items</span>
                )}
                {shop.currency && (
                  <span className="acquisition-meta"> · {shop.currency}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.scriptPath && (
        <div className="result-card-section npc-script-path">
          {result.scriptPath}
        </div>
      )}
    </div>
  );
};

export default NpcCard;
