import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  loadMapImages,
  loadMapSpawns,
  loadSpawnMaps,
  type MapImagesIndex,
  type SpawnMapsIndex,
  type SpawnPoint
} from '../api/mapData';
import { fetchFarmingMap, type FarmingMap } from '../api/farming';
import { loadWorldRoutes, type WorldRoute, type WorldRoutesIndex } from '../api/worldData';
import {
  loadNpcMap,
  loadNpcMaps,
  npcDisplayName,
  type NpcEntry,
  type NpcMapsIndex
} from '../api/npcData';
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

interface MapCatalogEntry {
  map: string;
  mapName: string;
  species: number;
  amount: number;
  boss: boolean;
  instance: boolean;
  hasSpawns: boolean;
  hasImage: boolean;
  npcTotal: number;
  npcVisible: number;
}

const DEFAULT_MAP = 'prontera';
const numberFormat = new Intl.NumberFormat('es');

function isInstanceMap(map: string): boolean {
  return /^(?:\d+@|@)/.test(map);
}

function buildMapCatalog(
  spawnMaps: SpawnMapsIndex | null,
  images: MapImagesIndex | null,
  npcMaps: NpcMapsIndex | null
): MapCatalogEntry[] {
  const spawnByName = new Map((spawnMaps?.maps ?? []).map((item) => [item.map, item]));
  const npcByName = new Map((npcMaps?.maps ?? []).map((item) => [item.map, item]));
  const names = new Set<string>([
    ...Object.keys(images?.maps ?? {}),
    ...spawnByName.keys(),
    ...npcByName.keys()
  ]);

  return [...names]
    .map((map) => {
      const spawn = spawnByName.get(map);
      const npc = npcByName.get(map);
      return {
        map,
        mapName: spawn?.mapName || npc?.mapName || map,
        species: spawn?.species ?? 0,
        amount: spawn?.amount ?? 0,
        boss: spawn?.boss ?? false,
        instance: spawn?.instance ?? npc?.instance ?? isInstanceMap(map),
        hasSpawns: Boolean(spawn),
        hasImage: Boolean(images?.maps[map]),
        npcTotal: npc?.total ?? 0,
        npcVisible: npc?.visible ?? 0
      };
    })
    .sort((a, b) => a.mapName.localeCompare(b.mapName, 'es') || a.map.localeCompare(b.map));
}

function formatZeny(value: number): string {
  return `${numberFormat.format(Math.round(value))} z`;
}

