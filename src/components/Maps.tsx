import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  loadMapImages,
  loadMapSpawns,
  loadSpawnMaps,
  type MapImagesIndex,
  type SpawnMapInfo,
  type SpawnMapsIndex,
  type SpawnPoint
} from '../api/mapData';
import '../styles/Maps.css';

interface MobSpawnGroup {
  mobId: number;
  mobName: string;
  mobAegis?: string | null;
  amount: number;
  points: number;
  boss: boolean;
  instance: boolean;
  spawns: SpawnPoint[];
}

const DEFAULT_MAP = 'iz_dun00';

const Maps = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMap = searchParams.get('map') ?? '';
  const [maps, setMaps] = useState<SpawnMapsIndex | null>(null);
  const [images, setImages] = useState<MapImagesIndex | null>(null);
  const [selectedMap, setSelectedMap] = useState(urlMap);
  const [spawns, setSpawns] = useState<SpawnPoint[] | null>(null);
  const [query, setQuery] = useState('');
  const [showInstances, setShowInstances] = useState(false);
  const [selectedMob, setSelectedMob] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectMap = useCallback((value: string, replace = false) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', 'maps');
      params.set('map', value);
      return params;
    }, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadSpawnMaps(), loadMapImages().catch(() => null)])
      .then(([mapIndex, imageIndex]) => {
        if (cancelled) return;
        setMaps(mapIndex);
        setImages(imageIndex);
        if (!urlMap) {
          const initial =
            mapIndex.maps.find((item) => item.map === DEFAULT_MAP) ??
            mapIndex.maps.find((item) => !item.instance && item.species > 0) ??
            mapIndex.maps[0];
          if (initial) {
            setSelectedMap(initial.map);
            selectMap(initial.map, true);
          }
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los mapas');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectMap, urlMap]);

  useEffect(() => {
    if (urlMap && urlMap !== selectedMap) {
      setSelectedMap(urlMap);
      setSelectedMob(null);
    }
  }, [selectedMap, urlMap]);

  useEffect(() => {
    if (!selectedMap) return;
    let cancelled = false;

    setLoading(true);
    setSpawns(null);
    setError(null);

    loadMapSpawns(selectedMap)
      .then((data) => {
        if (!cancelled) setSpawns(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setSpawns([]);
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los spawns');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMap]);

  const selectedMapInfo = useMemo(
    () => maps?.maps.find((item) => item.map === selectedMap) ?? null,
    [maps, selectedMap]
  );

  const mapOptions = useMemo(() => {
    if (!maps) return { world: [], instances: [] };
    const visible = maps.maps.filter(
      (item) => showInstances || !item.instance || item.map === selectedMap
    );
    const sorted = [...visible].sort((a, b) => a.mapName.localeCompare(b.mapName, 'es'));
    return {
      world: sorted.filter((item) => !item.instance),
      instances: sorted.filter((item) => item.instance)
    };
  }, [maps, showInstances, selectedMap]);

  const groups = useMemo<MobSpawnGroup[]>(() => {
    const term = query.trim().toLowerCase();
    const grouped = new Map<number, MobSpawnGroup>();

    for (const spawn of spawns ?? []) {
      if (term) {
        const haystack = `${spawn.mobName} ${spawn.mobAegis ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) continue;
      }
      const current = grouped.get(spawn.mobId);
      if (current) {
        current.amount += spawn.amount;
        current.points += 1;
        current.boss = current.boss || spawn.boss;
        current.instance = current.instance || spawn.instance;
        current.spawns.push(spawn);
      } else {
        grouped.set(spawn.mobId, {
          mobId: spawn.mobId,
          mobName: spawn.mobName,
          mobAegis: spawn.mobAegis,
          amount: spawn.amount,
          points: 1,
          boss: spawn.boss,
          instance: spawn.instance,
          spawns: [spawn]
        });
      }
    }

    return [...grouped.values()].sort((a, b) => b.amount - a.amount || a.mobName.localeCompare(b.mobName, 'es'));
  }, [spawns, query]);

  const filteredSpawns = useMemo(() => groups.flatMap((group) => group.spawns), [groups]);

  const visibleSpawns = useMemo(() => {
    if (selectedMob === null) return filteredSpawns;
    return filteredSpawns.filter((spawn) => spawn.mobId === selectedMob);
  }, [filteredSpawns, selectedMob]);

  const image = images?.maps[selectedMap] ?? null;
  const totalAmount = groups.reduce((sum, group) => sum + group.amount, 0);
  const totalPoints = groups.reduce((sum, group) => sum + group.points, 0);

  const handleMapChange = (value: string) => {
    setSelectedMob(null);
    setQuery('');
    setSelectedMap(value);
    selectMap(value);
  };

  const mapTags = (info: SpawnMapInfo) => (
    <>
      {info.boss && <span className="map-tag map-tag-boss">Boss</span>}
      {info.instance && <span className="map-tag map-tag-instance">Instancia</span>}
    </>
  );

  return (
    <section className="maps-panel">
      {!maps && !error && <div className="maps-loading">Cargando mapas...</div>}
      {error && <div className="maps-empty">{error}</div>}

      {maps && (
        <>
          <div className="maps-controls">
            <label className="maps-field maps-field-map">
              <span>Mapa</span>
              <select value={selectedMap} onChange={(event) => handleMapChange(event.target.value)}>
                {mapOptions.world.length > 0 && (
                  <optgroup label="Mundo">
                    {mapOptions.world.map((item) => (
                      <option key={item.map} value={item.map}>
                        {item.mapName} ({item.species})
                      </option>
                    ))}
                  </optgroup>
                )}
                {mapOptions.instances.length > 0 && (
                  <optgroup label="Instancias">
                    {mapOptions.instances.map((item) => (
                      <option key={item.map} value={item.map}>
                        {item.mapName} ({item.species})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            <label className="maps-field maps-field-search">
              <span>Buscar monstruo</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre del monstruo..."
              />
            </label>

            <label className="maps-check">
              <input
                type="checkbox"
                checked={showInstances}
                onChange={(event) => setShowInstances(event.target.checked)}
              />
              Mostrar instancias
            </label>
          </div>

          <div className="maps-layout">
            <div className="maps-viewer">
              <div className="maps-viewer-head">
                <div>
                  <h2>{selectedMapInfo?.mapName ?? selectedMap}</h2>
                  <p>
                    {groups.length.toLocaleString('es')} especies ·{' '}
                    {totalPoints.toLocaleString('es')} puntos ·{' '}
                    {totalAmount.toLocaleString('es')} mobs
                  </p>
                </div>
                <div className="maps-viewer-tags">
                  {selectedMapInfo && mapTags(selectedMapInfo)}
                </div>
              </div>

              <div
                className={`maps-canvas${selectedMob !== null ? ' is-filtered' : ''}`}
                style={image ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}
              >
                {image ? (
                  <img
                    className="maps-canvas-image"
                    src={`${image.image}`}
                    alt={`Mapa ${selectedMap}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="maps-canvas-fallback">
                    Vista del mapa no disponible
                  </div>
                )}

                {image &&
                  visibleSpawns
                    .filter((spawn) => spawn.x !== 0 || spawn.y !== 0)
                    .map((spawn, index) => (
                      <button
                        type="button"
                        key={`${spawn.mobId}-${spawn.x}-${spawn.y}-${index}`}
                        className={`maps-pin${spawn.boss ? ' is-boss' : ''}${spawn.instance ? ' is-instance' : ''}`}
                        style={{
                          left: `${(spawn.x / image.mapWidth) * 100}%`,
                          top: `${(1 - spawn.y / image.mapHeight) * 100}%`
                        }}
                        title={`${spawn.mobName} · ${spawn.amount} mobs · ${spawn.x}, ${spawn.y}`}
                        onClick={() => setSelectedMob(selectedMob === spawn.mobId ? null : spawn.mobId)}
                      />
                    ))}
              </div>

              <div className="maps-legend">
                <span><i className="legend-dot" /> Normal</span>
                <span><i className="legend-dot is-boss" /> Boss</span>
                <span><i className="legend-dot is-instance" /> Instancia</span>
                {visibleSpawns.some((spawn) => spawn.x === 0 && spawn.y === 0) && (
                  <span className="maps-random-note">Los spawns aleatorios se muestran en la lista.</span>
                )}
              </div>
            </div>

            <aside className="maps-sidebar">
              <div className="maps-sidebar-head">
                <h3>Monstruos</h3>
                {selectedMob !== null && (
                  <button type="button" onClick={() => setSelectedMob(null)}>
                    Ver todos
                  </button>
                )}
              </div>

              {loading && <div className="maps-loading">Cargando spawns...</div>}
              {!loading && groups.length === 0 && (
                <div className="maps-empty">No hay monstruos con esos filtros.</div>
              )}

              {!loading && groups.length > 0 && (
                <div className="maps-mob-list">
                  {groups.map((group) => (
                    <div
                      key={group.mobId}
                      role="button"
                      tabIndex={0}
                      className={`maps-mob${selectedMob === group.mobId ? ' is-selected' : ''}`}
                      onClick={() => setSelectedMob(selectedMob === group.mobId ? null : group.mobId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedMob(selectedMob === group.mobId ? null : group.mobId);
                        }
                      }}
                    >
                      <span className="maps-mob-name">
                        {group.mobName}
                        {group.boss && <span className="map-tag map-tag-boss">Boss</span>}
                        {group.instance && <span className="map-tag map-tag-instance">Instancia</span>}
                      </span>
                      <span className="maps-mob-meta">
                        {group.amount.toLocaleString('es')} mobs · {group.points} punto{group.points === 1 ? '' : 's'}
                      </span>
                      <Link
                        className="maps-mob-link"
                        to={`/database?tab=mobs&q=${group.mobId}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ver ficha
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default Maps;
