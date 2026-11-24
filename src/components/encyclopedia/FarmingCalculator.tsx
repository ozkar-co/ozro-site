import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchFarmingMaps,
  fetchFarmingMob,
  fetchFarmingMobs,
  type FarmingDrop,
  type FarmingMap,
  type FarmingMob
} from '../../api/farming';
import '../../styles/Farming.css';

type Mode = 'mobs' | 'maps';
type SortMode =
  | 'mzw'
  | 'zenyPerHp'
  | 'level'
  | 'name'
  | 'spawnAmount'
  | 'dropCount'
  | 'access'
  | 'totalAmount';

const numberFormat = new Intl.NumberFormat('es');

function formatZeny(value: number): string {
  return `${numberFormat.format(Math.round(value))} z`;
}

function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatZenyPerHp(value: number): string {
  return value.toFixed(3);
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms <= 0) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return `${minutes}m ${rest}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function accessClass(depth: number | null): string {
  if (depth === null) return 'farm-access is-unknown';
  if (depth === 0) return 'farm-access is-hub';
  if (depth === 1) return 'farm-access is-close';
  if (depth === 2) return 'farm-access is-mid';
  if (depth === 3) return 'farm-access is-far';
  return 'farm-access is-deep';
}

function DropTable({ drops, title }: { drops: FarmingDrop[]; title?: string }) {
  return (
    <div className="farm-drops">
      {title && <div className="farm-subtitle">{title}</div>}
      <table className="farm-drop-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Tipo</th>
            <th>Drop</th>
            <th>Valor unitario</th>
            <th>Valor esperado</th>
          </tr>
        </thead>
        <tbody>
          {drops.map((drop, index) => (
            <tr key={`${drop.id}-${drop.type}-${index}`}>
              <td>
                <Link to={`/database?tab=items&q=${drop.id}`}>{drop.name}</Link>
              </td>
              <td>{drop.type === 'mvp' ? 'MVP' : 'Normal'}</td>
              <td>{formatPercent(drop.chancePercent)}</td>
              <td>
                {formatZeny(drop.sell)}
                {drop.valueSource && <span className="farm-muted"> {drop.valueSource}</span>}
              </td>
              <td>{formatZeny(drop.expected)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobDetail({
  mob,
  onClose
}: {
  mob: FarmingMob | null;
  onClose?: () => void;
}) {
  if (!mob) return null;
  return (
    <div className="farm-detail">
      <div className="farm-detail-head">
        <div>
          <h3>{mob.name}</h3>
          <p>
            #{mob.id} · Nivel {mob.level} · {formatNumber(mob.hp)} HP · {mob.nameAegis}
          </p>
        </div>
        {onClose && (
          <button type="button" className="farm-close" onClick={onClose} aria-label="Cerrar detalle">
            ×
          </button>
        )}
      </div>

      <div className="farm-detail-metrics">
        <div>
          <span>MZW</span>
          <strong>{formatZeny(mob.mzw)}</strong>
        </div>
        <div>
          <span>Zeny/HP</span>
          <strong>{formatZenyPerHp(mob.zenyPerHp)}</strong>
        </div>
        <div>
          <span>Penalización</span>
          <strong>{mob.penaltyRate}%</strong>
        </div>
        <div>
          <span>Drops</span>
          <strong>{mob.dropCount}</strong>
        </div>
      </div>

      {mob.penaltyRate !== 100 && (
        <p className="farm-note">
          Valor ajustado por diferencia de nivel. Los drops MVP no reciben esta penalización.
        </p>
      )}

      <div className="farm-breakdown">
        <span>Normal: {formatZeny(mob.mzwNormal * (mob.penaltyRate / 100))}</span>
        <span>MVP: {formatZeny(mob.mzwMvp)}</span>
        <span>Base sin penalización: {formatZeny(mob.mzwBase)}</span>
      </div>

      <DropTable drops={mob.drops} title="Todos los drops" />

      <div className="farm-subtitle">Spawns</div>
      {mob.spawnMaps.length === 0 ? (
        <p className="farm-note">Sin spawns registrados.</p>
      ) : (
        <div className="farm-spawn-list">
          {mob.spawnMaps.map((spawn) => (
            <div key={`${spawn.map}-${spawn.instance}`} className="farm-spawn-row">
              <Link to={`/database?tab=maps&q=${encodeURIComponent(spawn.map)}&run=1`}>{spawn.map}</Link>
              <span className={accessClass(spawn.accessDepth)}>{spawn.accessLabel}</span>
              <span>{formatNumber(spawn.amount)} mobs</span>
              <span>{formatDuration(spawn.respawnMs)} respawn</span>
              {spawn.instance && <span className="farm-tag">Instancia</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const FarmingCalculator = () => {
  const [mode, setMode] = useState<Mode>('mobs');
  const [query, setQuery] = useState('');
  const [levelMin, setLevelMin] = useState('');
  const [levelMax, setLevelMax] = useState('');
  const [minMzw, setMinMzw] = useState('');
  const [minZenyPerHp, setMinZenyPerHp] = useState('');
  const [includeInstances, setIncludeInstances] = useState(false);
  const [hideMvp, setHideMvp] = useState(false);
  const [hideLowSpawn, setHideLowSpawn] = useState(false);
  const [useLevelAdjust, setUseLevelAdjust] = useState(false);
  const [playerLevel, setPlayerLevel] = useState('99');
  const [accessMax, setAccessMax] = useState('');
  const [sort, setSort] = useState<SortMode>('mzw');
  const [page, setPage] = useState(0);
  const [mobs, setMobs] = useState<FarmingMob[]>([]);
  const [maps, setMaps] = useState<FarmingMap[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMob, setSelectedMob] = useState<FarmingMob | null>(null);
  const [selectedMap, setSelectedMap] = useState<FarmingMap | null>(null);
  const [mapMobDetail, setMapMobDetail] = useState<FarmingMob | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const level = useLevelAdjust && playerLevel.trim() !== '' ? Number(playerLevel) : null;

  useEffect(() => {
    setPage(0);
    setSelectedMob(null);
    setSelectedMap(null);
    setMapMobDetail(null);
  }, [mode, query, levelMin, levelMax, minMzw, minZenyPerHp, includeInstances, hideMvp, hideLowSpawn, useLevelAdjust, playerLevel, accessMax]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = {
        q: query,
        levelMin,
        levelMax,
        minMzw,
        level: level ?? undefined,
        penalty: useLevelAdjust && level !== null ? true : undefined,
        mvp: hideMvp ? false : undefined,
        minSpawnAmount: hideLowSpawn ? 10 : undefined,
        page: page + 1,
        limit
      };

      const request = mode === 'mobs'
        ? fetchFarmingMobs({
            ...params,
            minZenyPerHp,
            hasSpawn: true,
            includeInstances: includeInstances ? true : undefined,
            sort
          })
        : fetchFarmingMaps({
            ...params,
            accessMax: accessMax || undefined,
            sort
          });

      request
        .then((data) => {
          if (cancelled) return;
          setTotal(data.total);
          setLimit(data.limit);
          if (mode === 'mobs') {
            setMobs(data.results as FarmingMob[]);
            setMaps([]);
          } else {
            setMaps(data.results as FarmingMap[]);
            setMobs([]);
          }
        })
        .catch((loadError: unknown) => {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los datos');
            setMobs([]);
            setMaps([]);
            setTotal(0);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, query, levelMin, levelMax, minMzw, minZenyPerHp, includeInstances, hideMvp, hideLowSpawn, useLevelAdjust, level, sort, page, limit, accessMax, retryToken]);


  useEffect(() => {
    if (!selectedMob && !selectedMap) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMob(null);
        setSelectedMap(null);
        setMapMobDetail(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedMob, selectedMap]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const sortOptions = useMemo<[SortMode, string][]>(() => {
    if (mode === 'mobs') {
      return [
        ['mzw', 'MZW'],
        ['zenyPerHp', 'Zeny/HP'],
        ['level', 'Nivel'],
        ['name', 'Nombre'],
        ['spawnAmount', 'Cantidad de spawn'],
        ['dropCount', 'Cantidad de drops']
      ];
    }
    return [
      ['mzw', 'MZW del mapa'],
      ['zenyPerHp', 'Zeny/HP'],
      ['level', 'Nivel máximo'],
      ['name', 'Nombre'],
      ['access', 'Accesibilidad'],
      ['totalAmount', 'Spawn total']
    ];
  }, [mode]);

  const openMapMob = async (mobId: number) => {
    try {
      const data = await fetchFarmingMob(mobId, {
        level: level ?? undefined,
        penalty: useLevelAdjust && level !== null ? true : undefined
      });
      setMapMobDetail(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el monstruo');
    }
  };

  return (
    <section className="farm-panel">
      <div className="farm-intro">
        <h2>Calculadora de farmeo</h2>
        <p>
          Valor de venta esperado por kill, usando todos los drops y los rates del servidor.
          Usa el precio de Garrett si el item está en su mesa; si no, el precio de compra NPC del master de mercado.
          Los items sin precio se ignoran y los mobs con MZW menor a 10 no se listan.
          Los mapas de evento e instancia se ocultan.
          En mapas, el MZW es un promedio ponderado por cantidad de spawn.
          {' '}
          <Link to="/encyclopedia?tab=worldmap">Ver mapa del mundo</Link>
        </p>
      </div>

      <div className="farm-controls">
        <div className="farm-mode">
          <button
            type="button"
            className={mode === 'mobs' ? 'active' : ''}
            onClick={() => {
              setMode('mobs');
              setSort('mzw');
            }}
          >
            Por mob
          </button>
          <button
            type="button"
            className={mode === 'maps' ? 'active' : ''}
            onClick={() => {
              setMode('maps');
              setSort('mzw');
            }}
          >
            Por mapa
          </button>
        </div>

        <label className="farm-field farm-field-search">
          <span>Buscar</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={mode === 'mobs' ? 'Mob, item o Aegis...' : 'Mapa o mob...'}
          />
        </label>

        <label className="farm-field">
          <span>Nivel mín.</span>
          <input type="number" min="1" value={levelMin} onChange={(event) => setLevelMin(event.target.value)} />
        </label>
        <label className="farm-field">
          <span>Nivel máx.</span>
          <input type="number" min="1" value={levelMax} onChange={(event) => setLevelMax(event.target.value)} />
        </label>
        <label className="farm-field">
          <span>MZW mín.</span>
          <input type="number" min="0" value={minMzw} onChange={(event) => setMinMzw(event.target.value)} />
        </label>

        {mode === 'mobs' && (
          <label className="farm-field">
            <span>Zeny/HP mín.</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minZenyPerHp}
              onChange={(event) => setMinZenyPerHp(event.target.value)}
            />
          </label>
        )}

        <label className="farm-field">
          <span>Ordenar por</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            {sortOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        {mode === 'mobs' && (
          <label className="farm-check">
            <input
              type="checkbox"
              checked={includeInstances}
              onChange={(event) => setIncludeInstances(event.target.checked)}
            />
            Incluir instancias
          </label>
        )}

        <label className="farm-check">
          <input
            type="checkbox"
            checked={hideMvp}
            onChange={(event) => setHideMvp(event.target.checked)}
          />
          Ocultar MVP
        </label>

        <label className="farm-check">
          <input
            type="checkbox"
            checked={hideLowSpawn}
            onChange={(event) => setHideLowSpawn(event.target.checked)}
          />
          Ocultar &lt;10 spawn
        </label>

        {mode === 'maps' && (
          <label className="farm-field">
            <span>Acceso máximo</span>
            <select value={accessMax} onChange={(event) => setAccessMax(event.target.value)}>
              <option value="">Cualquiera</option>
              <option value="0">Hub</option>
              <option value="1">Acceso directo</option>
              <option value="2">2 saltos</option>
              <option value="3">3 saltos</option>
              <option value="99">4+ saltos</option>
            </select>
          </label>
        )}

        <div className="farm-level-adjust">
          <label className="farm-check">
            <input
              type="checkbox"
              checked={useLevelAdjust}
              onChange={(event) => setUseLevelAdjust(event.target.checked)}
            />
            Ajustar por nivel
          </label>
          <input
            type="number"
            min="1"
            max="275"
            value={playerLevel}
            onChange={(event) => setPlayerLevel(event.target.value)}
            disabled={!useLevelAdjust}
            aria-label="Nivel del personaje"
          />
        </div>
      </div>

      <div className="farm-summary">
        <span>{formatNumber(total)} resultados</span>
        <span>Valor de venta bruto, sin costos</span>
        {useLevelAdjust && level !== null && <span>Ajustado a nivel {level}</span>}
      </div>

      {error && (
        <div className="farm-error">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryToken((value) => value + 1)}>Reintentar</button>
        </div>
      )}

      <div className="farm-table-wrap">
          {loading && <div className="farm-loading">Calculando...</div>}
          {!loading && mode === 'mobs' && (
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Mob</th>
                  <th>Nivel</th>
                  <th>HP</th>
                  <th>MZW</th>
                  <th>Zeny/HP</th>
                  <th>Drops</th>
                  <th>Spawn</th>
                  <th>Acceso</th>
                </tr>
              </thead>
              <tbody>
                {mobs.map((mob) => (
                  <tr
                    key={mob.id}
                    className={selectedMob?.id === mob.id ? 'selected' : ''}
                    onClick={() => setSelectedMob(mob)}
                  >
                    <td>
                      <strong>{mob.name}</strong>
                      <span className="farm-muted">#{mob.id} · {mob.nameAegis}</span>
                    </td>
                    <td>{mob.level}</td>
                    <td>{formatNumber(mob.hp)}</td>
                    <td>{formatZeny(mob.mzw)}</td>
                    <td>{formatZenyPerHp(mob.zenyPerHp)}</td>
                    <td>{mob.dropCount}</td>
                    <td title={`${mob.spawnMapCount} mapas`}>
                      {formatNumber(mob.spawnAmount)}
                      <span className="farm-muted">{mob.spawnMapCount} mapas</span>
                    </td>
                    <td><span className={accessClass(mob.accessDepth)}>{mob.accessLabel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && mode === 'maps' && (
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Mapa</th>
                  <th>Mobs</th>
                  <th>Nivel</th>
                  <th>Spawn total</th>
                  <th>MZW</th>
                  <th>Zeny/HP</th>
                  <th>Respawn</th>
                  <th>Acceso</th>
                </tr>
              </thead>
              <tbody>
                {maps.map((map) => (
                  <tr
                    key={map.map}
                    className={selectedMap?.map === map.map ? 'selected' : ''}
                    onClick={() => {
                      setMapMobDetail(null);
                      setSelectedMap(map);
                    }}
                  >
                    <td>
                      <strong>{map.mapName}</strong>
                      <span className="farm-muted">{map.map}</span>
                    </td>
                    <td>{map.mobCount}</td>
                    <td>{map.minMobLevel === map.maxMobLevel ? map.minMobLevel : `${map.minMobLevel}–${map.maxMobLevel}`}</td>
                    <td>{formatNumber(map.totalAmount)}</td>
                    <td>{formatZeny(map.weightedMzw)}</td>
                    <td>{formatZenyPerHp(map.weightedZenyPerHp)}</td>
                    <td>{formatDuration(map.minRespawnMs)}</td>
                    <td><span className={accessClass(map.accessDepth)}>{map.accessLabel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && (mode === 'mobs' ? mobs.length === 0 : maps.length === 0) && (
            <div className="farm-empty">No hay resultados con esos filtros.</div>
          )}

          {totalPages > 1 && (
            <div className="farm-pagination">
              <button type="button" disabled={page === 0} onClick={() => setPage(0)}>{'<<'}</button>
              <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>{'<'}</button>
              <span>Página {page + 1} de {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}>{'>'}</button>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>{'>>'}</button>
            </div>
          )}
      </div>

      {((selectedMob && mode === 'mobs') || (selectedMap && mode === 'maps')) && (
        <div
          className="farm-modal-backdrop"
          onMouseDown={() => {
            setSelectedMob(null);
            setSelectedMap(null);
            setMapMobDetail(null);
          }}
        >
          <div className="farm-modal" onMouseDown={(event) => event.stopPropagation()}>
            {selectedMob && mode === 'mobs' && (
              <MobDetail mob={selectedMob} onClose={() => setSelectedMob(null)} />
            )}

            {selectedMap && mode === 'maps' && (
              <div className="farm-detail">
                <div className="farm-detail-head">
                  <div>
                    <h3>{selectedMap.mapName}</h3>
                    <p>
                      {selectedMap.map} · {selectedMap.mobCount} especies ·{' '}
                      {formatNumber(selectedMap.totalAmount)} mobs
                    </p>
                  </div>
                  <button
                    type="button"
                    className="farm-close"
                    onClick={() => {
                      setSelectedMap(null);
                      setMapMobDetail(null);
                    }}
                    aria-label="Cerrar detalle"
                  >
                    ×
                  </button>
                </div>

                <div className="farm-detail-metrics">
                  <div>
                    <span>MZW ponderado</span>
                    <strong>{formatZeny(selectedMap.weightedMzw)}</strong>
                  </div>
                  <div>
                    <span>Zeny/HP</span>
                    <strong>{formatZenyPerHp(selectedMap.weightedZenyPerHp)}</strong>
                  </div>
                  <div>
                    <span>MZW máximo</span>
                    <strong>{formatZeny(selectedMap.maxMzw)}</strong>
                  </div>
                  <div>
                    <span>Acceso</span>
                    <strong>{selectedMap.accessLabel}</strong>
                  </div>
                </div>

                <div className="farm-subtitle">Mobs del mapa</div>
                <div className="farm-map-mobs">
                  {selectedMap.mobs.map((mob) => (
                    <button
                      type="button"
                      key={mob.id}
                      className="farm-map-mob"
                      onClick={() => openMapMob(mob.id)}
                    >
                      <span>{mob.name}</span>
                      <span>Nv. {mob.level}</span>
                      <span>{formatNumber(mob.amount)}</span>
                      <span>{formatZeny(mob.mzw)}</span>
                    </button>
                  ))}
                </div>

                {mapMobDetail && (
                  <div className="farm-map-mob-detail">
                    <MobDetail mob={mapMobDetail} onClose={() => setMapMobDetail(null)} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default FarmingCalculator;
