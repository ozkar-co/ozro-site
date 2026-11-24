import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadMapImages, resolveMapImageVariant } from '../api/mapData';
import type { MapConnection, MapDetail, MapSummary } from '../api/client';
import { formatFilterLabel, mapDetailHref } from '../api/databaseMappers';
import MapViewer from './MapViewer';

export type MapResult = MapSummary & {
  connections?: MapConnection[];
  client?: unknown;
  detailed?: boolean;
  spawns?: MapDetail['spawns'];
  npcs?: MapDetail['npcs'];
};

interface MapCardProps {
  result: MapResult;
}

const numberFormat = new Intl.NumberFormat('es');

const MapCard = ({ result }: MapCardProps) => {
  const openHref = mapDetailHref(result.id);
  const detailed = Boolean(result.detailed);
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapImages()
      .then((index) => {
        if (cancelled) return;
        const info = index.maps[result.id];
        if (!info) {
          throw new Error(`Sin entrada de imagen para ${result.id}`);
        }
        // Thumb: real minimap if present; otherwise walkable/default.
        if (info.minimap) {
          setThumb(info.minimap.image);
        } else {
          const { variant } = resolveMapImageVariant(info, 'walkable');
          setThumb(variant.image);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setThumb(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [result.id]);

  const categoryLabel = result.category ? formatFilterLabel(result.category) : null;

  return (
    <div className={`result-card result-card--map${detailed ? ' result-card--map-detail' : ''}`}>
      <div className="map-card-top">
        <Link to={openHref} className="map-card-thumb" title={result.name}>
          {thumb ? (
            <img
              src={thumb}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
              }}
            />
          ) : null}
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
              {categoryLabel && <span>{categoryLabel}</span>}
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
          {categoryLabel && (
            <div className="map-card-tags">
              <span className="map-tag">{categoryLabel}</span>
              {result.hasBossSpawn && <span className="map-tag map-tag-boss">Boss</span>}
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
