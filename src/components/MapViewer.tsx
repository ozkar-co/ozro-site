import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { MapConnection, MapDetail, MapNpcPoint, MapSpawnPoint } from '../api/client';
import {
  loadMapImages,
  resolveMapImageVariant,
  type MapImageInfo,
  type MapImageSource
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

function pinStyle(x: number, y: number, mapWidth: number, mapHeight: number) {
  return {
    left: `${(x / mapWidth) * 100}%`,
    top: `${(1 - y / mapHeight) * 100}%`
  };
}

const MapViewer = ({ map }: MapViewerProps) => {
  const [, setSearchParams] = useSearchParams();
  const [imageInfo, setImageInfo] = useState<MapImageInfo | null>(null);
  const [imageSource, setImageSource] = useState<MapImageSource>('minimap');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMobId, setSelectedMobId] = useState<number | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
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

    loadMapImages()
      .then((index) => {
        if (cancelled) return;
        const info = index.maps[map.id];
        if (!info) {
          throw new Error(`Sin imagen de mapa en assets para ${map.id}`);
        }
        setImageInfo(info);
        const preferred = (info.defaultSource === 'walkable' ? 'walkable' : 'minimap') as MapImageSource;
        // Prefer walkable for interiors when both exist — coords usually match better.
        if (map.isInterior && info.walkable) {
          setImageSource('walkable');
        } else if (info.minimap) {
          setImageSource('minimap');
        } else {
          setImageSource(preferred);
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
  }, [map.id, map.isInterior]);

  const mobGroups = useMemo<MobGroup[]>(() => {
    const grouped = new Map<number, MobGroup>();
    for (const spawn of spawns) {
      if (spawn.mobId == null) continue;
      const current = grouped.get(spawn.mobId);
      if (current) {
        current.amount += spawn.amount;
        current.points.push(spawn);
        current.boss = current.boss || spawn.boss;
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

  const activeVariant = useMemo(() => {
    if (!imageInfo) return null;
    return resolveMapImageVariant(imageInfo, imageSource);
  }, [imageInfo, imageSource]);

  const canToggle = Boolean(imageInfo?.minimap && imageInfo?.walkable);

  const goToWarp = (warp: MapConnection) => {
    if (!warp.to) return;
    const hasArrival = warp.toX != null && warp.toY != null;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', 'maps');
      params.set('q', warp.to!);
      params.set('run', '1');
      if (hasArrival) params.set('arrive', `${warp.toX},${warp.toY}`);
      else params.delete('arrive');
      return params;
    });
  };

  const visibleNpcs = useMemo(
    () => npcs.filter((npc) => npc.x != null && npc.y != null && !(npc.x === 0 && npc.y === 0)),
    [npcs]
  );

  const selectMob = (mobId: number | null) => {
    setSelectedNpcId(null);
    setSelectedMobId((prev) => (prev === mobId ? null : mobId));
  };

  const selectNpc = (npcId: string | null) => {
    setSelectedMobId(null);
    setSelectedNpcId((prev) => (prev === npcId ? null : npcId));
  };

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
        {canToggle && (
          <div className="maps-source-toggle" role="group" aria-label="Tipo de imagen">
            <button
              type="button"
              className={imageSource === 'minimap' ? 'is-active' : ''}
              onClick={() => setImageSource('minimap')}
            >
              Minimap
            </button>
            <button
              type="button"
              className={imageSource === 'walkable' ? 'is-active' : ''}
              onClick={() => setImageSource('walkable')}
            >
              Esquemático
            </button>
          </div>
        )}
        {!canToggle && imageInfo?.source && (
          <span className="maps-source-label">
            {imageInfo.source === 'walkable' ? 'Esquemático' : 'Minimap'}
          </span>
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
                        spawn.boss ? 'is-boss' : '',
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
            <span><i className="legend-dot is-npc" /> NPC</span>
            <span><i className="legend-dot is-warp" /> Warp</span>
            <span className="maps-source-hint">
              Vista: {activeVariant?.source === 'walkable' ? 'esquemático' : 'minimap'}
            </span>
          </div>
        </div>

        <aside className="maps-sidebar">
          {mobGroups.length > 0 && (
            <>
              <div className="maps-sidebar-head">
                <h3>Monstruos ({mobGroups.length})</h3>
                {selectedMobId != null && (
                  <button type="button" onClick={() => selectMob(null)}>Quitar marca</button>
                )}
              </div>
              <div className="maps-entity-list">
                {mobGroups.map((group) => {
                  const respawn = formatRespawn(group.respawnMin, group.respawnMax, group.respawnUnit);
                  return (
                    <button
                      type="button"
                      key={group.mobId}
                      className={`maps-entity-card${selectedMobId === group.mobId ? ' is-selected' : ''}`}
                      onClick={() => selectMob(group.mobId)}
                    >
                      <AtlasSprite
                        sprite={mobSprites[group.mobId] ?? PLACEHOLDER_MOB_SPRITE}
                        alt={group.name}
                        className="maps-entity-sprite"
                        scale={1}
                      />
                      <span className="maps-entity-body">
                        <span className="maps-entity-title">
                          {group.name}
                          {group.boss && <span className="map-tag map-tag-boss">Boss</span>}
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
            </>
          )}

          {visibleNpcs.length > 0 && (
            <>
              <div className="maps-sidebar-head">
                <h3>NPCs ({visibleNpcs.length})</h3>
                {selectedNpcId != null && (
                  <button type="button" onClick={() => selectNpc(null)}>Quitar marca</button>
                )}
              </div>
              <div className="maps-entity-list">
                {visibleNpcs.map((npc: MapNpcPoint) => (
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
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {mobGroups.length === 0 && visibleNpcs.length === 0 && (
            <div className="maps-empty">Sin monstruos ni NPCs en este mapa.</div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MapViewer;
