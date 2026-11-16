import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFarmingMap, type FarmingMap } from '../../api/farming';
import {
  loadWorldAccess,
  loadWorldview,
  type World,
  type WorldAccess,
  type WorldAccessEntry,
  type WorldMapEntry,
  type Worldview
} from '../../api/worldData';
import '../../styles/WorldMap.css';

const numberFormat = new Intl.NumberFormat('es');

function formatZeny(value: number): string {
  return `${numberFormat.format(Math.round(value))} z`;
}

function accessClass(depth: number | null): string {
  if (depth === null) return 'world-map-area is-unknown';
  if (depth === 0) return 'world-map-area is-hub';
  if (depth === 1) return 'world-map-area is-close';
  if (depth === 2) return 'world-map-area is-mid';
  if (depth === 3) return 'world-map-area is-far';
  return 'world-map-area is-deep';
}

function accessEntry(access: WorldAccess | null, map: string): WorldAccessEntry | null {
  return access?.maps?.[map] ?? null;
}

function mapLabel(map: WorldMapEntry): string {
  return map.name || map.map;
}

const WorldMap = () => {
  const [worldview, setWorldview] = useState<Worldview | null>(null);
  const [access, setAccess] = useState<WorldAccess | null>(null);
  const [worldId, setWorldId] = useState('midgard');
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [farmingMap, setFarmingMap] = useState<FarmingMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadWorldview(), loadWorldAccess()])
      .then(([worlds, worldAccess]) => {
        if (cancelled) return;
        setWorldview(worlds);
        setAccess(worldAccess);
        const first = worlds.worlds.find((world) => world.available && world.image);
        if (first) setWorldId(first.id);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el mapa del mundo');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const world = useMemo<World | null>(
    () => worldview?.worlds.find((entry) => entry.id === worldId) ?? null,
    [worldview, worldId]
  );

  const maps = useMemo(() => {
    if (!world) return [] as WorldMapEntry[];
    return world.maps.filter((map) => map.available !== false);
  }, [world]);

  const filteredMaps = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [] as WorldMapEntry[];
    return maps
      .filter((map) => `${map.name} ${map.map}`.toLowerCase().includes(term))
      .slice(0, 24);
  }, [maps, search]);

  const selectedEntry = useMemo(
    () => maps.find((map) => map.map === selectedMap) ?? null,
    [maps, selectedMap]
  );
  const selectedAccess = selectedMap ? accessEntry(access, selectedMap) : null;

  useEffect(() => {
    if (!selectedMap) {
      setFarmingMap(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    fetchFarmingMap(selectedMap)
      .then((data) => {
        if (!cancelled) setFarmingMap(data);
      })
      .catch(() => {
        if (!cancelled) setFarmingMap(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMap]);

  const selectMap = (map: string) => {
    setSelectedMap(map);
    setSearch('');
  };

  return (
    <section className="world-panel">
      <div className="world-intro">
        <h2>Mapa del mundo</h2>
        <p>
          Accesibilidad calculada desde los 15 hubs con Kafra usando warps, teleports,
          NPCs y airships. La profundidad es el número de transiciones desde el hub
          más cercano; no incluye requisitos de quest.
          {' '}
          <Link to="/encyclopedia?tab=farming">Ir a la calculadora de farmeo</Link>
        </p>
      </div>

      {loading && <div className="world-loading">Cargando mapa del mundo...</div>}
      {error && <div className="world-error">{error}</div>}

      {worldview && (
        <>
          <div className="world-worlds">
            {worldview.worlds.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === worldId ? 'active' : ''}
                disabled={!entry.image}
                onClick={() => {
                  setWorldId(entry.id);
                  setSelectedMap(null);
                  setSearch('');
                }}
              >
                {entry.name}
              </button>
            ))}
          </div>

          <div className="world-controls">
            <label className="world-field world-field-search">
              <span>Buscar mapa</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o ID del mapa..."
              />
            </label>
            <div className="world-legend">
              <span><i className="world-dot is-hub" /> Hub</span>
              <span><i className="world-dot is-close" /> Directo</span>
              <span><i className="world-dot is-mid" /> 2 saltos</span>
              <span><i className="world-dot is-far" /> 3 saltos</span>
              <span><i className="world-dot is-deep" /> 4+ saltos</span>
              <span><i className="world-dot is-unknown" /> Sin ruta</span>
            </div>
          </div>

          {filteredMaps.length > 0 && (
            <div className="world-search-results">
              {filteredMaps.map((map) => {
                const mapAccess = accessEntry(access, map.map);
                return (
                  <button key={map.map} type="button" onClick={() => selectMap(map.map)}>
                    <span>{mapLabel(map)}</span>
                    <span>{map.map}</span>
                    <span className={accessClass(mapAccess?.depth ?? null)}>
                      {mapAccess?.label ?? 'Sin ruta'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="world-layout">
            <div className="world-viewer">
              {!world?.image ? (
                <div className="world-empty">Este mundo no tiene imagen disponible.</div>
              ) : (
                <div
                  className="world-canvas"
                  style={{ aspectRatio: `${world.imageWidth} / ${world.imageHeight}` }}
                >
                  <img
                    className="world-canvas-image"
                    src={world.image}
                    alt={`Mapa de ${world.name}`}
                    loading="lazy"
                  />
                  {maps.map((map) => {
                    const info = accessEntry(access, map.map);
                    const width = world.imageWidth || 1;
                    const height = world.imageHeight || 1;
                    return (
                      <button
                        key={map.map}
                        type="button"
                        className={`${accessClass(info?.depth ?? null)}${selectedMap === map.map ? ' is-selected' : ''}`}
                        style={{
                          left: `${(map.x1 / width) * 100}%`,
                          top: `${(map.y1 / height) * 100}%`,
                          width: `${((map.x2 - map.x1) / width) * 100}%`,
                          height: `${((map.y2 - map.y1) / height) * 100}%`
                        }}
                        title={`${mapLabel(map)} (${map.map}) · ${info?.label ?? 'Sin ruta'}`}
                        aria-label={`${mapLabel(map)} (${map.map})`}
                        onClick={() => setSelectedMap(map.map)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="world-side">
              {!selectedEntry && (
                <div className="world-side-empty">
                  Selecciona un mapa en la imagen o búscalo por nombre.
                </div>
              )}

              {selectedEntry && (
                <div className="world-detail">
                  <h3>{mapLabel(selectedEntry)}</h3>
                  <p className="world-detail-id">
                    {selectedEntry.map}
                    {selectedEntry.level ? ` · Nivel ${selectedEntry.level}` : ''}
                  </p>

                  <div className="world-detail-metrics">
                    <div>
                      <span>Acceso</span>
                      <strong>{selectedAccess?.label ?? 'Sin ruta'}</strong>
                    </div>
                    <div>
                      <span>Transiciones</span>
                      <strong>{selectedAccess?.depth ?? '—'}</strong>
                    </div>
                  </div>

                  {selectedAccess?.path && selectedAccess.path.length > 0 && (
                    <>
                      <div className="world-subtitle">Ruta desde el hub</div>
                      <ol className="world-path">
                        {selectedAccess.path.map((step, index) => (
                          <li key={`${step.from}-${step.to}-${index}`}>
                            <strong>{step.from}</strong>
                            <span> → </span>
                            <strong>{step.to}</strong>
                            <span className="world-step-kind">
                              {step.kind}{step.name ? ` · ${step.name}` : ''}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}

                  <div className="world-subtitle">Farmeo</div>
                  {detailLoading && <p className="world-note">Calculando MZW...</p>}
                  {!detailLoading && farmingMap && (
                    <>
                      <div className="world-detail-metrics">
                        <div>
                          <span>MZW ponderado</span>
                          <strong>{formatZeny(farmingMap.weightedMzw)}</strong>
                        </div>
                        <div>
                          <span>Mobs</span>
                          <strong>{farmingMap.mobCount}</strong>
                        </div>
                      </div>
                      <div className="world-farm-mobs">
                        {farmingMap.mobs.map((mob) => (
                          <div key={mob.id}>
                            <span>{mob.name}</span>
                            <span>Nv. {mob.level}</span>
                            <span>{numberFormat.format(mob.amount)}</span>
                            <span>{formatZeny(mob.mzw)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {!detailLoading && !farmingMap && (
                    <p className="world-note">Sin datos de farmeo para este mapa.</p>
                  )}

                  <Link className="world-link" to={`/database?tab=maps&map=${encodeURIComponent(selectedEntry.map)}`}>
                    Ver spawns en la base de datos
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default WorldMap;
