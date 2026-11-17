import { useEffect, useMemo, useState } from 'react';
import { loadTransport, type TransportGraph, type TransportLine } from '../../api/transport';
import '../../styles/TransportMap.css';

interface Point {
  x: number;
  y: number;
}

const POSITIONS: Record<string, Point> = {
  einbroch: { x: 300, y: 90 },
  yuno: { x: 480, y: 140 },
  lighthalzen: { x: 650, y: 80 },
  hugel: { x: 840, y: 120 },
  rachel: { x: 880, y: 240 },
  aldebaran: { x: 250, y: 220 },
  geffen: { x: 380, y: 280 },
  prontera: { x: 520, y: 360 },
  payon: { x: 700, y: 330 },
  cmd_fild07: { x: 900, y: 420 },
  izlude: { x: 820, y: 520 },
  alberta: { x: 650, y: 600 },
  morocc: { x: 420, y: 480 },
  comodo: { x: 540, y: 520 },
  umbala: { x: 600, y: 650 },
};

const CURVES: Record<string, number> = {
  'aldebaran-izlude': 80,
  'izlude-geffen': -80,
  'izlude-morocc': 40,
  'prontera-morocc': 15,
  'morocc-payon': -20,
  'comodo-cmd_fild07': 20,
  'morocc-cmd_fild07': -20,
  'alberta-payon': 15,
  'prontera-alberta': -15,
  'izlude-payon': 15,
  'comodo-morocc': 10,
  'comodo-umbala': 10,
  'izlude-yuno': 40,
  'yuno-rachel': 30,
  'rachel-izlude': 40,
  'yuno-hugel': 20,
};

interface Segment {
  id: string;
  type: 'kafra' | 'airship';
  variant: string;
  path: string;
  oneWay: boolean;
}