function parseArrival(value: string | null): { x: number; y: number } | null {
  if (!value) return null;
  const [x, y] = value.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

const Maps = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMap = searchParams.get('map') ?? '';
  const arrival = parseArrival(searchParams.get('arrive'));
  const [maps, setMaps] = useState<SpawnMapsIndex | null>(null);
  const [images, setImages] = useState<MapImagesIndex | null>(null);
  const [npcMaps, setNpcMaps] = useState<NpcMapsIndex | null>(null);
  const [worldRoutes, setWorldRoutes] = useState<WorldRoutesIndex | null>(null);
  const [selectedMap, setSelectedMap] = useState(urlMap);
  const [spawns, setSpawns] = useState<SpawnPoint[] | null>(null);
  const [npcs, setNpcs] = useState<NpcEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [showInstances, setShowInstances] = useState(false);
  const [showNpcs, setShowNpcs] = useState(true);
  const [showHiddenNpcs, setShowHiddenNpcs] = useState(false);
  const [showWarps, setShowWarps] = useState(true);
  const [selectedMob, setSelectedMob] = useState<number | null>(null);
  const [farmingMap, setFarmingMap] = useState<FarmingMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingNpcs, setLoadingNpcs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectMap = useCallback((value: string, replace = false) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('map', value);
      params.delete('arrive');
      return params;
    }, { replace });
  }, [setSearchParams]);

  const goToWarp = useCallback((warp: WorldRoute) => {
    const hasArrival = Number.isFinite(warp.toX) && Number.isFinite(warp.toY);
    setSelectedMob(null);
    setQuery('');
    setSelectedMap(warp.to);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', 'maps');
      params.set('map', warp.to);
      if (hasArrival) {
        params.set('arrive', `${warp.toX},${warp.toY}`);
      } else {
        params.delete('arrive');
      }
      return params;
    });
  }, [setSearchParams]);

  const selectMapRef = useRef(selectMap);
  selectMapRef.current = selectMap;
  const initialUrlMapRef = useRef(urlMap);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadSpawnMaps().catch(() => null),
      loadMapImages().catch(() => null),
      loadNpcMaps().catch(() => null),
      loadWorldRoutes().catch(() => null)
    ])
      .then(([mapIndex, imageIndex, npcIndex, routeIndex]) => {
        if (cancelled) return;
        if (!mapIndex && !imageIndex && !npcIndex) {
          throw new Error('No se pudieron cargar los mapas');
        }
        setMaps(mapIndex);
        setImages(imageIndex);
        setNpcMaps(npcIndex);
        setWorldRoutes(routeIndex);
        if (!initialUrlMapRef.current) {
          const catalog = buildMapCatalog(mapIndex, imageIndex, npcIndex);
          const initial =
            catalog.find((item) => item.map === DEFAULT_MAP) ??
            catalog.find((item) => !item.instance && item.species > 0) ??
            catalog.find((item) => !item.instance) ??
            catalog[0];
          if (initial) {
            setSelectedMap(initial.map);
            selectMapRef.current(initial.map, true);
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
  }, []);

  useEffect(() => {
    if (urlMap && urlMap !== selectedMap) {
      setSelectedMap(urlMap);
      setSelectedMob(null);
    }
  }, [selectedMap, urlMap]);

  const spawnMapSet = useMemo(
    () => new Set((maps?.maps ?? []).map((item) => item.map)),
    [maps]
  );
  const npcMapSet = useMemo(
    () => new Set((npcMaps?.maps ?? []).map((item) => item.map)),
    [npcMaps]
  );
  const mapCatalog = useMemo(
    () => buildMapCatalog(maps, images, npcMaps),
    [maps, images, npcMaps]
  );
  const mapNames = useMemo(
    () => new Map(mapCatalog.map((item) => [item.map, item.mapName])),
    [mapCatalog]
  );
  const mapWarps = useMemo(
    () => (worldRoutes?.routes ?? []).filter((route) => route.kind === 'warp' && route.from === selectedMap),
    [worldRoutes, selectedMap]
  );
  const filteredWarps = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return mapWarps;
    return mapWarps.filter((warp) => {
      const destination = mapNames.get(warp.to) ?? warp.to;
      return `${warp.name ?? ''} ${warp.to} ${destination}`.toLowerCase().includes(term);
    });
  }, [mapWarps, query, mapNames]);

  useEffect(() => {
    if (!selectedMap) return;
    let cancelled = false;

    setFarmingMap(null);
    fetchFarmingMap(selectedMap)
      .then((data) => {
        if (!cancelled) setFarmingMap(data);
      })
      .catch(() => {
        if (!cancelled) setFarmingMap(null);
      });

    setSpawns(null);
    setError(null);
    setLoading(spawnMapSet.has(selectedMap));

    if (spawnMapSet.has(selectedMap)) {
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
    } else {
      setSpawns([]);
    }

    setNpcs(null);
    setLoadingNpcs(npcMapSet.has(selectedMap));

    if (npcMapSet.has(selectedMap)) {
      loadNpcMap(selectedMap)
        .then((data) => {
          if (!cancelled) setNpcs(data);
        })
        .catch(() => {
          if (!cancelled) setNpcs([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingNpcs(false);
        });
    } else {
      setNpcs([]);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedMap, spawnMapSet, npcMapSet]);

  const selectedMapInfo = useMemo(
    () => mapCatalog.find((item) => item.map === selectedMap) ?? null,
    [mapCatalog, selectedMap]
  );

  const mapOptions = useMemo(() => {
    const visible = mapCatalog.filter(
      (item) => showInstances || !item.instance || item.map === selectedMap
    );
    return {
      world: visible.filter((item) => !item.instance),
      instances: visible.filter((item) => item.instance)
    };
  }, [mapCatalog, showInstances, selectedMap]);

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

  const filteredNpcs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (npcs ?? [])
      .filter((npc) => {
        if (showNpcs === false) return false;
        if (!showHiddenNpcs && !npc.visible) return false;
        if (npc.x === 0 && npc.y === 0) return false;
        if (!term) return true;
        return npcDisplayName(npc).toLowerCase().includes(term) || npc.name.toLowerCase().includes(term);
      })
      .sort((a, b) => npcDisplayName(a).localeCompare(npcDisplayName(b), 'es'));
  }, [npcs, query, showNpcs, showHiddenNpcs]);

  const image = images?.maps[selectedMap] ?? null;
  const totalAmount = groups.reduce((sum, group) => sum + group.amount, 0);
  const totalPoints = groups.reduce((sum, group) => sum + group.points, 0);
  const farmingMobs = useMemo(
    () => new Map((farmingMap?.mobs ?? []).map((mob) => [mob.id, mob])),
    [farmingMap]
  );

  const handleMapChange = (value: string) => {
    setSelectedMob(null);
    setQuery('');
    setSelectedMap(value);
    selectMap(value);
  };

  const mapTags = (info: MapCatalogEntry) => (
    <>
      {info.boss && <span className="map-tag map-tag-boss">Boss</span>}
      {info.instance && <span className="map-tag map-tag-instance">Instancia</span>}
    </>
  );

  return (
    <section className="maps-panel">
      {mapCatalog.length === 0 && !error && <div className="maps-loading">Cargando mapas...</div>}
      {error && <div className="maps-empty">{error}</div>}

      {mapCatalog.length > 0 && (
        <>
          <div className="maps-controls">
            <label className="maps-field maps-field-map">
              <span>Mapa</span>
              <select value={selectedMap} onChange={(event) => handleMapChange(event.target.value)}>
                {mapOptions.world.length > 0 && (
                  <optgroup label="Mundo">
                    {mapOptions.world.map((item) => (
                      <option key={item.map} value={item.map}>
                        {item.mapName}
                        {item.species > 0 ? ` · ${item.species} mobs` : ''}
                        {item.npcVisible > 0 ? ` · ${item.npcVisible} NPCs` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {mapOptions.instances.length > 0 && (
                  <optgroup label="Instancias">
                    {mapOptions.instances.map((item) => (
                      <option key={item.map} value={item.map}>
                        {item.mapName}
                        {item.species > 0 ? ` · ${item.species} mobs` : ''}
                        {item.npcVisible > 0 ? ` · ${item.npcVisible} NPCs` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            <label className="maps-field maps-field-search">
              <span>Buscar monstruo, NPC o warp</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre del monstruo, NPC o destino del warp..."
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

            <label className="maps-check">
              <input
                type="checkbox"
                checked={showNpcs}
                onChange={(event) => setShowNpcs(event.target.checked)}
              />
              Mostrar NPCs
            </label>

            {showNpcs && (
              <label className="maps-check">
                <input
                  type="checkbox"
                  checked={showHiddenNpcs}
                  onChange={(event) => setShowHiddenNpcs(event.target.checked)}
                />
                Incluir NPCs ocultos
              </label>
            )}

            <label className="maps-check">
              <input
                type="checkbox"
                checked={showWarps}
                onChange={(event) => setShowWarps(event.target.checked)}
              />
              Mostrar warps
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
                    {` · ${filteredNpcs.length.toLocaleString('es')} NPCs`}
                    {showWarps ? ` · ${filteredWarps.length.toLocaleString('es')} warps` : ''}
                    {farmingMap ? ` · MZW ${formatZeny(farmingMap.weightedMzw)} · ${farmingMap.accessLabel}` : ''}
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

                {image &&
                  showWarps &&
                  filteredWarps
                    .filter((warp) => warp.fromX != null && warp.fromY != null)
                    .map((warp, index) => (
                      <button
                        type="button"
                        key={`warp-${warp.id ?? index}-${warp.to}`}
                        className="maps-pin is-warp"
                        style={{
                          left: `${((warp.fromX ?? 0) / image.mapWidth) * 100}%`,
                          top: `${(1 - (warp.fromY ?? 0) / image.mapHeight) * 100}%`
                        }}
                        title={`Warp a ${mapNames.get(warp.to) ?? warp.to} · ${warp.fromX}, ${warp.fromY}`}
                        onClick={() => goToWarp(warp)}
                      />
                    ))}

                {image && arrival && (
                  <span
                    className="maps-arrival"
                    style={{
                      left: `${(arrival.x / image.mapWidth) * 100}%`,
                      top: `${(1 - arrival.y / image.mapHeight) * 100}%`
                    }}
                    title={`Punto de llegada · ${arrival.x}, ${arrival.y}`}
                  >
                    <span className="maps-arrival-label">Llegada</span>
                  </span>
                )}

                {image &&
                  filteredNpcs.map((npc) => (
                    <button
                      type="button"
                      key={npc.id}
                      className={`maps-pin is-npc${npc.visible ? '' : ' is-hidden'}${npc.function === 'quest' ? ' is-quest' : ''}`}
                      style={{
                        left: `${(npc.x / image.mapWidth) * 100}%`,
                        top: `${(1 - npc.y / image.mapHeight) * 100}%`
                      }}
                      title={`${npcDisplayName(npc)} · ${npc.function} · ${npc.x}, ${npc.y}`}
                    />
                  ))}
              </div>

              <div className="maps-legend">
                <span><i className="legend-dot" /> Normal</span>
                <span><i className="legend-dot is-boss" /> Boss</span>
                <span><i className="legend-dot is-instance" /> Instancia</span>
                {showNpcs && <span><i className="legend-dot is-npc" /> NPC</span>}
                {showNpcs && showHiddenNpcs && <span><i className="legend-dot is-npc-hidden" /> NPC oculto</span>}
                {showWarps && <span><i className="legend-dot is-warp" /> Warp</span>}
                {arrival && <span><i className="legend-dot is-arrival" /> Llegada</span>}
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
                <div className="maps-empty">
                  {selectedMapInfo && !selectedMapInfo.hasSpawns
                    ? 'No hay spawns registrados en este mapa.'
                    : 'No hay monstruos con esos filtros.'}
                </div>
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
                        {farmingMobs.get(group.mobId)
                          ? ` · MZW ${formatZeny(farmingMobs.get(group.mobId)!.mzw)}`
                          : ''}
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

              {showNpcs && (
                <details className="maps-npcs">
                  <summary>
                    NPCs ({filteredNpcs.length.toLocaleString('es')})
                    {loadingNpcs ? ' · cargando...' : ''}
                  </summary>
                  {!loadingNpcs && filteredNpcs.length === 0 && (
                    <div className="maps-empty">No hay NPCs con esos filtros.</div>
                  )}
                  {!loadingNpcs && filteredNpcs.length > 0 && (
                    <div className="maps-npc-list">
                      {filteredNpcs.map((npc) => (
                        <div key={npc.id} className="maps-npc-row">
                          <span>{npcDisplayName(npc)}</span>
                          <span>{npc.function}</span>
                          <span>{npc.x}, {npc.y}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              )}

              {showWarps && (
                <details className="maps-npcs">
                  <summary>Warps ({filteredWarps.length.toLocaleString('es')})</summary>
                  {filteredWarps.length === 0 && (
                    <div className="maps-empty">No hay warps con esos filtros.</div>
                  )}
                  {filteredWarps.length > 0 && (
                    <div className="maps-npc-list">
                      {filteredWarps.map((warp, index) => (
                        <button
                          type="button"
                          key={`${warp.id ?? index}-${warp.to}`}
                          className="maps-warp-row"
                          onClick={() => goToWarp(warp)}
                          title={warp.name ?? undefined}
                        >
                          <span>{mapNames.get(warp.to) ?? warp.to}</span>
                          <span>{warp.to}</span>
                          <span>{warp.toX ?? '—'}, {warp.toY ?? '—'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </details>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default Maps;
