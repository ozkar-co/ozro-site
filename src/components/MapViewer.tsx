import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { MapDetail } from '../api/client';
import {
  loadMapImages,
  loadMapSpawns,
  type MapImageInfo,
  type SpawnPoint
} from '../api/mapData';
import { fetchFarmingMap, type FarmingMap } from '../api/farming';
import { loadWorldRoutes, type WorldRoute, type WorldRoutesIndex } from '../api/worldData';
import { loadNpcMap, npcDisplayName, type NpcEntry } from '../api/npcData';
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

interface MapViewerProps {
  map: MapDetail;
}

const numberFormat = new Intl.NumberFormat('es');

function formatZeny(value: number): string {
  return `${numberFormat.format(Math.round(value))} z`;
}

function parseArrival(value: string | null): { x: number; y: number } | null {
  if (!value) return null;
  const [x, y] = value.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

/** Big map canvas + spawn/NPC/warp lists. Header counts come from ozro_maps. */
const MapViewer = ({ map }: MapViewerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const arrival = parseArrival(searchParams.get('arrive'));
  const [image, setImage] = useState<MapImageInfo | null>(null);
  const [spawns, setSpawns] = useState<SpawnPoint[]>([]);
  const [npcs, setNpcs] = useState<NpcEntry[]>([]);
  const [worldRoutes, setWorldRoutes] = useState<WorldRoutesIndex | null>(null);
  const [farmingMap, setFarmingMap] = useState<FarmingMap | null>(null);
  const [query, setQuery] = useState('');
  const [showNpcs, setShowNpcs] = useState(true);
  const [showHiddenNpcs, setShowHiddenNpcs] = useState(false);
  const [showWarps, setShowWarps] = useState(true);
  const [selectedMob, setSelectedMob] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [farmingError, setFarmingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setFarmingError(null);
    setSelectedMob(null);
    setQuery('');
    setImage(null);
    setSpawns([]);
    setNpcs([]);
    setWorldRoutes(null);
    setFarmingMap(null);

    (async () => {
      try {
        const images = await loadMapImages();
        if (cancelled) return;
        const img = images.maps[map.id];
        if (!img) {
          throw new Error(`Sin imagen de mapa en assets para ${map.id}`);
        }
        setImage(img);

        const routes = await loadWorldRoutes();
        if (cancelled) return;
        setWorldRoutes(routes);

        if (map.spawnPoints > 0) {
          const spawnPoints = await loadMapSpawns(map.id);
          if (cancelled) return;
          setSpawns(spawnPoints);
        } else {
          setSpawns([]);
        }

        if (map.npcCount > 0) {
          const npcEntries = await loadNpcMap(map.id);
          if (cancelled) return;
          setNpcs(npcEntries);
        } else {
          setNpcs([]);
        }

        try {
          const farming = await fetchFarmingMap(map.id);
          if (!cancelled) setFarmingMap(farming);
        } catch (error) {
          if (!cancelled) {
            setFarmingMap(null);
            setFarmingError(error instanceof Error ? error.message : String(error));
          }
        }
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [map.id, map.spawnPoints, map.npcCount]);

  const goToWarp = (warp: WorldRoute) => {
    const hasArrival = Number.isFinite(warp.toX) && Number.isFinite(warp.toY);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', 'maps');
      params.set('q', warp.to);
      params.set('run', '1');
      if (hasArrival) params.set('arrive', `${warp.toX},${warp.toY}`);
      else params.delete('arrive');
      return params;
    });
  };

  const mapWarps = useMemo(
    () => (worldRoutes?.routes ?? []).filter((route) => route.kind === 'warp' && route.from === map.id),
    [worldRoutes, map.id]
  );

  const filteredWarps = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return mapWarps;
    return mapWarps.filter((warp) =>
      `${warp.name ?? ''} ${warp.to}`.toLowerCase().includes(term)
    );
  }, [mapWarps, query]);

  const groups = useMemo<MobSpawnGroup[]>(() => {
    const term = query.trim().toLowerCase();
    const grouped = new Map<number, MobSpawnGroup>();
    for (const spawn of spawns) {
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

  const visibleSpawns = useMemo(() => {
    const all = groups.flatMap((g) => g.spawns);
    if (selectedMob === null) return all;
    return all.filter((s) => s.mobId === selectedMob);
  }, [groups, selectedMob]);

  const filteredNpcs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return npcs
      .filter((npc) => {
        if (!showNpcs) return false;
        if (!showHiddenNpcs && !npc.visible) return false;
        if (npc.x === 0 && npc.y === 0) return false;
        if (!term) return true;
        return npcDisplayName(npc).toLowerCase().includes(term) || npc.name.toLowerCase().includes(term);
      })
      .sort((a, b) => npcDisplayName(a).localeCompare(npcDisplayName(b), 'es'));
  }, [npcs, query, showNpcs, showHiddenNpcs]);

  const farmingMobs = useMemo(
    () => new Map((farmingMap?.mobs ?? []).map((mob) => [mob.id, mob])),
    [farmingMap]
  );

  if (loadError) {
    return (
      <div className="map-viewer-embed">
        <div className="maps-empty" role="alert">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="map-viewer-embed">
      <div className="maps-detail-toolbar">
        <label className="maps-field maps-field-search">
          <span>Filtrar monstruo, NPC o warp</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre…"
          />
        </label>
        <label className="maps-check">
          <input type="checkbox" checked={showNpcs} onChange={(e) => setShowNpcs(e.target.checked)} />
          NPCs
        </label>
        {showNpcs && (
          <label className="maps-check">
            <input
              type="checkbox"
              checked={showHiddenNpcs}
              onChange={(e) => setShowHiddenNpcs(e.target.checked)}
            />
            Ocultos
          </label>
        )}
        <label className="maps-check">
          <input type="checkbox" checked={showWarps} onChange={(e) => setShowWarps(e.target.checked)} />
          Warps
        </label>
      </div>

      <div className="maps-layout">
        <div className="maps-viewer">
          <div className="maps-viewer-head">
            <div>
              <p>
                {numberFormat.format(map.spawnSpecies)} especies ·{' '}
                {numberFormat.format(map.spawnPoints)} puntos ·{' '}
                {numberFormat.format(map.spawnAmount)} mobs ·{' '}
                {numberFormat.format(map.npcCount)} NPCs
                {showWarps ? ` · ${filteredWarps.length} warps` : ''}
                {farmingMap ? ` · MZW ${formatZeny(farmingMap.weightedMzw)} · ${farmingMap.accessLabel}` : ''}
              </p>
              {farmingError && (
                <p className="maps-inline-error" role="status">Farmeo: {farmingError}</p>
              )}
            </div>
          </div>

          <div
            className={`maps-canvas${selectedMob !== null ? ' is-filtered' : ''}`}
            style={image ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}
          >
            {loading && <div className="maps-canvas-missing">Cargando mapa…</div>}
            {!loading && image && (
              <img className="maps-canvas-image" src={image.image} alt={`Mapa ${map.id}`} loading="lazy" />
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
                    title={`${spawn.mobName} · ${spawn.amount} · ${spawn.x}, ${spawn.y}`}
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
                    title={`Warp a ${warp.to}`}
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
                    top: `${(1 - npc.y / image.mapHeight) * 100}%`}
                  }
                  title={`${npcDisplayName(npc)} · ${npc.x}, ${npc.y}`}
                />
              ))}
          </div>

          <div className="maps-legend">
            <span><i className="legend-dot" /> Normal</span>
            <span><i className="legend-dot is-boss" /> Boss</span>
            <span><i className="legend-dot is-instance" /> Instancia</span>
            {showNpcs && <span><i className="legend-dot is-npc" /> NPC</span>}
            {showWarps && <span><i className="legend-dot is-warp" /> Warp</span>}
          </div>
        </div>

        <aside className="maps-sidebar">
          <div className="maps-sidebar-head">
            <h3>Monstruos</h3>
            {selectedMob !== null && (
              <button type="button" onClick={() => setSelectedMob(null)}>Ver todos</button>
            )}
          </div>
          {loading && <div className="maps-loading">Cargando spawns…</div>}
          {!loading && groups.length === 0 && (
            <div className="maps-empty">
              {map.spawnPoints === 0
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
                  </span>
                  <span className="maps-mob-meta">
                    {group.amount.toLocaleString('es')} mobs · {group.points} punto{group.points === 1 ? '' : 's'}
                    {farmingMobs.get(group.mobId)
                      ? ` · MZW ${formatZeny(farmingMobs.get(group.mobId)!.mzw)}`
                      : ''}
                  </span>
                  <Link
                    className="maps-mob-link"
                    to={`/database?tab=mobs&q=${group.mobId}&run=1`}
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
              <summary>NPCs ({filteredNpcs.length.toLocaleString('es')})</summary>
              {filteredNpcs.length === 0 ? (
                <div className="maps-empty">No hay NPCs con esos filtros.</div>
              ) : (
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
              {filteredWarps.length === 0 ? (
                <div className="maps-empty">No hay warps con esos filtros.</div>
              ) : (
                <div className="maps-npc-list">
                  {filteredWarps.map((warp, index) => (
                    <button
                      type="button"
                      key={`${warp.id ?? index}-${warp.to}`}
                      className="maps-warp-row"
                      onClick={() => goToWarp(warp)}
                    >
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
    </div>
  );
};

export default MapViewer;
