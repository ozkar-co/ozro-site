import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { MapConnection, MapDetail, MapNpcPoint, MapSpawnPoint } from '../api/client';
import {
  loadMapImages,
  resolveMapImageVariant,
  type MapImageInfo
} from '../api/mapData';
import { resolveSprite, type SpriteRect } from '../api/assets';
import { PLACEHOLDER_MOB_SPRITE } from '../api/placeholders';
import { formatFilterLabel } from '../api/databaseMappers';
import AtlasSprite from './AtlasSprite';
import '../styles/Maps.css';

interface MapViewerProps {
  map: MapDetail;
}

interface MobGroup {
  mobId: number;
  name: string;
  level: number | null;
  hp: number | null;
  amount: number;
  boss: boolean;
  mvp: boolean;
  respawnMin: number | null;
  respawnMax: number | null;
  respawnUnit: string | null;
  points: MapSpawnPoint[];
  sprite: SpriteRect | string | null;
}

const numberFormat = new Intl.NumberFormat('es');

function formatRespawn(min: number | null, max: number | null, unit: string | null): string | null {
  if (min == null && max == null) return null;
  const u = unit && unit !== 'ms' ? ` ${unit}` : ' ms';
  if (min != null && max != null && min !== max) {
    return `${numberFormat.format(min)}–${numberFormat.format(max)}${u}`;
  }
  const value = min ?? max;
  return value != null ? `${numberFormat.format(value)}${u}` : null;
}

