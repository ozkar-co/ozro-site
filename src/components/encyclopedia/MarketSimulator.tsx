import { useEffect, useState } from 'react';
import {
  fetchMarketItemRaw,
  searchItems,
  simulateMarket,
  type ItemSearchResult,
  type MarketRawItem,
  type MarketSimulation
} from '../../api/market';
import MarketRawDataModal from './MarketRawDataModal';
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
  onSelect
}: {
  label: string;
  placeholder: string;
  onSelect: (item: ItemSearchResult) => void;
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
      searchItems({ q: term.trim(), limit: 8 })
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
  }, [term]);

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
  const [ask, setAsk] = useState('');
  const [simulation, setSimulation] = useState<MarketSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [rawData, setRawData] = useState<MarketRawItem | null>(null);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawError, setRawError] = useState<string | null>(null);

  const horizons = simulation?.assumptions.horizons ?? [7, 30, 90];

  useEffect(() => {
    if (!item) return;
    setAsk('');
    setSimulation(null);
    setError(null);
    setRawData(null);
    setRawOpen(false);
  }, [item]);

  const openRaw = async () => {
    if (!item) return;
    setRawOpen(true);
    setRawLoading(true);
    setRawError(null);
    setRawData(null);
    try {
      setRawData(await fetchMarketItemRaw(item.id));
    } catch (loadError) {
      setRawError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los datos');
    } finally {
      setRawLoading(false);
    }
  };

  const run = async () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      const result = await simulateMarket({
        itemId: item.id,
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
        <h2>Simulador de mercado</h2>
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
                <button type="button" onClick={openRaw}>Ver datos crudos</button>
                <button type="button" onClick={() => setItem(null)}>Cambiar</button>
              </div>

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
              Elige un item para ver precio, liquidez y tiempo estimado de venta.
            </div>
          )}

          {simulation && (
            <>
              <div className="market-sim-prices">
                <div>
                  <span>Venta inmediata</span>
                  <strong>{formatZeny(simulation.prices.instant)}</strong>
                  <small>compra inmediata NPC</small>
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
                </div>
              </div>

              <div className="market-sim-section">
                <h3>Venta con tu precio</h3>
                <p className="market-sim-hint">
                  Pides {formatZeny(simulation.sale.ask)}. Mediana: {formatDays(simulation.sale.medianDays)}.
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

      <MarketRawDataModal
        open={rawOpen}
        itemName={item?.name ?? ''}
        data={rawData}
        loading={rawLoading}
        error={rawError}
        onClose={() => setRawOpen(false)}
      />
    </section>
  );
};

export default MarketSimulator;
