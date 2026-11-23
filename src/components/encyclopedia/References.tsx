import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  loadLevelPenalty,
  penaltyRate,
  type LevelPenaltyData
} from '../../api/penaltyData';
import '../../styles/References.css';

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
        Tabla de penalización por diferencia de nivel, generada desde el código y
        la configuración de rAthena. Para estimar kills y drops, usa la{' '}
        <Link to="/encyclopedia?tab=drops">calculadora de drops</Link>.
      </p>
    </div>
    <LevelPenaltyReference />
  </div>
);

export default References;
