import { useMemo, useState } from 'react';
import { bountyBoards, type BountyBoard } from '../data/bounties';
import '../styles/Information.css';

type ViewMode = 'city' | 'level';

const rangeKey = (minLevel: number, maxLevel: number) => `${minLevel}-${maxLevel}`;

const rangeLabel = (minLevel: number, maxLevel: number) =>
  maxLevel > 0 ? `Nivel ${minLevel}–${maxLevel}` : `Nivel ${minLevel}+`;

const BountyBoards = ({ embedded = false }: { embedded?: boolean }) => {
  const [mode, setMode] = useState<ViewMode>('city');
  const [city, setCity] = useState<string>(bountyBoards[0]?.city ?? '');
  const [levelKey, setLevelKey] = useState<string>('');

  const levelRanges = useMemo(() => {
    const ranges = new Map<string, { minLevel: number; maxLevel: number }>();

    bountyBoards.forEach((entry) => {
      entry.boards.forEach((board) => {
        ranges.set(rangeKey(board.minLevel, board.maxLevel), {
          minLevel: board.minLevel,
          maxLevel: board.maxLevel,
        });
      });
    });

    return Array.from(ranges.values()).sort(
      (a, b) =>
        a.minLevel - b.minLevel ||
        (a.maxLevel || Number.MAX_SAFE_INTEGER) - (b.maxLevel || Number.MAX_SAFE_INTEGER),
    );
  }, []);

  const selectedCity = bountyBoards.find((entry) => entry.city === city);
  const firstRange = levelRanges[0];
  const effectiveLevelKey = levelKey || (firstRange ? rangeKey(firstRange.minLevel, firstRange.maxLevel) : '');
  const selectedRange = levelRanges.find(
    (range) => rangeKey(range.minLevel, range.maxLevel) === effectiveLevelKey,
  );

  const levelEntries = useMemo(() => {
    if (!selectedRange) return [];

    return bountyBoards
      .flatMap((entry) =>
        entry.boards
          .filter(
            (board) =>
              board.minLevel === selectedRange.minLevel &&
              board.maxLevel === selectedRange.maxLevel,
          )
          .map((board) => ({ city: entry.city, board })),
      )
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [selectedRange]);

  const renderBoard = (board: BountyBoard, heading: string, key: string) => (
    <div className="bounty-board" key={key}>
      <h3>{heading}</h3>
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
  );

  return (
    <div className={embedded ? 'bounty-boards' : 'info-content'}>
      {embedded ? <h3>Bounty Boards</h3> : <h2>Bounty Boards</h2>}
      <div className="content-section">
        <p>
          Tablones de caza por ciudad. Podés verlos agrupados por ciudad o filtrar un
          rango de nivel para comparar todas las bounties disponibles. Las recompensas
          son Base EXP / Job EXP.
        </p>

        <div className="bounty-selectors">
          <label className="bounty-select-label">
            Ver por:
            <select
              className="bounty-select"
              value={mode}
              onChange={(event) => setMode(event.target.value as ViewMode)}
            >
              <option value="city">Ciudad</option>
              <option value="level">Rango de nivel</option>
            </select>
          </label>

          {mode === 'city' ? (
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
          ) : (
            <label className="bounty-select-label">
              Rango:
              <select
                className="bounty-select"
                value={effectiveLevelKey}
                onChange={(event) => setLevelKey(event.target.value)}
              >
                {levelRanges.map((range) => (
                  <option
                    key={rangeKey(range.minLevel, range.maxLevel)}
                    value={rangeKey(range.minLevel, range.maxLevel)}
                  >
                    {rangeLabel(range.minLevel, range.maxLevel)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {mode === 'city' &&
          selectedCity?.boards.map((board, index) =>
            renderBoard(
              board,
              rangeLabel(board.minLevel, board.maxLevel),
              `${selectedCity.city}-${index}`,
            ),
          )}

        {mode === 'level' &&
          levelEntries.map((entry, index) =>
            renderBoard(
              entry.board,
              `${entry.city} — ${rangeLabel(entry.board.minLevel, entry.board.maxLevel)}`,
              `${entry.city}-${index}`,
            ),
          )}

        <p className="bounty-note">
          {mode === 'city'
            ? `Total: ${bountyBoards.length} ciudades. Los rangos con “+” no tienen tope superior.`
            : `Total: ${levelEntries.length} tableros en ${new Set(levelEntries.map((entry) => entry.city)).size} ciudades para este rango.`}
        </p>
      </div>
    </div>
  );
};

export default BountyBoards;
