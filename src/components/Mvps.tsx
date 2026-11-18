import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AtlasSprite from './AtlasSprite';
import { apiClient, type MvpEntry, type MvpRadarResponse, type MvpState } from '../api/client';
import { resolveSprite, type SpriteRect } from '../api/assets';
import { PLACEHOLDER_MOB_SPRITE } from '../api/placeholders';
import '../styles/Mvps.css';

type LevelFilter = 'all' | 'low' | 'mid' | 'high' | 'elite' | 'end';
type SortMode = 'next' | 'level' | 'name' | 'respawn';

interface LiveMvp extends MvpEntry {
  live: {
    state: MvpState;
    probabilityAlive: number | null;
    windowStart: number | null;
    windowEnd: number | null;
    elapsed: number;
  };
}

const STATE_META: Record<MvpState, { label: string; className: string }> = {
  alive: { label: 'Vivo', className: 'alive' },
  dead: { label: 'Derrotado', className: 'dead' },
  probable: { label: 'Probable', className: 'probable' },
  unknown: { label: 'Sin registro', className: 'unknown' }
};

const LEVEL_FILTERS: Record<LevelFilter, { label: string; min: number; max: number }> = {
  all: { label: 'Todos los niveles', min: 0, max: Infinity },
  low: { label: '1 – 50', min: 1, max: 50 },
  mid: { label: '51 – 90', min: 51, max: 90 },
  high: { label: '91 – 120', min: 91, max: 120 },
  elite: { label: '121 – 160', min: 121, max: 160 },
  end: { label: '161+', min: 161, max: Infinity }
};

const SORT_OPTIONS: Record<SortMode, string> = {
  next: 'Próximo respawn',
  level: 'Nivel',
  name: 'Nombre',
  respawn: 'Respawn más corto'
};

function formatDuration(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  return `${secs}s`;
}

