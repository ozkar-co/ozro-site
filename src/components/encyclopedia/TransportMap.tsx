import { useEffect, useMemo, useState } from 'react';
import { loadTransportLayout, type TransportLayout, type TransportLayoutNode } from '../../api/transportLayout';
import '../../styles/TransportMap.css';

const MAP_URL = '/assets/world/transport-map.svg';

const TooltipGroups = ({ node }: { node: TransportLayoutNode }) => {
  if (node.tooltips.length === 0) {
    return <p className="transport-empty">Sin destinos en tooltip.</p>;
  }

  return (
    <>
      {node.tooltips.map((group) => (
        <div className={`transport-group is-${group.type}`} key={`${node.id}-${group.label}`}>
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
  );
};

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

  const selectedOverlay = useMemo(
    () => overlayNodes.find((node) => node.id === selected) ?? null,
    [overlayNodes, selected],
  );

  const popoverClass = selectedOverlay
    ? `transport-popover is-${selectedOverlay.left > 60 ? 'left' : 'right'} is-${
        selectedOverlay.top < 28 ? 'below' : selectedOverlay.top > 72 ? 'above' : 'middle'
      }`
    : '';

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
        <div className="transport-stage-wrap">
          <div className="transport-stage">
            <img
              src={`${MAP_URL}?v=${layout.version}`}
              alt="Mapa esquemático de transporte de Rune-Midgard"
            />
            {overlayNodes.map((node) =>
              node.tooltips.length === 0 ? (
                <span
                  key={node.id}
                  className="transport-node-hit is-disabled"
                  style={{ left: `${node.left}%`, top: `${node.top}%` }}
                  aria-hidden="true"
                >
                  <span className="transport-node-dot" />
                </span>
              ) : (
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
              ),
            )}
          </div>

          {selectedOverlay && (
            <div
              className={popoverClass}
              style={{ left: `${selectedOverlay.left}%`, top: `${selectedOverlay.top}%` }}
              role="dialog"
              aria-label={`Destinos de ${selectedOverlay.name}`}
            >
              <div className="transport-popover-head">
                <div>
                  <span className="transport-kicker">Estación</span>
                  <h3>{selectedOverlay.name}</h3>
                </div>
                <button
                  type="button"
                  className="transport-close"
                  aria-label="Cerrar tooltip"
                  onClick={() => setSelected(null)}
                >
                  ×
                </button>
              </div>
              <TooltipGroups node={selectedOverlay} />
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TransportMap;