function curvePath(from: Point, to: Point, curvature: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const controlX = midX + (-dy / length) * curvature;
  const controlY = midY + (dx / length) * curvature;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function lineVariant(line: TransportLine): string {
  if (line.type === 'kafra') return 'kafra';
  return line.group === 'airship-domestic' ? 'airship-domestic' : 'airship-international';
}

function segmentsFor(graph: TransportGraph, showKafra: boolean, showAirship: boolean): Segment[] {
  const segments: Segment[] = [];
  for (const line of graph.lines) {
    if (line.type === 'kafra' && line.from && line.to) {
      if (!showKafra) continue;
      const from = POSITIONS[line.from];
      const to = POSITIONS[line.to];
      if (!from || !to) continue;
      segments.push({
        id: line.id,
        type: 'kafra',
        variant: 'kafra',
        path: curvePath(from, to, CURVES[`${line.from}-${line.to}`] ?? 0),
        oneWay: line.bidirectional === false,
      });
    }

    if (line.type === 'airship' && line.stops) {
      if (!showAirship) continue;
      const stations = line.stops.map((stop) => stop.station);
      const pairs: Array<[string, string]> = [];
      for (let index = 0; index < stations.length - 1; index += 1) {
        pairs.push([stations[index], stations[index + 1]]);
      }
      if (line.loop && stations.length > 1) {
        pairs.push([stations[stations.length - 1], stations[0]]);
      }
      pairs.forEach(([fromId, toId], index) => {
        const from = POSITIONS[fromId];
        const to = POSITIONS[toId];
        if (!from || !to) return;
        segments.push({
          id: `${line.id}:${index}`,
          type: 'airship',
          variant: lineVariant(line),
          path: curvePath(from, to, CURVES[`${fromId}-${toId}`] ?? 0),
          oneWay: false,
        });
      });
    }
  }
  return segments;
}

const TransportMap = () => {
  const [graph, setGraph] = useState<TransportGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showKafra, setShowKafra] = useState(true);
  const [showAirship, setShowAirship] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadTransport()
      .then((data) => {
        if (!cancelled) setGraph(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el transporte');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const segments = useMemo(
    () => (graph ? segmentsFor(graph, showKafra, showAirship) : []),
    [graph, showKafra, showAirship],
  );

  const selectedNode = useMemo(
    () => graph?.nodes.find((node) => node.id === selected) ?? null,
    [graph, selected],
  );

  const selectedGroups = selected ? graph?.tooltips[selected] ?? [] : [];

  const selectNode = (id: string) => {
    setSelected((current) => (current === id ? null : id));
  };

  return (
    <section className="transport-view">
      <div className="transport-head">
        <div>
          <h2>Transporte</h2>
          <p>
            Kafra, airship y transbordos. Selecciona una ciudad para ver sus conexiones
            y destinos.
          </p>
        </div>
        <div className="transport-legend" aria-label="Capas del grafo">
          <button
            type="button"
            className={`transport-toggle ${showKafra ? 'is-active' : ''}`}
            aria-pressed={showKafra}
            onClick={() => setShowKafra((value) => !value)}
          >
            Kafra
          </button>
          <button
            type="button"
            className={`transport-toggle ${showAirship ? 'is-active' : ''}`}
            aria-pressed={showAirship}
            onClick={() => setShowAirship((value) => !value)}
          >
            Airship
          </button>
          <span className="transport-legend-item">
            <span className="transport-swatch is-kafra" />
            Kafra
          </span>
          <span className="transport-legend-item">
            <span className="transport-swatch is-airship-domestic" />
            Airship doméstico
          </span>
          <span className="transport-legend-item">
            <span className="transport-swatch is-airship-international" />
            Airship internacional
          </span>
          <span className="transport-legend-item">
            <span className="transport-swatch is-oneway" />
            Unidireccional
          </span>
        </div>
      </div>

      {loading && <p className="transport-message">Cargando transporte...</p>}
      {error && <p className="transport-message is-error">{error}</p>}

      {graph && (
        <div className="transport-layout">
          <div className="transport-canvas">
            <svg viewBox="0 0 1000 720" role="img" aria-label="Grafo esquemático de transporte">
              <defs>
                <marker
                  id="transport-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#2f7d5b" />
                </marker>
              </defs>

              {segments.map((segment) => (
                <path
                  key={segment.id}
                  d={segment.path}
                  className={`transport-edge is-${segment.variant}${segment.oneWay ? ' is-oneway' : ''}`}
                  markerEnd={segment.oneWay ? 'url(#transport-arrow)' : undefined}
                />
              ))}

              {graph.nodes.map((node) => {
                const point = POSITIONS[node.id];
                if (!point) return null;
                const isSelected = selected === node.id;
                const isDouble = node.shape === 'double';
                return (
                  <g
                    key={node.id}
                    className={`transport-node${isSelected ? ' is-selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={node.name}
                    aria-pressed={isSelected}
                    onClick={() => selectNode(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectNode(node.id);
                      }
                    }}
                  >
                    <circle cx={point.x} cy={point.y} r={18} className="transport-hit" />
                    {isDouble ? (
                      <>
                        <ellipse
                          cx={point.x}
                          cy={point.y}
                          rx={30}
                          ry={17}
                          className="transport-node-shape"
                        />
                        <circle cx={point.x - 10} cy={point.y} r={5} className="transport-node-dot" />
                        <circle cx={point.x + 10} cy={point.y} r={5} className="transport-node-dot" />
                      </>
                    ) : (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={7}
                        className="transport-node-shape"
                      />
                    )}
                    <text
                      x={point.x}
                      y={point.y + (isDouble ? 30 : 23)}
                      textAnchor="middle"
                      className="transport-node-label"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <aside className="transport-detail" aria-live="polite">
            {selectedNode ? (
              <>
                <div className="transport-detail-head">
                  <div>
                    <span className="transport-kicker">{selectedNode.region}</span>
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

                {selectedGroups.length === 0 && (
                  <p className="transport-empty">Sin destinos en tooltip.</p>
                )}

                {selectedGroups.map((group) => (
                  <div className={`transport-group is-${group.type}`} key={`${selected}-${group.label}`}>
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
                <p>
                  Haz clic en una ciudad para ver sus grupos de destinos y planear la ruta
                  manualmente.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
};

export default TransportMap;
