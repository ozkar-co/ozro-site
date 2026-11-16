import { useEffect, useMemo, useState } from 'react';
import {
  loadNpcMap,
  npcDisplayName,
  npcQuestCount,
  npcSpriteUrl,
  type NpcEntry,
  type NpcMapsIndex,
  type NpcSpriteIndex,
} from '../../api/npcData';
import '../../styles/Encyclopedia.css';

const FUNCTION_LABELS: Record<string, string> = {
  quest: 'Quest',
  dialogo: 'Diálogo',
  tienda: 'Tienda',
  warp: 'Warp',
  soporte: 'Soporte',
  kafra: 'Kafra',
  almacen: 'Almacén',
  otro: 'Otro',
};

const FUNCTION_ORDER = [
  'quest',
  'dialogo',
  'tienda',
  'warp',
  'soporte',
  'kafra',
  'almacen',
  'otro',
];

const DEFAULT_MAP = 'prontera';
const FALLBACK_SPRITE = '/icons/npc.png';

interface NpcMapBrowserProps {
  maps: NpcMapsIndex | null;
  sprites: NpcSpriteIndex | null;
  mapsError: string | null;
}

const NpcMapBrowser = ({ maps, sprites, mapsError }: NpcMapBrowserProps) => {
  const [selectedMap, setSelectedMap] = useState('');
  const [npcs, setNpcs] = useState<NpcEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [showHidden, setShowHidden] = useState(false);
  const [showInstances, setShowInstances] = useState(false);
  const [loadingNpcs, setLoadingNpcs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!maps || selectedMap) return;

    const initial =
      maps.maps.find((item) => item.map === DEFAULT_MAP) ??
      maps.maps.find((item) => !item.instance && item.visible > 0) ??
      maps.maps[0];

    if (initial) setSelectedMap(initial.map);
  }, [maps, selectedMap]);

  useEffect(() => {
    if (!selectedMap) return;
    let cancelled = false;

    setLoadingNpcs(true);
    setNpcs(null);
    setError(null);

    loadNpcMap(selectedMap)
      .then((data) => {
        if (!cancelled) setNpcs(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setNpcs([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los NPCs de este mapa',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingNpcs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMap]);

  const selectedMapInfo = useMemo(
    () => maps?.maps.find((item) => item.map === selectedMap) ?? null,
    [maps, selectedMap],
  );

  const mapOptions = useMemo(() => {
    if (!maps) return { world: [], instances: [] };
    const visible = maps.maps.filter(
      (item) => showInstances || !item.instance || item.map === selectedMap,
    );
    const sorted = [...visible].sort((a, b) =>
      a.mapName.localeCompare(b.mapName, 'es'),
    );
    return {
      world: sorted.filter((item) => !item.instance),
      instances: sorted.filter((item) => item.instance),
    };
  }, [maps, showInstances, selectedMap]);

  const functionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const npc of npcs ?? []) {
      if (!showHidden && !npc.visible) continue;
      counts[npc.function] = (counts[npc.function] ?? 0) + 1;
    }
    return counts;
  }, [npcs, showHidden]);

  const baseCount = useMemo(
    () => Object.values(functionCounts).reduce((sum, value) => sum + value, 0),
    [functionCounts],
  );

  const filteredNpcs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (npcs ?? [])
      .filter((npc) => {
        if (!showHidden && !npc.visible) return false;
        if (functionFilter !== 'all' && npc.function !== functionFilter) return false;
        if (term) {
          const name = npcDisplayName(npc).toLowerCase();
          if (!name.includes(term) && !npc.name.toLowerCase().includes(term)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) =>
        npcDisplayName(a).localeCompare(npcDisplayName(b), 'es'),
      );
  }, [npcs, query, functionFilter, showHidden]);

  const handleMapChange = (value: string) => {
    setSelectedMap(value);
    setQuery('');
    setFunctionFilter('all');
  };

  return (
    <section className="encyclopedia-panel">
      {!maps && !mapsError && <div className="npc-loading">Cargando mapas...</div>}
      {(mapsError || error) && <div className="npc-empty">{mapsError ?? error}</div>}

      {maps && (
        <>
          <div className="npc-controls">
            <div className="npc-controls-row">
              <label className="npc-field npc-field-map">
                <span>Mapa</span>
                <select
                  value={selectedMap}
                  onChange={(event) => handleMapChange(event.target.value)}
                >
                  {mapOptions.world.length > 0 && (
                    <optgroup label="Mundo">
                      {mapOptions.world.map((item) => (
                        <option key={item.map} value={item.map}>
                          {item.mapName} ({item.visible})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {mapOptions.instances.length > 0 && (
                    <optgroup label="Instancias">
                      {mapOptions.instances.map((item) => (
                        <option key={item.map} value={item.map}>
                          {item.mapName} ({item.visible})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>

              <label className="npc-check">
                <input
                  type="checkbox"
                  checked={showInstances}
                  onChange={(event) => setShowInstances(event.target.checked)}
                />
                Mostrar mapas de instancia
              </label>
            </div>

            <div className="npc-controls-row">
              <label className="npc-field npc-field-search">
                <span>Buscar en este mapa</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre del NPC..."
                />
              </label>

              <label className="npc-field npc-field-function">
                <span>Función</span>
                <select
                  value={functionFilter}
                  onChange={(event) => setFunctionFilter(event.target.value)}
                >
                  <option value="all">
                    Todas ({baseCount.toLocaleString('es')})
                  </option>
                  {FUNCTION_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {FUNCTION_LABELS[value]} ({functionCounts[value] ?? 0})
                    </option>
                  ))}
                </select>
              </label>

              <label className="npc-check">
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(event) => setShowHidden(event.target.checked)}
                />
                Mostrar ocultos
              </label>
            </div>
          </div>

          <div className="npc-results-head">
            <div>
              <h2>{selectedMapInfo?.mapName ?? selectedMap}</h2>
              <p>
                {filteredNpcs.length.toLocaleString('es')} de{' '}
                {baseCount.toLocaleString('es')} NPCs
              </p>
            </div>
            {selectedMapInfo && (
              <span className="npc-map-tag">
                {selectedMapInfo.instance ? 'Instancia' : 'Mundo'}
              </span>
            )}
          </div>

          {loadingNpcs ? (
            <div className="npc-loading">Cargando NPCs...</div>
          ) : filteredNpcs.length === 0 ? (
            <div className="npc-empty">No hay NPCs con esos filtros.</div>
          ) : (
            <div className="npc-grid">
              {filteredNpcs.map((npc) => {
                const questCount = npcQuestCount(npc);
                return (
                  <article
                    key={npc.id}
                    className={`npc-card${npc.visible ? '' : ' is-hidden'}`}
                  >
                    <div className="npc-sprite">
                      <img
                        src={npcSpriteUrl(sprites, npc.sprite) ?? FALLBACK_SPRITE}
                        alt={npcDisplayName(npc)}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_SPRITE;
                        }}
                      />
                    </div>
                    <div className="npc-info">
                      <h3 title={npc.name}>{npcDisplayName(npc)}</h3>
                      <span className={`npc-function fn-${npc.function}`}>
                        {FUNCTION_LABELS[npc.function] ?? npc.function}
                      </span>
                      <p className="npc-location">
                        {selectedMapInfo?.mapName ?? selectedMap} · {npc.x}, {npc.y}
                      </p>
                      {questCount > 0 && (
                        <p className="npc-quests">
                          {questCount} {questCount === 1 ? 'quest' : 'quests'}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="encyclopedia-attribution">
        Sprites © Gravity Co., Ltd. — datos de sprite:{' '}
        <a
          href="https://nn.ai4rei.net/dev/npclist/"
          target="_blank"
          rel="noopener noreferrer"
        >
          nn.ai4rei.net/dev/npclist
        </a>
      </p>
    </section>
  );
};

export default NpcMapBrowser;
