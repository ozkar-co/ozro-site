import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AtlasSprite from './AtlasSprite';
import { apiClient, type MvpEntry, type MvpRadarResponse, type MvpState } from '../api/client';
import { resolveSprite, type SpriteRect } from '../api/assets';
import { PLACEHOLDER_MOB_SPRITE } from '../api/placeholders';
import { mapDetailHref } from '../api/databaseMappers';
import '../styles/Mvps.css';

type LevelFilter = 'all' | 'low' | 'mid' | 'high' | 'elite' | 'end';
type SortMode = 'next' | 'level' | 'name' | 'respawn' | 'souls';
type SortDir = 'asc' | 'desc';

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
  all: { label: 'Todos', min: 0, max: Infinity },
  low: { label: '1–50', min: 1, max: 50 },
  mid: { label: '51–90', min: 51, max: 90 },
  high: { label: '91–120', min: 91, max: 120 },
  elite: { label: '121–160', min: 121, max: 160 },
  end: { label: '161+', min: 161, max: Infinity }
};

const SORT_OPTIONS: Record<SortMode, string> = {
  next: 'Próximo respawn',
  level: 'Nivel',
  name: 'Nombre',
  respawn: 'Respawn',
  souls: 'Cristales'
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
  const [soulFilter, setSoulFilter] = useState<number[]>([]);
  const [sort, setSort] = useState<SortMode>('next');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
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

  const soulOptions = useMemo(() => {
    const values = new Set<number>();
    for (const mvp of mvps) {
      if (Number.isFinite(mvp.souls)) values.add(mvp.souls);
    }
    return [...values].sort((a, b) => a - b);
  }, [mvps]);

  const filteredMvps = useMemo(() => {
    const term = query.trim().toLowerCase();
    const level = LEVEL_FILTERS[levelFilter];
    const soulSet = soulFilter.length > 0 ? new Set(soulFilter) : null;

    const filtered = mvps.filter((mvp) => {
      if (stateFilter !== 'all' && mvp.live.state !== stateFilter) return false;
      if (mvp.level < level.min || mvp.level > level.max) return false;
      if (soulSet && !soulSet.has(mvp.souls)) return false;
      if (!term) return true;
      return `${mvp.name} ${mvp.nameAegis} ${mvp.map}`.toLowerCase().includes(term);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sort === 'next') {
        const aNext = a.live.windowStart ?? Number.POSITIVE_INFINITY;
        const bNext = b.live.windowStart ?? Number.POSITIVE_INFINITY;
        cmp = aNext - bNext;
      } else if (sort === 'level') {
        cmp = a.level - b.level;
      } else if (sort === 'name') {
        cmp = a.name.localeCompare(b.name, 'es');
      } else if (sort === 'souls') {
        cmp = a.souls - b.souls;
      } else {
        cmp = a.respawnMinSeconds - b.respawnMinSeconds;
      }
      if (cmp !== 0) return cmp * dir;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [mvps, query, stateFilter, levelFilter, soulFilter, sort, sortDir]);

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

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <>
      {error && <div className="mvps-banner mvps-banner--error">{error}</div>}

      <div className="search-section">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar MVP por nombre o mapa..."
                className="search-input"
              />
              <button
                type="button"
                className="search-button"
                onClick={fetchData}
                disabled={loading}
              >
                {loading && !data ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
          </form>

          <div className="search-options-container">
            <button
              type="button"
              className="search-options-toggle"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <i className={`arrow-icon ${filtersOpen ? 'up' : 'down'}`} />
            </button>
            {filtersOpen && (
              <div className="search-options-panel">
                <div className="search-types">
                  <div className="search-types-title">Estado:</div>
                  <div className="search-types-grid">
                    {([
                      ['all', 'Todos'],
                      ['alive', 'Vivos'],
                      ['dead', 'Derrotados'],
                      ['probable', 'Probables'],
                      ['unknown', 'Sin registro']
                    ] as const).map(([value, label]) => (
                      <label key={value} className="type-checkbox">
                        <input
                          type="radio"
                          name="mvp-state"
                          checked={stateFilter === value}
                          onChange={() => setStateFilter(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="search-types">
                  <div className="search-types-title">Nivel:</div>
                  <div className="search-types-grid">
                    {(Object.keys(LEVEL_FILTERS) as LevelFilter[]).map((key) => (
                      <label key={key} className="type-checkbox">
                        <input
                          type="radio"
                          name="mvp-level"
                          checked={levelFilter === key}
                          onChange={() => setLevelFilter(key)}
                        />
                        {LEVEL_FILTERS[key].label}
                      </label>
                    ))}
                  </div>
                </div>
                {soulOptions.length > 0 && (
                  <div className="search-types">
                    <div className="search-types-title">Cristales:</div>
                    <div className="search-types-grid">
                      {soulOptions.map((value) => (
                        <label key={value} className="type-checkbox">
                          <input
                            type="checkbox"
                            checked={soulFilter.includes(value)}
                            onChange={() => setSoulFilter((prev) => (
                              prev.includes(value)
                                ? prev.filter((v) => v !== value)
                                : [...prev, value].sort((a, b) => a - b)
                            ))}
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="search-types">
                  <div className="search-types-title">Orden:</div>
                  <div className="search-types-grid">
                    {(Object.keys(SORT_OPTIONS) as SortMode[]).map((key) => (
                      <label key={key} className="type-checkbox">
                        <input
                          type="radio"
                          name="mvp-sort"
                          checked={sort === key}
                          onChange={() => setSort(key)}
                        />
                        {SORT_OPTIONS[key]}
                      </label>
                    ))}
                    <button
                      type="button"
                      className="mvps-sort-dir"
                      onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      title={sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
                    >
                      {sortDir === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                    </button>
                  </div>
                </div>
                <div className="mvps-filter-foot">
                  <span className="mvps-updated">
                    {updatedSeconds === null ? '—' : `Actualizado hace ${formatDuration(updatedSeconds)}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {data && data.recentKills.length > 0 && (
        <section className="mvps-recent" aria-label="Últimas cazas">
          <div className="result-card-script-header">Últimas cazas</div>
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

      <div className="results-section">
        {loading && !data && <div className="loading-results">Cargando MVPs…</div>}

        {data && filteredMvps.length === 0 && (
          <div className="no-results">No hay MVPs con esos filtros.</div>
        )}

        {data && filteredMvps.length > 0 && (
          <div className="results-grid">
            {filteredMvps.map((mvp) => {
              const meta = STATE_META[mvp.live.state];
              return (
                <article
                  key={mvp.id}
                  className={`result-card result-card--mvp state-${mvp.live.state}`}
                  onClick={() => setSelectedId(mvp.id)}
                >
                  <div className="result-card-content">
                    <div className="result-card-image result-card-image--mvp">
                      <AtlasSprite
                        sprite={sprites[mvp.mobId]}
                        alt={mvp.name}
                        fallback={PLACEHOLDER_MOB_SPRITE}
                        fit={{ maxWidth: 96, maxHeight: 96 }}
                      />
                      <div className="mvp-icon" aria-hidden="true">
                        <img src="/icons/mvp.gif" alt="" />
                      </div>
                    </div>
                    <div className="result-card-info">
                      <div className="result-card-header">
                        <h3>
                          <span className="name-title">{mvp.name}</span>
                          {' '}
                          <span className="result-card-id">#{mvp.mobId}</span>
                        </h3>
                        <span className={`mvp-state-badge state-${mvp.live.state}`}>{meta.label}</span>
                      </div>
                      <div className="result-card-meta">
                        <span>Nv. {mvp.level}</span>
                        <span className="mvp-souls" title={`${mvp.souls} Almas por kill`}>
                          <img src="/icons/mvp-soul.png" alt="" />
                          {mvp.souls}
                        </span>
                        <Link
                          to={mapDetailHref(mvp.map)}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {mvp.map}
                        </Link>
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
                            : `Respawn: ${formatRange(mvp.respawnMinSeconds, mvp.respawnMaxSeconds)}`}
                        </span>
                      </div>
                      <div className="mvp-card-footer">
                        <Link
                          to={`/database?tab=mobs&q=${mvp.mobId}&run=1`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ficha
                        </Link>
                        <Link
                          to={mapDetailHref(mvp.map)}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Mapa
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

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
              <span aria-hidden="true">×</span>
            </button>
            <div className="mvp-modal-body">
              <div className="mvp-modal-top">
                <div className="result-card-image result-card-image--mvp">
                  <AtlasSprite
                    sprite={sprites[selected.mobId]}
                    alt={selected.name}
                    fallback={PLACEHOLDER_MOB_SPRITE}
                    fit={{ maxWidth: 96, maxHeight: 96 }}
                  />
                  <div className="mvp-icon" aria-hidden="true">
                    <img src="/icons/mvp.gif" alt="" />
                  </div>
                </div>
                <div className="mvp-modal-title">
                  <h2>{selected.name}</h2>
                  <div className="mvp-modal-title-meta">
                    <span>Nv. {selected.level} · {selected.map}</span>
                    <span className={`mvp-state-badge state-${selected.live.state}`}>
                      {STATE_META[selected.live.state].label}
                    </span>
                  </div>
                </div>
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
                    : `Respawn: ${formatRange(selected.respawnMinSeconds, selected.respawnMaxSeconds)}`}
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
                  <span>Almas</span>
                  <strong className="mvp-souls">
                    <img src="/icons/mvp-soul.png" alt="" />
                    {selected.souls}
                  </strong>
                </div>
              </div>

              {selected.summons && selected.summons.length > 0 && (
                <div className="mvp-modal-summons">
                  <span>Invocaciones</span>
                  <ul>
                    {selected.summons.map((summon, index) => (
                      <li key={`${summon.mobId ?? 'x'}-${index}`}>
                        {summon.mobId != null ? (
                          <Link to={`/database?tab=mobs&q=${summon.mobId}&run=1`}>
                            {summon.mobName || summon.mobAegis || `#${summon.mobId}`}
                          </Link>
                        ) : (
                          <span>{summon.mobName || summon.mobAegis || '—'}</span>
                        )}
                        {summon.amount != null && summon.amount > 1 ? ` x${summon.amount}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.lastKill && (
                <div className="mvp-modal-last">
                  Último golpe: <strong>{selected.lastKill.killer ?? 'Cazador desconocido'}</strong> · hace{' '}
                  {formatDuration(selected.live.elapsed)}
                </div>
              )}

              <div className="mvp-modal-links">
                <Link to={`/database?tab=mobs&q=${selected.mobId}&run=1`}>Ver ficha</Link>
                <Link to={mapDetailHref(selected.map)}>Ver mapa</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Mvps;