function formatClock(epoch: number | null): string {
  if (!epoch) return '—';
  return new Date(epoch * 1000).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRange(minSeconds: number, maxSeconds: number): string {
  const min = formatDuration(minSeconds);
  if (maxSeconds <= minSeconds) return min;
  return `${min} – ${formatDuration(maxSeconds)}`;
}

function computeLiveState(mvp: MvpEntry, now: number, yellowWindowSeconds: number): LiveMvp['live'] {
  if (!mvp.lastKill) {
    return {
      state: 'unknown',
      probabilityAlive: null,
      windowStart: null,
      windowEnd: null,
      elapsed: 0
    };
  }

  const elapsed = Math.max(0, now - mvp.lastKill.at);
  const minSeconds = Math.max(1, mvp.respawnMinSeconds);
  const yellowSeconds = Math.max(mvp.delay2 / 1000, yellowWindowSeconds);
  const windowStart = mvp.lastKill.at + minSeconds;
  const windowEnd = windowStart + yellowSeconds;

  if (elapsed < minSeconds) {
    return {
      state: 'dead',
      probabilityAlive: 0,
      windowStart,
      windowEnd,
      elapsed
    };
  }

  if (elapsed < minSeconds + yellowSeconds) {
    const span = mvp.delay2 > 0 ? mvp.delay2 / 1000 : yellowSeconds;
    return {
      state: 'probable',
      probabilityAlive: Math.min(0.99, Math.max(0.01, (elapsed - minSeconds) / span)),
      windowStart,
      windowEnd,
      elapsed
    };
  }

  return {
    state: 'alive',
    probabilityAlive: null,
    windowStart: null,
    windowEnd: null,
    elapsed
  };
}

const Mvps = () => {
  const [data, setData] = useState<MvpRadarResponse | null>(null);
  const [sprites, setSprites] = useState<Record<number, SpriteRect | string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);
  const [serverOffset, setServerOffset] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | MvpState>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [sort, setSort] = useState<SortMode>('next');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const spritesLoaded = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.mvpRadar();
      setData(response);
      setServerOffset(response.serverTime - Math.floor(Date.now() / 1000));
      setLastFetchedAt(Date.now());
      setError(null);

      if (!spritesLoaded.current) {
        spritesLoaded.current = true;
        const entries = await Promise.all(
          response.mvps.map(async (mvp) => {
            const sprite = await resolveSprite(String(mvp.mobId), 'mobs/sprites');
            return [mvp.mobId, sprite ?? PLACEHOLDER_MOB_SPRITE] as const;
          })
        );
        setSprites(Object.fromEntries(entries));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el radar de MVPs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = window.setInterval(() => {
      if (!document.hidden) fetchData();
    }, 30000);
    const onVisibilityChange = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchData]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedId]);

  const serverNow = Math.floor(nowMs / 1000) + serverOffset;
  const yellowWindowSeconds = data?.yellowWindowSeconds ?? 1200;

  const mvps = useMemo<LiveMvp[]>(() => {
    if (!data) return [];
    return data.mvps.map((mvp) => ({
      ...mvp,
      live: computeLiveState(mvp, serverNow, yellowWindowSeconds)
    }));
  }, [data, serverNow, yellowWindowSeconds]);

  const filteredMvps = useMemo(() => {
    const term = query.trim().toLowerCase();
    const level = LEVEL_FILTERS[levelFilter];

    const filtered = mvps.filter((mvp) => {
      if (stateFilter !== 'all' && mvp.live.state !== stateFilter) return false;
      if (mvp.level < level.min || mvp.level > level.max) return false;
      if (!term) return true;
      return `${mvp.name} ${mvp.nameAegis} ${mvp.map}`.toLowerCase().includes(term);
    });

    return filtered.sort((a, b) => {
      if (sort === 'next') {
        const aNext = a.live.windowStart ?? Number.POSITIVE_INFINITY;
        const bNext = b.live.windowStart ?? Number.POSITIVE_INFINITY;
        return aNext - bNext || b.level - a.level || a.name.localeCompare(b.name, 'es');
      }
      if (sort === 'level') {
        return b.level - a.level || a.name.localeCompare(b.name, 'es');
      }
      if (sort === 'name') {
        return a.name.localeCompare(b.name, 'es');
      }
      return a.respawnMinSeconds - b.respawnMinSeconds || b.level - a.level || a.name.localeCompare(b.name, 'es');
    });
  }, [mvps, query, stateFilter, levelFilter, sort]);

  const mobNames = useMemo(() => new Map(mvps.map((mvp) => [mvp.mobId, mvp.name])), [mvps]);
  const selected = selectedId ? mvps.find((mvp) => mvp.id === selectedId) ?? null : null;
  const updatedSeconds = lastFetchedAt > 0 ? Math.max(0, Math.floor((nowMs - lastFetchedAt) / 1000)) : null;

  const stateText = (mvp: LiveMvp) => {
    if (mvp.live.state === 'dead') {
      return `Vuelve en ${formatDuration((mvp.live.windowStart ?? serverNow) - serverNow)}`;
    }
    if (mvp.live.state === 'probable') {
      return `Probabilidad ${Math.round((mvp.live.probabilityAlive ?? 0) * 100)}%`;
    }
    if (mvp.live.state === 'alive') {
      return mvp.lastKill
        ? `Última muerte hace ${formatDuration(mvp.live.elapsed)}`
        : 'Sin muertes recientes';
    }
    return 'Sin muertes registradas';
  };

  const mapImage = (map: string) => `/assets/maps/images/${map}.webp`;

  return (
    <>
      {error && <div className="mvps-error">{error}</div>}

          {data && data.recentKills.length > 0 && (
            <section className="mvps-recent" aria-label="Últimas cazas">
              <h2>Últimas cazas</h2>
              <div className="mvps-recent-list">
                {data.recentKills.map((kill) => (
                  <div key={`${kill.mobId}-${kill.map}-${kill.at}`} className="mvps-recent-item">
                    <strong>{mobNames.get(kill.mobId) ?? `MVP ${kill.mobId}`}</strong>
                    <span>{kill.map}</span>
                    <span>{kill.killer ?? 'Cazador desconocido'}</span>
                    <em>hace {formatDuration(kill.secondsAgo)}</em>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mvps-toolbar" aria-label="Filtros de MVPs">
            <label className="mvps-search">
              <span>Buscar</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="MVP o mapa..."
              />
            </label>
            <label>
              <span>Estado</span>
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as 'all' | MvpState)}>
                <option value="all">Todos</option>
                <option value="alive">Vivos</option>
                <option value="dead">Derrotados</option>
                <option value="probable">Probables</option>
                <option value="unknown">Sin registro</option>
              </select>
            </label>
            <label>
              <span>Nivel</span>
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}>
                {(Object.keys(LEVEL_FILTERS) as LevelFilter[]).map((key) => (
                  <option key={key} value={key}>{LEVEL_FILTERS[key].label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Ordenar</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                {(Object.keys(SORT_OPTIONS) as SortMode[]).map((key) => (
                  <option key={key} value={key}>{SORT_OPTIONS[key]}</option>
                ))}
              </select>
            </label>
            <button type="button" className="mvps-refresh" onClick={fetchData} disabled={loading}>
              Actualizar
            </button>
            <span className="mvps-updated">
              {updatedSeconds === null ? '—' : `hace ${formatDuration(updatedSeconds)}`}
            </span>
          </section>

          {loading && !data && <div className="mvps-loading">Cargando radar...</div>}

          {data && filteredMvps.length === 0 && (
            <div className="mvps-empty">No hay MVPs con esos filtros.</div>
          )}

          {data && filteredMvps.length > 0 && (
            <div className="mvps-grid">
              {filteredMvps.map((mvp) => {
                const meta = STATE_META[mvp.live.state];
                return (
                  <article
                    key={mvp.id}
                    className={`mvp-card state-${mvp.live.state}`}
                    onClick={() => setSelectedId(mvp.id)}
                  >
                    <div className="mvp-card-map" aria-hidden="true">
                      <img
                        src={mapImage(mvp.map)}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="mvp-card-content">
                      <div className="mvp-card-head">
                        <div className="mvp-card-sprite">
                          <AtlasSprite sprite={sprites[mvp.mobId]} alt={mvp.name} className="mvp-sprite-img" />
                        </div>
                        <div className="mvp-card-title">
                          <h2>{mvp.name}</h2>
                          <div className="mvp-card-meta">
                            <span className="mvp-level">Nv. {mvp.level}</span>
                            <span className="mvp-souls" title={`${mvp.souls} Almas por kill`}>
                              <img src="/icons/mvp-soul.png" alt="" />
                              {mvp.souls}
                            </span>
                            <Link
                              to={`/database?tab=maps&map=${encodeURIComponent(mvp.map)}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {mvp.map}
                            </Link>
                          </div>
                        </div>
                        <span className={`mvp-state-badge state-${mvp.live.state}`}>{meta.label}</span>
                      </div>

                      <div className="mvp-card-status">
                        <strong>{stateText(mvp)}</strong>
                        {mvp.live.state === 'probable' && (
                          <div className="mvps-probability">
                            <span style={{ width: `${Math.round((mvp.live.probabilityAlive ?? 0) * 100)}%` }} />
                          </div>
                        )}
                        <span className="mvp-card-window">
                          {mvp.live.state === 'dead' || mvp.live.state === 'probable'
                            ? `Ventana: ${formatClock(mvp.live.windowStart)} – ${formatClock(mvp.live.windowEnd)}`
                            : `Respawn base: ${formatRange(mvp.respawnMinSeconds, mvp.respawnMaxSeconds)}`}
                        </span>
                      </div>

                      <div className="mvp-card-footer">
                        <Link
                          to={`/database?tab=mobs&q=${mvp.mobId}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ficha
                        </Link>
                        <Link
                          to={`/database?tab=maps&map=${encodeURIComponent(mvp.map)}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ver mapa
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

      {selected && (
        <div className="mvp-modal-backdrop" onClick={() => setSelectedId(null)}>
          <div
            className={`mvp-modal state-${selected.live.state}`}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="mvp-modal-close" onClick={() => setSelectedId(null)} aria-label="Cerrar">
              ×
            </button>
            <div className="mvp-modal-hero">
              <div className="mvp-modal-map" aria-hidden="true">
                <img
                  src={mapImage(selected.map)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="mvp-modal-sprite">
                <AtlasSprite sprite={sprites[selected.mobId]} alt={selected.name} className="mvp-modal-sprite-img" />
              </div>
            </div>
            <div className="mvp-modal-body">
              <div className="mvp-modal-title">
                <div>
                  <h2>{selected.name}</h2>
                  <span>Nv. {selected.level} · {selected.map}</span>
                </div>
                <span className={`mvp-state-badge state-${selected.live.state}`}>
                  {STATE_META[selected.live.state].label}
                </span>
              </div>

              <div className="mvp-modal-status">
                <strong>{stateText(selected)}</strong>
                {selected.live.state === 'probable' && (
                  <div className="mvps-probability">
                    <span style={{ width: `${Math.round((selected.live.probabilityAlive ?? 0) * 100)}%` }} />
                  </div>
                )}
                <span>
                  {selected.live.state === 'dead' || selected.live.state === 'probable'
                    ? `Ventana: ${formatClock(selected.live.windowStart)} – ${formatClock(selected.live.windowEnd)}`
                    : `Respawn base: ${formatRange(selected.respawnMinSeconds, selected.respawnMaxSeconds)}`}
                </span>
              </div>

              <div className="mvp-modal-stats">
                <div><span>HP</span><strong>{selected.hp.toLocaleString('es')}</strong></div>
                <div><span>Elemento</span><strong>{selected.element} {selected.elementLevel}</strong></div>
                <div><span>Raza</span><strong>{selected.race}</strong></div>
                <div><span>Tamaño</span><strong>{selected.size}</strong></div>
                <div><span>EXP base</span><strong>{selected.baseExp.toLocaleString('es')}</strong></div>
                <div><span>EXP job</span><strong>{selected.jobExp.toLocaleString('es')}</strong></div>
                <div>
                  <span>Almas por kill</span>
                  <strong className="mvp-souls">
                    <img src="/icons/mvp-soul.png" alt="" />
                    {selected.souls}
                  </strong>
                </div>
              </div>

              {selected.lastKill && (
                <div className="mvp-modal-last">
                  Último golpe: <strong>{selected.lastKill.killer ?? 'Cazador desconocido'}</strong> · hace{' '}
                  {formatDuration(selected.live.elapsed)}
                </div>
              )}

              <div className="mvp-modal-links">
                <Link to={`/database?tab=mobs&q=${selected.mobId}`}>Ver ficha del MVP</Link>
                <Link to={`/database?tab=maps&map=${encodeURIComponent(selected.map)}`}>Ver mapa</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Mvps;
