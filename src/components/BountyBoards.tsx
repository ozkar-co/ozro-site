import { useState } from 'react';
import { bountyBoards } from '../data/bounties';
import '../styles/Information.css';

const BountyBoards = () => {
  const [city, setCity] = useState<string>(bountyBoards[0]?.city ?? '');
  const selected = bountyBoards.find((entry) => entry.city === city);

  return (
    <div className="info-content">
      <h2>Bounty Boards</h2>
      <div className="content-section">
        <p>
          Tablones de caza por ciudad. Elegí una ciudad para ver los rangos de nivel y
          los monstruos que pide cada tablero. Las recompensas son Base EXP / Job EXP.
        </p>

        <label className="bounty-select-label">
          Ciudad:
          <select
            className="bounty-select"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          >
            {bountyBoards.map((entry) => (
              <option key={entry.city} value={entry.city}>
                {entry.city}
              </option>
            ))}
          </select>
        </label>

        {selected?.boards.map((board, index) => (
          <div className="bounty-board" key={`${selected.city}-${index}`}>
            <h3>
              {board.maxLevel > 0
                ? `Nivel ${board.minLevel}–${board.maxLevel}`
                : `Nivel ${board.minLevel}+`}
            </h3>
            <table className="bounty-table">
              <thead>
                <tr>
                  <th>Monstruo</th>
                  <th>Base EXP</th>
                  <th>Job EXP</th>
                </tr>
              </thead>
              <tbody>
                {board.monsters.map((monster) => (
                  <tr key={monster.questId}>
                    <td>{monster.name}</td>
                    <td>{monster.baseExp.toLocaleString('es-AR')}</td>
                    <td>{monster.jobExp.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <p className="bounty-note">
          Total: {bountyBoards.length} ciudades. Los rangos con “+” no tienen tope superior.
        </p>
      </div>
    </div>
  );
};

export default BountyBoards;
