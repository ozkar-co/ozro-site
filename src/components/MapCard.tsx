import { Link } from 'react-router-dom';
import { MAP_IMAGES_BASE } from '../api/mapData';
import type { MapConnection, MapDetail, MapSummary } from '../api/client';
import { formatFilterLabel } from '../api/databaseMappers';
import MapViewer from './MapViewer';

export type MapResult = MapSummary & {
  connections?: MapConnection[];
  client?: unknown;
  detailed?: boolean;
};

interface MapCardProps {
  result: MapResult;
}

const numberFormat = new Intl.NumberFormat('es');

const MapCard = ({ result }: MapCardProps) => {
  const openHref = `/database?tab=maps&q=${encodeURIComponent(result.id)}&run=1`;
  const detailed = Boolean(result.detailed || result.connections);
  const tags: string[] = [];
  if (result.isTown) tags.push('Ciudad');
  if (result.isDungeon) tags.push('Dungeon');
  if (result.isInstance) tags.push('Instancia');
  if (result.isQuestMap) tags.push('Quest');
  if (result.isGuildMap) tags.push('Guild');
  if (result.isInterior) tags.push('Interior');
  if (result.hasBossSpawn) tags.push('Boss');

  return (
    <div className={`result-card result-card--map${detailed ? ' result-card--map-detail' : ''}`}>
      <div className="map-card-top">
        <Link to={openHref} className="map-card-thumb" title={result.name}>
          <img
            src={`${MAP_IMAGES_BASE}/images/${encodeURIComponent(result.id)}.webp`}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />
        </Link>
        <div className="map-card-heading">
          <div className="result-card-header">
            <h3>
              <span className="name-title">
                <Link to={openHref}>{result.name}</Link>
              </span>
              {' '}
              <span className="result-card-id">{result.id}</span>
            </h3>
            <div className="map-card-meta">
              {result.category && <span>{formatFilterLabel(result.category)}</span>}
              {result.spawnSpecies > 0 && (
                <span>
                  {numberFormat.format(result.spawnSpecies)} especie
                  {result.spawnSpecies === 1 ? '' : 's'}
                </span>
              )}
              {result.spawnAmount > 0 && (
                <span>{numberFormat.format(result.spawnAmount)} mobs</span>
              )}
              {result.npcCount > 0 && (
                <span>
                  {numberFormat.format(result.npcCount)} NPC
                  {result.npcCount === 1 ? '' : 's'}
                </span>
              )}
              {result.width != null && result.height != null && (
                <span>
                  {result.width}×{result.height}
                </span>
              )}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="map-card-tags">
              {tags.map((tag) => (
                <span key={tag} className="map-tag">{tag}</span>
              ))}
            </div>
          )}
          {!detailed && (
            <div className="map-card-actions">
              <Link to={openHref} className="maps-open-link">
                Ver mapa
              </Link>
            </div>
          )}
        </div>
      </div>

      {detailed && (
        <div className="map-card-viewer">
          <MapViewer map={result as MapDetail} />
        </div>
      )}
    </div>
  );
};

export default MapCard;
