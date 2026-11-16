import { useEffect, useMemo, useState } from 'react';
import {
  loadLevelPenalty,
  penaltyRate,
  type LevelPenaltyData
} from '../../api/penaltyData';
import '../../styles/References.css';

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

function formatKills(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000) return `${numberFormat.format(Math.round(value / 1000))}k`;
  return numberFormat.format(Math.ceil(value));
}

function DropChanceCalculator() {
  const [chance, setChance] = useState('1');
  const [kills, setKills] = useState('100');

  const p = Math.max(0, Math.min(1, Number(chance) / 100 || 0));
  const killCount = Math.max(0, Math.floor(Number(kills) || 0));

  const expected = p > 0 ? 1 / p : Infinity;
  const probabilityAfter = p >= 1
    ? 1
    : p > 0
      ? 1 - Math.pow(1 - p, killCount)
      : 0;

  const killsFor = (target: number): number => {
    if (p >= 1) return 1;
    if (p <= 0) return Infinity;
    return Math.ceil(Math.log(1 - target) / Math.log(1 - p));
  };

  return (
    <section className="ref-card">
      <h3>¿Cuántos kills para obtener un objeto?</h3>
      <p>
        Los drops son eventos independientes. La probabilidad de obtener al menos uno
        después de N kills es <code>1 - (1 - p)^N</code>; nunca llega a 100%.
      </p>

      <div className="ref-controls">
        <label className="ref-field">
          <span>Chance por kill (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={chance}
            onChange={(event) => setChance(event.target.value)}
          />
        </label>
        <label className="ref-field">
          <span>Kills a simular</span>
          <input
            type="number"
            min="0"
            step="1"
            value={kills}
            onChange={(event) => setKills(event.target.value)}
          />
        </label>
      </div>

      <div className="ref-results">
        <div>
          <span>Media esperada</span>
          <strong>{formatKills(expected)} kills</strong>
        </div>
        <div>
          <span>95% de certeza</span>
          <strong>{formatKills(killsFor(0.95))} kills</strong>
        </div>
        <div>
          <span>98% de certeza</span>
          <strong>{formatKills(killsFor(0.98))} kills</strong>
        </div>
        <div>
          <span>99% de certeza</span>
          <strong>{formatKills(killsFor(0.99))} kills</strong>
        </div>
      </div>

      <div className="ref-simulation">
        Con {killCount.toLocaleString('es')} kills tienes{' '}
        <strong>{(probabilityAfter * 100).toFixed(2)}%</strong> de probabilidad de
        obtener al menos uno.
      </div>
    </section>
  );
}

function LevelPenaltyReference() {
  const [data, setData] = useState<LevelPenaltyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerLevel, setPlayerLevel] = useState('99');
  const [mobLevel, setMobLevel] = useState('99');

  useEffect(() => {
    let cancelled = false;
    loadLevelPenalty()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la tabla');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const result = [];
    for (let difference = -30; difference <= 30; difference += 1) {
      result.push({
        difference,
        drop: penaltyRate(data, 'drop', difference),
        exp: penaltyRate(data, 'exp', difference)
      });
    }
    return result;
  }, [data]);

  const player = Number(playerLevel);
  const mob = Number(mobLevel);
  const difference = Number.isFinite(player) && Number.isFinite(mob) ? mob - player : 0;

  return (
    <section className="ref-card">
      <h3>Penalización por diferencia de nivel</h3>
      <p>
        Valores exactos de rAthena renewal, incluyendo los overrides de
        <code> db/import/level_penalty.yml</code>. La penalización de drop también se
        aplica a los drops normales; los drops MVP no tienen entrada y no se penalizan.
        Fuera del rango -30..+30 se mantiene el valor del extremo. La calculadora
        respeta MD_FIXEDITEMDROP, pero no los mapflags que desactivan la penalización.
      </p>

      {error && <div className="ref-error">{error}</div>}
      {!data && !error && <div className="ref-loading">Cargando tabla...</div>}

      {data && (
        <>
          <div className="ref-controls">
            <label className="ref-field">
              <span>Nivel del personaje</span>
              <input
                type="number"
                min="1"
                max={data.maxLevel}
                value={playerLevel}
                onChange={(event) => setPlayerLevel(event.target.value)}
              />
            </label>
            <label className="ref-field">
              <span>Nivel del mob</span>
              <input
                type="number"
                min="1"
                max={data.maxLevel}
                value={mobLevel}
                onChange={(event) => setMobLevel(event.target.value)}
              />
            </label>
          </div>

          <div className="ref-simulation">
            Diferencia <strong>{difference}</strong>: drop{' '}
            <strong>{penaltyRate(data, 'drop', difference)}%</strong> · EXP{' '}
            <strong>{penaltyRate(data, 'exp', difference)}%</strong>
          </div>

          <div className="ref-table-wrap">
            <table className="ref-table">
              <thead>
                <tr>
                  <th>Diferencia</th>
                  <th>Drop</th>
                  <th>EXP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.difference} className={row.difference === difference ? 'highlight' : ''}>
                    <td>{row.difference > 0 ? `+${row.difference}` : row.difference}</td>
                    <td>{row.drop}%</td>
                    <td>{row.exp}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

const References = () => (
  <div className="ref-panel">
    <div className="ref-intro">
      <h2>Referencias</h2>
      <p>
        Tablas y cálculos auxiliares para interpretar los datos de farmeo. La tabla
        de penalización se genera desde el código y la configuración de rAthena.
      </p>
    </div>
    <DropChanceCalculator />
    <LevelPenaltyReference />
  </div>
);

export default References;