function parseArrival(value: string | null): { x: number; y: number } | null {
  if (!value) return null;
  const [x, y] = value.split(',').map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function pinStyle(x: number, y: number, mapWidth: number, mapHeight: number) {
  return {
    left: `${(x / mapWidth) * 100}%`,
    top: `${(1 - y / mapHeight) * 100}%`
  };
}

const MapViewer = ({ map }: MapViewerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const arrival = parseArrival(searchParams.get('arrive'));
  // Deep-link focus only — selection while browsing stays in local state (like mobs).
  const focusNpcId = searchParams.get('npc')?.trim() || null;
  const [imageInfo, setImageInfo] = useState<MapImageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMobId, setSelectedMobId] = useState<number | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [mobsOpen, setMobsOpen] = useState(true);
  const [npcsOpen, setNpcsOpen] = useState(true);
  const [mobSprites, setMobSprites] = useState<Record<number, SpriteRect | string>>({});

  const spawns = map.spawns ?? [];
  const npcs = map.npcs ?? [];
  const warps = useMemo(
    () => (map.connections ?? []).filter(
      (c) => c.fromX != null && c.fromY != null && c.to
    ),
    [map.connections]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSelectedMobId(null);
    setSelectedNpcId(null);
    setImageInfo(null);

    const initialNpcId = focusNpcId
      && (map.npcs ?? []).some((npc) => npc.id === focusNpcId)
      ? focusNpcId
      : null;

    loadMapImages()
      .then((index) => {
        if (cancelled) return;
        const info = index.maps[map.id];
        if (!info) {
          throw new Error(`Sin imagen de mapa en assets para ${map.id}`);
        }
        setImageInfo(info);
        setMinimapOpen(false);
        if (initialNpcId) {
          setSelectedNpcId(initialNpcId);
          setNpcsOpen(true);
          setMobsOpen(false);
        } else {
          setMobsOpen(true);
          setNpcsOpen(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // focusNpcId read once per map load; same-map npc switches use the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [map.id]);

  // Deep link ?npc= while already on this map (data key unchanged → no remount).
  useEffect(() => {
    if (!focusNpcId) return;
    if (!(map.npcs ?? []).some((npc) => npc.id === focusNpcId)) return;
    setSelectedMobId(null);
    setSelectedNpcId(focusNpcId);
    setNpcsOpen(true);
    setMobsOpen(false);
    // map.npcs read from current render; identity changes must not re-fire this.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [focusNpcId, map.id]);

  const mobGroups = useMemo<MobGroup[]>(() => {
    const grouped = new Map<number, MobGroup>();
    for (const spawn of spawns) {
      if (spawn.mobId == null) continue;
      const current = grouped.get(spawn.mobId);
      if (current) {
        current.amount += spawn.amount;
        current.points.push(spawn);
        current.boss = current.boss || spawn.boss;
        current.mvp = current.mvp || spawn.mvp;
        if (current.respawnMin == null) current.respawnMin = spawn.respawnMin;
        if (current.respawnMax == null) current.respawnMax = spawn.respawnMax;
        if (!current.respawnUnit) current.respawnUnit = spawn.respawnUnit;
      } else {
        grouped.set(spawn.mobId, {
          mobId: spawn.mobId,
          name: spawn.mobName || `Mob #${spawn.mobId}`,
          level: spawn.level,
          hp: spawn.hp,
          amount: spawn.amount,
          boss: spawn.boss,
          mvp: spawn.mvp,
          respawnMin: spawn.respawnMin,
          respawnMax: spawn.respawnMax,
          respawnUnit: spawn.respawnUnit,
          points: [spawn],
          sprite: null
        });
      }
    }
    return [...grouped.values()].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'es'));
  }, [spawns]);

  useEffect(() => {
    let cancelled = false;
    const ids = mobGroups.map((g) => g.mobId);
    if (ids.length === 0) {
      setMobSprites({});
      return;
    }
    Promise.all(
      ids.map(async (id) => {
        const sprite = await resolveSprite(id, 'mobs/sprites');
        return [id, sprite ?? PLACEHOLDER_MOB_SPRITE] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      setMobSprites(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [mobGroups]);

  // Canvas always uses schematic when available (coordinate-accurate).
  const activeVariant = useMemo(() => {
    if (!imageInfo) return null;
    return resolveMapImageVariant(imageInfo, 'walkable');
  }, [imageInfo]);

  const minimapVariant = imageInfo?.minimap ?? null;

  const goToWarp = (warp: MapConnection) => {
    if (!warp.to) return;
    const hasArrival = warp.toX != null && warp.toY != null;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', 'maps');
      params.set('map', warp.to!);
      params.delete('q');
      params.delete('run');
      params.delete('npc');
      if (hasArrival) params.set('arrive', `${warp.toX},${warp.toY}`);
      else params.delete('arrive');
      return params;
    });
  };

  const visibleNpcs = useMemo(
    () => npcs.filter((npc) => npc.x != null && npc.y != null && !(npc.x === 0 && npc.y === 0)),
    [npcs]
  );

  const clearSelection = () => {
    setSelectedMobId(null);
    setSelectedNpcId(null);
    setMobsOpen(true);
    setNpcsOpen(true);
  };

  const selectMob = (mobId: number | null) => {
    if (mobId == null || selectedMobId === mobId) {
      clearSelection();
      return;
    }
    setSelectedNpcId(null);
    setSelectedMobId(mobId);
    setMobsOpen(true);
    setNpcsOpen(false);
  };

  const selectNpc = (npcId: string | null) => {
    if (npcId == null || selectedNpcId === npcId) {
      clearSelection();
      return;
    }
    setSelectedMobId(null);
    setSelectedNpcId(npcId);
    setNpcsOpen(true);
    setMobsOpen(false);
  };

  const listedMobs = selectedMobId != null
    ? mobGroups.filter((g) => g.mobId === selectedMobId)
    : mobGroups;
  const listedNpcs = selectedNpcId != null
    ? visibleNpcs.filter((n) => n.id === selectedNpcId)
    : visibleNpcs;
  const showMobsSection = mobGroups.length > 0 && (selectedNpcId == null);
  const showNpcsSection = visibleNpcs.length > 0 && (selectedMobId == null);

  if (loadError) {
    return (
      <div className="map-viewer-embed">
        <div className="maps-empty" role="alert">{loadError}</div>
      </div>
    );
  }

  const mapW = imageInfo?.mapWidth ?? map.width ?? 1;
  const mapH = imageInfo?.mapHeight ?? map.height ?? 1;
  const filtered = selectedMobId != null || selectedNpcId != null;

  return (
    <div className="map-viewer-embed">
      <div className="maps-detail-toolbar">
        <div className="maps-viewer-stats">
          {numberFormat.format(map.spawnSpecies)} especies ·{' '}
          {numberFormat.format(map.spawnAmount)} mobs ·{' '}
          {numberFormat.format(map.npcCount)} NPCs ·{' '}
          {numberFormat.format(warps.length)} warps
        </div>
        {minimapVariant && (
          <button
            type="button"
            className="maps-minimap-button"
            onClick={() => setMinimapOpen(true)}
          >
            Ver minimap
          </button>
        )}
      </div>

      <div className="maps-layout">
        <div className="maps-viewer">
          <div
            className={`maps-canvas${filtered ? ' is-filtered' : ''}`}
            style={activeVariant ? { aspectRatio: `${activeVariant.variant.width} / ${activeVariant.variant.height}` } : undefined}
          >
            {loading && <div className="maps-canvas-missing">Cargando mapa…</div>}
            {!loading && activeVariant && (
              <img
                className="maps-canvas-image"
                src={activeVariant.variant.image}
                alt={`Mapa ${map.id} (${activeVariant.source})`}
                loading="lazy"
              />
            )}

            {activeVariant &&
              spawns
                .filter((spawn) => spawn.x != null && spawn.y != null && !(spawn.x === 0 && spawn.y === 0))
                .map((spawn) => {
                  const active = selectedMobId != null && spawn.mobId === selectedMobId;
                  return (
                    <button
                      type="button"
                      key={spawn.id}
                      className={[
                        'maps-pin',
                        spawn.mvp ? 'is-mvp' : '',
                        !spawn.mvp && spawn.boss ? 'is-boss' : '',
                        active ? 'is-active' : '',
                        selectedMobId != null && !active ? 'is-dimmed' : ''
                      ].filter(Boolean).join(' ')}
                      style={pinStyle(spawn.x!, spawn.y!, mapW, mapH)}
                      title={`${spawn.mobName} · ×${spawn.amount} · ${spawn.x}, ${spawn.y}`}
                      onClick={() => spawn.mobId != null && selectMob(spawn.mobId)}
                    />
                  );
                })}

            {activeVariant &&
              warps.map((warp) => (
                <button
                  type="button"
                  key={warp.id}
                  className="maps-pin is-warp"
                  style={pinStyle(warp.fromX!, warp.fromY!, mapW, mapH)}
                  title={`Warp → ${warp.to}${warp.warpName ? ` (${warp.warpName})` : ''}`}
                  onClick={() => goToWarp(warp)}
                />
              ))}

            {activeVariant && arrival && !selectedNpcId && (
              <span
                className="maps-arrival"
                style={pinStyle(arrival.x, arrival.y, mapW, mapH)}
                title={`Punto de llegada · ${arrival.x}, ${arrival.y}`}
              >
                <span className="maps-arrival-label">Llegada</span>
              </span>
            )}

            {activeVariant &&
              visibleNpcs.map((npc) => {
                const active = selectedNpcId === npc.id;
                return (
                  <button
                    type="button"
                    key={npc.id}
                    className={[
                      'maps-pin',
                      'is-npc',
                      active ? 'is-active' : '',
                      selectedNpcId != null && !active ? 'is-dimmed' : ''
                    ].filter(Boolean).join(' ')}
                    style={pinStyle(npc.x!, npc.y!, mapW, mapH)}
                    title={`${npc.name}${npc.type ? ` · ${npc.type}` : ''} · ${npc.x}, ${npc.y}`}
                    onClick={() => selectNpc(npc.id)}
                  />
                );
              })}
          </div>

          <div className="maps-legend">
            <span><i className="legend-dot" /> Mob</span>
            <span><i className="legend-dot is-boss" /> Boss</span>
            <span><i className="legend-dot is-mvp" /> MVP</span>
            <span><i className="legend-dot is-npc" /> NPC</span>
            <span><i className="legend-dot is-warp" /> Warp</span>
            {arrival && <span><i className="legend-dot is-arrival" /> Llegada</span>}
          </div>
        </div>

        <aside className="maps-sidebar">
          {(selectedMobId != null || selectedNpcId != null) && (
            <button type="button" className="maps-clear-selection" onClick={clearSelection}>
              Ver todos
            </button>
          )}

          {showMobsSection && (
            <details
              className="maps-side-section"
              open={mobsOpen}
              onToggle={(event) => setMobsOpen((event.target as HTMLDetailsElement).open)}
            >
              <summary>
                Monstruos ({selectedMobId != null ? listedMobs.length : mobGroups.length}
                {selectedMobId == null ? '' : ` / ${mobGroups.length}`})
              </summary>
              <div className="maps-entity-list">
                {listedMobs.map((group) => {
                  const respawn = formatRespawn(group.respawnMin, group.respawnMax, group.respawnUnit);
                  return (
                    <button
                      type="button"
                      key={group.mobId}
                      className={`maps-entity-card${selectedMobId === group.mobId ? ' is-selected' : ''}`}
                      onClick={() => selectMob(group.mobId)}
                    >
                      <span className="maps-entity-sprite">
                        <AtlasSprite
                          sprite={mobSprites[group.mobId] ?? PLACEHOLDER_MOB_SPRITE}
                          alt={group.name}
                          fit={{ maxWidth: 40, maxHeight: 40 }}
                        />
                      </span>
                      <span className="maps-entity-body">
                        <span className="maps-entity-title">
                          {group.name}
                          {group.mvp && <span className="map-tag map-tag-mvp">MVP</span>}
                          {!group.mvp && group.boss && <span className="map-tag map-tag-boss">Boss</span>}
                        </span>
                        <span className="maps-entity-meta">
                          {group.level != null && <span>Lv {group.level}</span>}
                          {group.hp != null && <span>HP {numberFormat.format(group.hp)}</span>}
                          <span>×{numberFormat.format(group.amount)}</span>
                          {respawn && <span>{respawn}</span>}
                        </span>
                        <Link
                          className="maps-mob-link"
                          to={`/database?tab=mobs&q=${group.mobId}&run=1`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ver ficha
                        </Link>
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          )}

          {showNpcsSection && (
            <details
              className="maps-side-section"
              open={npcsOpen}
              onToggle={(event) => setNpcsOpen((event.target as HTMLDetailsElement).open)}
            >
              <summary>
                NPCs ({selectedNpcId != null ? listedNpcs.length : visibleNpcs.length}
                {selectedNpcId == null ? '' : ` / ${visibleNpcs.length}`})
              </summary>
              <div className="maps-entity-list">
                {listedNpcs.map((npc: MapNpcPoint) => (
                  <button
                    type="button"
                    key={npc.id}
                    className={`maps-entity-card maps-entity-card--npc${selectedNpcId === npc.id ? ' is-selected' : ''}`}
                    onClick={() => selectNpc(npc.id)}
                  >
                    <span className="maps-entity-body">
                      <span className="maps-entity-title">{npc.name}</span>
                      <span className="maps-entity-meta">
                        {npc.type && <span>{formatFilterLabel(npc.type)}</span>}
                        <span>{npc.x}, {npc.y}</span>
                      </span>
                      <Link
                        className="maps-mob-link"
                        to={`/database?tab=npcs&q=${encodeURIComponent(npc.id)}&run=1`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ver ficha
                      </Link>
                    </span>
                  </button>
                ))}
              </div>
            </details>
          )}

          {mobGroups.length === 0 && visibleNpcs.length === 0 && (
            <div className="maps-empty">Sin monstruos ni NPCs en este mapa.</div>
          )}
        </aside>
      </div>

      {minimapOpen && minimapVariant && (
        <div
          className="item-desc-modal-backdrop"
          role="presentation"
          onClick={() => setMinimapOpen(false)}
        >
          <div
            className="item-desc-modal maps-minimap-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Minimap ${map.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-desc-modal-head">
              <div>
                <h4>Minimap</h4>
                <p className="item-desc-modal-subtitle">{map.name} ({map.id})</p>
              </div>
              <button
                type="button"
                className="item-desc-modal-close"
                onClick={() => setMinimapOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="maps-minimap-modal-body">
              <img
                src={minimapVariant.image}
                alt={`Minimap ${map.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapViewer;
