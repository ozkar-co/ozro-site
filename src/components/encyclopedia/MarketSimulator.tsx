import { useEffect, useMemo, useState } from 'react';
import {
  searchItems,
  simulateMarket,
  type ItemSearchResult,
  type MarketSimulation
} from '../../api/market';
import '../../styles/MarketSimulator.css';

function formatZeny(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('es')} z`;
}

function formatDays(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 3650) return 'más de 10 años';
  if (value >= 365) return `${(value / 365).toFixed(1)} años`;
  if (value >= 30) return `${(value / 30).toFixed(1)} meses`;
  return `${Math.round(value)} días`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function ItemSearch({
  label,
  placeholder,
  onSelect,
  type
}: {
  label: string;
  placeholder: string;
  onSelect: (item: ItemSearchResult) => void;
  type?: string;
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<ItemSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchItems({ q: term.trim(), type, limit: 8 })
        .then((data) => {
          if (!cancelled) setResults(data.results);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, type]);

  return (
    <div className="market-sim-search">
      <label>
        <span>{label}</span>
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {loading && <div className="market-sim-hint">Buscando...</div>}
      {results.length > 0 && (
        <div className="market-sim-results">
          {results.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                onSelect(item);
                setTerm('');
                setResults([]);
              }}
            >
              <strong>{item.name}</strong>
              <span>#{item.id} · {item.type}{item.slots ? ` · ${item.slots} slots` : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MarketSimulator = () => {
  const [item, setItem] = useState<ItemSearchResult | null>(null);
  const [cards, setCards] = useState<ItemSearchResult[]>([]);
  const [refine, setRefine] = useState(0);
  const [enchant, setEnchant] = useState('none');
  const [ask, setAsk] = useState('');
  const [simulation, setSimulation] = useState<MarketSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddCard = item ? cards.length < item.slots : false;
  const horizons = useMemo(() => simulation?.assumptions.horizons ?? [7, 30, 90], [simulation]);

  useEffect(() => {
    if (!item) return;
    setCards([]);
    setRefine(0);
    setAsk('');
    setSimulation(null);
    setError(null);
  }, [item]);

  const run = async () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      const result = await simulateMarket({
        itemId: item.id,
        refine,
        cards: cards.map((card) => card.id),
        enchant,
        ask: ask.trim() ? Number(ask) : null
      });
      setSimulation(result);
      if (!ask.trim()) setAsk(String(result.prices.fair));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo simular');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="market-sim">
      <div className="market-sim-intro">
        <h2>Simulador de tasador</h2>
        <p>
          Estima cuánto puede valer un objeto y cuánto puede tardar en venderse.
          La rareza sube el precio, pero también baja la liquidez: un objeto caro
          puede tardar meses o años. Esto es una simulación, no una oferta.
        </p>
      </div>

      <div className="market-sim-grid">
        <div className="market-sim-controls">
          <ItemSearch
            label="Item base"
            placeholder="Nombre o ID"
            onSelect={(selected) => setItem(selected)}
          />

          {item && (
            <>
              <div className="market-sim-selected">
                <strong>{item.name}</strong>
                <span>#{item.id} · {item.type}{item.slots ? ` · ${item.slots} slots` : ''}</span>
                <button type="button" onClick={() => setItem(null)}>Cambiar</button>
              </div>

              <div className="market-sim-row">
                <label>
                  <span>Refine</span>
                  <select
                    value={refine}
                    onChange={(event) => setRefine(Number(event.target.value))}
                    disabled={!item.refineable}
                  >
                    {Array.from({ length: 21 }, (_, value) => (
                      <option key={value} value={value}>+{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Encantamiento (estimado)</span>
                  <select value={enchant} onChange={(event) => setEnchant(event.target.value)}>
                    <option value="none">Sin encantamiento</option>
                    <option value="low">Bajo (+5%)</option>
                    <option value="medium">Medio (+15%)</option>
                    <option value="high">Alto (+35%)</option>
                  </select>
                </label>
              </div>
              <p className="market-sim-hint">
                Encantamiento es un nivel genérico de estimación; todavía no distingue encantamientos específicos.
              </p>

              {item.slots > 0 && (
                <div className="market-sim-cards">
                  <div className="market-sim-cards-head">
                    <span>Cartas ({cards.length}/{item.slots})</span>
                  </div>
                  <div className="market-sim-chips">
                    {cards.map((card) => (
                      <button
                        type="button"
                        key={card.id}
                        onClick={() => setCards((current) => current.filter((entry) => entry.id !== card.id))}
                      >
                        {card.name} ×
                      </button>
                    ))}
                  </div>
                  {canAddCard && (
                    <ItemSearch
                      label="Agregar carta"
                      placeholder="Nombre o ID de carta"
                      type="Card"
                      onSelect={(card) => setCards((current) => (
                        current.some((entry) => entry.id === card.id) ? current : [...current, card]
                      ))}
                    />
                  )}
                </div>
              )}

              <label className="market-sim-ask">
                <span>Precio pedido (opcional)</span>
                <input
                  type="number"
                  min="0"
                  value={ask}
                  onChange={(event) => setAsk(event.target.value)}
                  placeholder="Precio justo automático"
                />
              </label>

              <button
                type="button"
                className="market-sim-run"
                onClick={run}
                disabled={loading}
              >
                {loading ? 'Simulando...' : 'Simular venta'}
              </button>
            </>
          )}

          {error && <div className="market-sim-error">{error}</div>}
        </div>

        <div className="market-sim-output">
          {!simulation && !loading && (
            <div className="market-sim-empty">
              Elegí un item para ver precio, liquidez y tiempo estimado de venta.
            </div>
          )}

          {simulation && (
            <>
              <div className="market-sim-prices">
                <div>
                  <span>Venta inmediata</span>
                  <strong>{formatZeny(simulation.prices.instant)}</strong>
                  <small>tasador / NPC</small>
                </div>
                <div className="highlight">
                  <span>Precio justo</span>
                  <strong>{formatZeny(simulation.prices.fair)}</strong>
                  <small>{formatDays(simulation.fairSale.medianDays)}</small>
                </div>
                <div>
                  <span>Precio paciente</span>
                  <strong>{formatZeny(simulation.prices.patient)}</strong>
                  <small>requiere espera</small>
                </div>
              </div>

              <div className="market-sim-section">
                <h3>Liquidez</h3>
                <div className="market-sim-metrics">
                  <div><span>Score</span><strong>{formatPercent(simulation.liquidity.score)}</strong></div>
                  <div><span>Demanda</span><strong>{simulation.item.demandTier}</strong></div>
                  <div><span>Abundancia</span><strong>{simulation.item.abundanceTier}</strong></div>
                  <div><span>Stock</span><strong>{simulation.item.stockHint}</strong></div>
                  <div><span>Cartas</span><strong>{formatPercent(simulation.liquidity.cardDepth)}</strong></div>
                  <div><span>Refine</span><strong>{formatPercent(simulation.liquidity.refineDepth)}</strong></div>
                  <div><span>Encantamiento</span><strong>{formatPercent(simulation.liquidity.enchantDepth)}</strong></div>
                  <div><span>Profundidad de precio</span><strong>{formatPercent(simulation.liquidity.base)}</strong></div>
                </div>
              </div>

              <div className="market-sim-section">
                <h3>Venta con tu precio</h3>
                <p className="market-sim-hint">
                  Pedís {formatZeny(simulation.sale.ask)}. Mediana: {formatDays(simulation.sale.medianDays)}.
                </p>
                <div className="market-sim-probabilities">
                  {horizons.map((days) => (
                    <div key={days}>
                      <span>{days} días</span>
                      <strong>{formatPercent(simulation.sale.probability[String(days)] ?? 0)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="market-sim-section">
                <h3>Curva precio / tiempo</h3>
                <div className="market-sim-curve">
                  <table>
                    <thead>
                      <tr>
                        <th>Precio</th>
                        <th>Mediana</th>
                        <th>30 días</th>
                        <th>90 días</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulation.curve.map((point) => (
                        <tr key={point.ask}>
                          <td>{formatZeny(point.ask)}</td>
                          <td>{formatDays(point.medianDays)}</td>
                          <td>{formatPercent(point.probability['30'] ?? 0)}</td>
                          <td>{formatPercent(point.probability['90'] ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="market-sim-breakdown">
                <h3>Composición</h3>
                <p>
                  Base {formatZeny(simulation.composition.baseValue)} ·
                  Cartas {formatZeny(simulation.composition.cardValue)} ·
                  Encantamiento {formatZeny(simulation.composition.enchantValue)} ·
                  Refine +{simulation.composition.refine}
                </p>
                <p>
                  Master: {formatZeny(simulation.item.mid)} · compra NPC {formatZeny(simulation.item.npcBuy)} ·
                  estado {simulation.item.priceStatus}
                </p>
                <p className="market-sim-hint">{simulation.assumptions.note}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default MarketSimulator;
