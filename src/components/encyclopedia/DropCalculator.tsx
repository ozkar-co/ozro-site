import { useState } from 'react';
import '../../styles/DropCalculator.css';

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

function formatPlain(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${numberFormat.format(value / 1_000_000_000)} mil millones`;
  if (abs >= 1_000_000) return `${numberFormat.format(value / 1_000_000)} millones`;
  if (abs >= 10_000) return `${numberFormat.format(value / 1_000)} mil`;
  return numberFormat.format(value);
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 100) return numberFormat.format(Math.round(value));
  if (value >= 10) return value.toLocaleString('es', { maximumFractionDigits: 1 });
  return value.toLocaleString('es', { maximumFractionDigits: 2 });
}

function formatChance(probability: number): string {
  if (!Number.isFinite(probability) || probability <= 0) return '0%';
  if (probability >= 1) return '100%';
  const percent = probability * 100;
  if (percent < 0.01) return '< 0,01%';
  if (percent > 99.99) return '> 99,99%';
  const whole = Math.abs(percent - Math.round(percent)) < 1e-9;
  return `${percent.toLocaleString('es', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2
  })}%`;
}

function formatSpread(sd: number): string | null {
  if (!Number.isFinite(sd) || sd < 0.05) return null;
  if (sd < 1) return sd.toLocaleString('es', { maximumFractionDigits: 2 });
  return Math.round(sd).toLocaleString('es');
}

function withSpread(mean: number, sd: number): string {
  const spread = formatSpread(sd);
  return spread ? `${formatCount(mean)} ± ${spread}` : formatCount(mean);
}

function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
  return 0.5 * (1 + sign * y);
}

/** Chance de sacar al menos `quantity` objetos en `n` kills. */
function probAtLeast(n: number, quantity: number, p: number): number {
  if (quantity <= 0) return 1;
  if (p >= 1) return n >= quantity ? 1 : 0;
  if (p <= 0 || n < quantity) return 0;

  const mean = n * p;
  const sd = Math.sqrt(Math.max(0, n * p * (1 - p)));
  if (sd > 0 && quantity <= mean - 12 * sd - 30) return 1;
  if (sd > 0 && quantity > mean + 12 * sd + 30) return 0;

  if (quantity <= 400 && mean <= 250 && n <= 10_000_000) {
    let term = Math.exp(n * Math.log(1 - p));
    let sum = term;
    for (let k = 0; k < quantity - 1; k += 1) {
      term *= ((n - k) / (k + 1)) * (p / (1 - p));
      sum += term;
      if (sum >= 1) return 0;
    }
    return Math.min(1, Math.max(0, 1 - sum));
  }

  if (sd === 0) return mean + 1e-9 >= quantity ? 1 : 0;
  return Math.min(1, Math.max(0, 1 - normalCdf((quantity - 0.5 - mean) / sd)));
}

function chanceAtLeastOne(n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return 1;
  return Math.min(1, Math.max(0, 1 - Math.exp(n * Math.log(1 - p))));
}

function chanceNone(n: number, p: number): number {
  if (n <= 0 || p <= 0) return 1;
  if (p >= 1) return 0;
  return Math.exp(n * Math.log(1 - p));
}

/** Kills en los que la mitad de los intentos ya consiguió la cantidad. */
function medianKills(quantity: number, p: number): number {
  if (p >= 1) return quantity;
  if (!(p > 0) || quantity / p > 1e15) return Infinity;
  if (quantity <= 1) return Math.ceil(Math.log(0.5) / Math.log(1 - p));

  let lo = quantity;
  let hi = Math.ceil(quantity / p + 8 * Math.sqrt(quantity * (1 - p) / (p * p)) + quantity);
  let guard = 0;
  const half = 0.5 - 1e-9;
  while (probAtLeast(hi, quantity, p) < half && guard < 40) {
    hi = Math.ceil(hi * 1.6) + quantity;
    guard += 1;
  }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (probAtLeast(mid, quantity, p) >= half) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

const DropCalculator = () => {
  const [chance, setChance] = useState('1');
  const [amount, setAmount] = useState('1');
  const [kills, setKills] = useState('100');

  const p = Math.max(0, Math.min(1, Number(chance) / 100 || 0));
  const parsedQty = Math.floor(Number(amount));
  const quantity = Number.isFinite(parsedQty) && parsedQty >= 1 ? parsedQty : null;
  const killCount = Math.max(0, Math.floor(Number(kills) || 0));

  const meanOne = p > 0 ? 1 / p : Infinity;
  const sampleKills = p > 0 && p < 1 ? Math.max(1, Math.round(meanOne)) : p >= 1 ? 1 : 0;
  const medianOne = p > 0 ? medianKills(1, p) : Infinity;
  const sampleHit = p > 0 ? chanceAtLeastOne(sampleKills, p) : 0;
  const meanQty = quantity !== null && p > 0 ? quantity / p : Infinity;
  const medianQty = quantity !== null && p > 0 ? medianKills(quantity, p) : Infinity;
  const expectedItems = killCount * p;
  const itemSpread = Math.sqrt(Math.max(0, killCount * p * (1 - p)));
  const atLeastOne = chanceAtLeastOne(killCount, p);
  const none = chanceNone(killCount, p);

  return (
    <div className="drop-panel">
      <div className="drop-intro">
        <h2>Calculadora de drops</h2>
        <p>
          La probabilidad se escribe una vez. Cada fila usa ese dato y, si corresponde,
          solo el número de esa fila.
        </p>
      </div>

      <section className="drop-card">
        <div className="drop-row">
          <label className="drop-field">
            <span>Probabilidad por kill (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={chance}
              onChange={(event) => setChance(event.target.value)}
            />
          </label>
          <div className="drop-readout">
            {p <= 0 && <p>Con esta probabilidad no sale.</p>}
            {p >= 1 && <p>Sale en cada kill.</p>}
            {p > 0 && p < 1 && (
              <>
                <p>El primero sale, en promedio, a los <strong>{formatPlain(meanOne)} kills</strong>.</p>
                <p>La mitad de las veces ya salió en <strong>{formatPlain(medianOne)} kills</strong> o menos.</p>
                <p>
                  Si haces esos <strong>{sampleKills.toLocaleString('es')}</strong>, la chance de sacarlo es{' '}
                  <strong>{formatChance(sampleHit)}</strong>.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="drop-row">
          <label className="drop-field">
            <span>Cantidad que quieres</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <div className="drop-readout">
            {quantity === null && <p>Indica cuántos quieres.</p>}
            {quantity !== null && p <= 0 && <p>Con esta probabilidad no llegas a esa cantidad.</p>}
            {quantity !== null && p >= 1 && (
              <p>Hacen falta <strong>{quantity.toLocaleString('es')} kills</strong>.</p>
            )}
            {quantity !== null && p > 0 && p < 1 && (
              <>
                <p>
                  Para conseguir {quantity.toLocaleString('es')} hacen falta, en promedio,{' '}
                  <strong>{formatPlain(meanQty)} kills</strong>.
                </p>
                <p>
                  La mitad de las veces {quantity === 1 ? 'lo consigues' : 'los juntas'} en{' '}
                  <strong>{formatPlain(medianQty)} kills</strong> o menos.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="drop-row">
          <label className="drop-field">
            <span>Kills que vas a hacer</span>
            <input
              type="number"
              min="0"
              step="1"
              value={kills}
              onChange={(event) => setKills(event.target.value)}
            />
          </label>
          <div className="drop-readout">
            {killCount <= 0 && <p>Con 0 kills no sale ninguno.</p>}
            {killCount > 0 && p <= 0 && <p>En promedio sacas <strong>0</strong>.</p>}
            {killCount > 0 && p >= 1 && (
              <p>Sacas <strong>{killCount.toLocaleString('es')}</strong>.</p>
            )}
            {killCount > 0 && p > 0 && p < 1 && (
              <>
                <p>En promedio sacas <strong>{withSpread(expectedItems, itemSpread)}</strong>.</p>
                <p>Chance de sacar al menos uno: <strong>{formatChance(atLeastOne)}</strong>.</p>
                <p>Chance de no sacar ninguno: <strong>{formatChance(none)}</strong>.</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DropCalculator;
