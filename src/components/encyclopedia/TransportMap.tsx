import { useEffect, useMemo, useState } from 'react';
import { loadTransportLayout, type TransportLayout } from '../../api/transportLayout';
import '../../styles/TransportMap.css';

const MAP_URL = '/assets/world/transport-map.svg';

const TransportMap = () => {
  const [layout, setLayout] = useState<TransportLayout | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadTransportLayout()
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'No se pudo cargar el mapa de transporte',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const overlayNodes = useMemo(() => {
    if (!layout) return [];
    return layout.nodes.map((node) => ({
      ...node,
      left: ((node.x - layout.viewBox.x) / layout.viewBox.width) * 100,
      top: ((node.y - layout.viewBox.y) / layout.viewBox.height) * 100,
    }));
  }, [layout]);

  const selectedNode = useMemo(
    () => layout?.nodes.find((node) => node.id === selected) ?? null,
    [layout, selected],
  );

  return (
    <section className="transport-view">
      <div className="transport-head">
        <div>
          <h2>Transporte</h2>
          <p>
            Mapa esquemático de Kafra y airship. Pulsa el punto negro de cada estación para
            ver sus destinos.
          </p>
        </div>
      </div>

      {loading && <p className="transport-message">Cargando mapa...</p>}
      {error && <p className="transport-message is-error">{error}</p>}

      {layout && (
        <div className="transport-layout">
          <div className="transport-stage">
            <img src={MAP_URL} alt="Mapa esquemático de transporte de Rune-Midgard" />
            {overlayNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={`transport-node-hit${selected === node.id ? ' is-active' : ''}`}
                style={{ left: `${node.left}%`, top: `${node.top}%` }}
                aria-label={node.name}
                aria-pressed={selected === node.id}
                onClick={() => setSelected((current) => (current === node.id ? null : node.id))}
              >
                <span className="transport-node-dot" />
              </button>
            ))}
          </div>

          <aside className="transport-detail" aria-live="polite">
            {selectedNode ? (
              <>
                <div className="transport-detail-head">
                  <div>
                    <span className="transport-kicker">Estación</span>
                    <h3>{selectedNode.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="transport-close"
                    aria-label="Cerrar detalle"
                    onClick={() => setSelected(null)}
                  >
                    ×
                  </button>
                </div>

                {selectedNode.tooltips.length === 0 && (
                  <p className="transport-empty">Sin destinos en tooltip.</p>
                )}

                {selectedNode.tooltips.map((group) => (
                  <div className={`transport-group is-${group.type}`} key={`${selectedNode.id}-${group.label}`}>
                    <div className="transport-group-head">
                      <span>{group.label}</span>
                      <span>{group.destinations.length}</span>
                    </div>
                    <ul>
                      {group.destinations.map((destination) => (
                        <li key={`${destination.map}-${destination.name}`} title={destination.map}>
                          {destination.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ) : (
              <div className="transport-detail-placeholder">
                <span className="transport-kicker">Selecciona una estación</span>
                <p>Haz clic en el punto negro de un nodo para abrir su tooltip.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
};

export default TransportMap;
