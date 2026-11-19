import { useEffect } from 'react';
import type { MarketRawItem } from '../../api/market';
import '../../styles/MarketSimulator.css';

const FIELD_DESCRIPTIONS: Record<string, string> = {
  item_id: 'Identificador numérico del item en item_db.',
  name: 'Nombre visible del item.',
  aegis: 'AegisName del item.',
  type: 'Tipo de item según item_db.',
  slots: 'Cantidad de slots de carta del item base.',
  refineable: 'Indica si item_db permite refine.',
  weight: 'Peso base del item en unidades de item_db.',
  custom: 'Indica si el item proviene de db/import/item_db.yml.',
  price_status: 'Origen del precio: market, synthetic o manual.',
  low: 'Límite inferior de la banda de precio canónica, en zeny.',
  mid: 'Centro de la banda de precio canónica, en zeny.',
  high: 'Límite superior de la banda de precio canónica, en zeny.',
  npc_buy: 'Precio que un NPC paga al jugador por el item.',
  npc_sell: 'Precio que un NPC cobra al jugador por el item.',
  supply_open: 'Flujo calculado solo con mapas field y dungeon.',
  supply_percentile: 'Percentil de supply_open entre items con supply.',
  abundance_tier: 'Categoría derivada del percentil de supply.',
  difficulty_percentile: 'Percentil de dificultad (threat) entre items con fuentes.',
  difficulty_tier: 'Categoría derivada de difficulty_percentile.',
  demand_percentile: 'Percentil del residual de ventas históricas combinadas.',
  demand_tier: 'Categoría derivada de demand_percentile.',
  market_pressure: 'Diferencia entre demand_percentile y supply_percentile.',
  stock_hint: 'Etiqueta derivada de market_pressure: low, normal o high.',
  restock_weight: 'Peso entre 0.1 y 0.9 derivado de market_pressure.',
  market_eligible: 'Resultado de las reglas de comerciabilidad, obtenibilidad y precio.',
  npc_eligible: 'Resultado de la regla de elegibilidad para NPC.',
  dataset_version: 'Versión del dataset de mercado.',
  updated_at: 'Momento de carga o actualización de la fila.',
  tags: 'Lista de tags del item; no es una columna única.'
};

const FIELD_ORDER = [
  'item_id', 'name', 'aegis', 'type', 'slots', 'refineable', 'weight', 'custom',
  'price_status', 'low', 'mid', 'high', 'npc_buy', 'npc_sell',
  'supply_open', 'supply_percentile', 'abundance_tier',
  'difficulty_percentile', 'difficulty_tier',
  'demand_percentile', 'demand_tier', 'market_pressure', 'stock_hint', 'restock_weight',
  'market_eligible', 'npc_eligible', 'dataset_version', 'updated_at'
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function MarketRawDataModal({
  open,
  itemName,
  data,
  loading,
  error,
  onClose
}: {
  open: boolean;
  itemName: string;
  data: MarketRawItem | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const row = data?.item ?? {};
  const keys = [
    ...FIELD_ORDER.filter((key) => Object.prototype.hasOwnProperty.call(row, key)),
    ...Object.keys(row).filter((key) => !FIELD_ORDER.includes(key)).sort()
  ];
  const entries = keys.map((key) => [key, row[key]] as const);
  if (data?.tags) entries.push(['tags', data.tags]);

  return (
    <div
      className="market-raw-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="market-raw-modal" role="dialog" aria-modal="true" aria-label="Datos crudos del item">
        <div className="market-raw-head">
          <div>
            <h2>Datos crudos</h2>
            <p>{itemName} · item base, sin combinar</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">Cerrar</button>
        </div>

        {loading && <div className="market-raw-state">Cargando datos...</div>}
        {error && <div className="market-raw-state market-raw-error">{error}</div>}

        {!loading && !error && (
          <div className="market-raw-table-wrap">
            <table className="market-raw-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Valor</th>
                  <th>Qué representa</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([key, value]) => (
                  <tr key={key}>
                    <td><code>{key}</code></td>
                    <td><code>{formatValue(value)}</code></td>
                    <td>{FIELD_DESCRIPTIONS[key] ?? 'Campo crudo del master de mercado.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
