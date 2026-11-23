import { useState } from 'react';
import '../../styles/DropCalculator.css';

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

function formatKills(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.ceil(value);
  if (rounded >= 1_000_000_000) {
    return `${numberFormat.format(rounded / 1_000_000_000)} mil millones`;
  }
  if (rounded >= 1_000_000) {
    return `${numberFormat.format(rounded / 1_000_000)} millones`;
  }
  if (rounded >= 10_000) {
    return `${numberFormat.format(rounded / 1_000)} mil`;
  }
  return numberFormat.format(rounded);
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 100) return numberFormat.format(Math.round(value));
  if (value >= 10) {
    return value.toLocaleString('es', { maximumFractionDigits: 1 });
  }
  return value.toLocaleString('es', { maximumFractionDigits: 2 });
}

function formatChance(probability: number): string {
  if (!Number.isFinite(probability) || probability <= 0) return '0%';
  if (probability >= 1) return '100%';
  const percent = probability * 100;
  if (percent < 0.01) return '< 0,01%';
  if (percent > 99.99) return '> 99,99%';
  return `${percent.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
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

/** Kills en los que la mitad de los intentos ya consiguió la cantidad. */
function medianKills(quantity: number, p: number): number {
  if (p >= 1) return quantity;
  if (!(p > 0) || quantity / p > 1e15) return Infinity;
  if (quantity <= 1) {
    return Math.ceil(Math.log(0.5) / Math.log(1 - p));
  }

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

  const perItem = p > 0 ? 1 / p : Infinity;
  const expectedKills = quantity !== null && p > 0 ? quantity / p : Infinity;
  const median = quantity !== null ? medianKills(quantity, p) : Infinity;
  const expectedItems = killCount * p;
  const spread = expectedItems >= 1
    ? Math.round(Math.sqrt(killCount * p * (1 - p)))
    : 0;
  const atLeastOne = chanceAtLeastOne(killCount, p);
  const atLeastQty = quantity !== null ? probAtLeast(killCount, quantity, p) : 0;
  const showSkewNote = Number.isFinite(median) && Number.isFinite(expectedKills) && expectedKills > median + 1;

  let balance = 'Indica una probabilidad y una cantidad.';
  if (p <= 0) {
    balance = 'Con 0% no sale ninguno.';
  } else if (killCount <= 0) {
    balance = 'Con 0 kills no sale ninguno.';
  } else if (quantity !== null) {
    const diff = expectedItems - quantity;
    const target = quantity === 1
      ? 'el que quieres'
      : `los ${quantity.toLocaleString('es')} que quieres`;
    if (Math.abs(diff) < 0.05) {
      balance = 'El promedio da justo con la cantidad que quieres. Igual no es seguro.';
    } else if (diff > 0) {
      balance = `Para ${target}, en promedio te sobran unos ${formatCount(diff)}.`;
    } else {
      balance = `Para ${target}, en promedio te faltan unos ${formatCount(-diff)}.`;
    }
  }

  return (
    <div className="drop-panel">
      <div className="drop-intro">
        <h2>Calculadora de drops</h2>
        <p>
          Cada kill es un intento nuevo: el juego no acumula los que fallaron.
          Estos números son promedios para planear el farmeo. No aseguran que el
          objeto salga en esa cantidad de kills.
        </p>
      </div>

      <section className="drop-card">
        <h3>¿Cuántos kills para conseguir lo que buscas?</h3>

        <div className="drop-controls">
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
        </div>

        <div className="drop-results">
          <div>
            <span>Por objeto</span>
            <strong>{p >= 1 ? 'Sale en cada kill' : p > 0 ? `1 cada ${formatKills(perItem)} kills` : 'No sale'}</strong>
          </div>
          <div>
            <span>
              {quantity !== null
                ? `Para conseguir ${quantity.toLocaleString('es')}`
                : 'Para conseguirlos'}
            </span>
            <strong>
              {quantity !== null && p > 0
                ? `${formatKills(expectedKills)} kills en promedio`
                : '—'}
            </strong>
          </div>
          <div>
            <span>La mitad de las veces</span>
            <strong>
              {quantity !== null && p > 0
                ? `en ${formatKills(median)} kills o menos`
                : '—'}
            </strong>
          </div>
        </div>

        {showSkewNote && (
          <p className="drop-note">
            El promedio no es una garantía. Si el drop se atrasa, a veces se atrasa
            mucho, y eso deja el promedio por encima de la mitad de las veces.
          </p>
        )}

        <div className="drop-simulation">
          <p>
            Si haces <strong>{killCount.toLocaleString('es')} kills</strong>, en promedio sacas{' '}
            <strong>{formatCount(expectedItems)}</strong>.
            {spread >= 1 && (
              <>
                {' '}Lo normal es quedar cerca de ese número: puede subir o bajar alrededor de{' '}
                <strong>{spread.toLocaleString('es')}</strong>.
              </>
            )}
          </p>
          <p>
            Chance de sacar al menos uno: <strong>{formatChance(atLeastOne)}</strong>.
            {quantity !== null && quantity > 1 && (
              <>
                {' '}Chance de juntar los {quantity.toLocaleString('es')}:{' '}
                <strong>{formatChance(atLeastQty)}</strong>.
              </>
            )}
          </p>
          <p>{balance}</p>
        </div>
      </section>
    </div>
  );
};

export default DropCalculator;
