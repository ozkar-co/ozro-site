import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { SpriteRect } from '../api/assets';
import type { MobSpawnMapSummary, MobSpawnPoint } from '../api/client';
import AtlasSprite from './AtlasSprite';
import { fetchFarmingMob, type FarmingMob } from '../api/farming';

interface MobDrop {
  id: number;
  type: 'normal' | 'card' | 'mvp';
  per: number;
  itemName: string;
  itemIcon: SpriteRect | string;
}

interface MobSummon {
  mobId: number;
  mobAegis?: string | null;
  mobName: string;
  amount: number;
  conditions?: string[];
}

interface MobResult {
  id: string;
  name: string;
  name2: string;
  sprite: SpriteRect | string;
  hp: number;
  lvl: number;
  def: number;
  mdef: number;
  atk: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
  exp: number;
  jexp: number;
  mexp: number;
  element: number;
  size: number;
  race: number;
  drop: MobDrop[];
  mode?: number[];
  activeModes?: string[];
  mobClass?: string;
  attack2?: number;
  sp?: number;
  walkSpeed?: number;
  code_name?: string;
  spawns?: MobSpawnPoint[];
  spawnMaps?: MobSpawnMapSummary[];
  spawnMapCount?: number;
  spawnAmount?: number;
  hasWorldSpawn?: boolean;
  summons?: MobSummon[];
}

const MOB_SIZE = {
  0: "Pequeño",
  1: "Mediano",
  2: "Grande"
} as const;


const MOB_MODES = {
  0: "CANMOVE",
  1: "LOOTER",
  2: "AGGRESSIVE",
  3: "ASSIST",
  4: "CASTSENSOR",
  5: "BOSS",
  6: "PLANT",
  7: "CANATTACK",
  8: "DETECTOR",
  //9: "CASTSENSOR_CHASE",
  10: "CHANGECHASE",
  //11: "ANGRY",
  //12: "CHANGETARGET_MELEE",
  //13: "CHANGETARGET_CHASE",
  //14: "TARGETWEAK",
  15: "NOKNOCKBACK",
  //16: "RANDOMTARGET",
} as const;

const MOB_RACES = {
  0: "Amorfo",
  1: "No-Muerto",
  2: "Bestia",
  3: "Planta",
  4: "Insecto",
  5: "Pez",
  6: "Demonio",
  7: "Humanoide",
  8: "Angel",
  9: "Dragón"
} as const;

const MOB_ELEMENTS = {
  0: "Neutral",
  1: "Agua",
  2: "Tierra",
  3: "Fuego",
  4: "Viento",
  5: "Veneno",
  6: "Sagrado",
  7: "Oscuridad",
  8: "Fantasma",
  9: "No-Muerto"
} as const;

const getSizeName = (size: number): string => {
  return MOB_SIZE[size as keyof typeof MOB_SIZE] || `Unknown (${size})`;
};

const getRaceName = (race: number): string => {
  return MOB_RACES[race as keyof typeof MOB_RACES] || `Unknown (${race})`;
};

const getElementName = (element: number): string => {
  const level = Math.floor(element / 20) + 1;
  const elementId = element - ((level - 1) * 20);
  const elementName = MOB_ELEMENTS[elementId as keyof typeof MOB_ELEMENTS];
  return elementName ? `${elementName} ${level}` : `Unknown (${element})`;
};

const displayStat = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'NA';
  return value.toLocaleString();
};

interface MobCardProps {
  result: MobResult;
  compact?: boolean;
}

const MobCard: React.FC<MobCardProps> = ({ result, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [farming, setFarming] = useState<FarmingMob | null>(null);
  const [farmingOpen, setFarmingOpen] = useState(false);
  const [farmingLoading, setFarmingLoading] = useState(false);
  const [farmingError, setFarmingError] = useState<string | null>(null);

  const toggleFarming = async () => {
    if (farmingOpen) {
      setFarmingOpen(false);
      return;
    }
    setFarmingOpen(true);
    if (farming || farmingLoading) return;

    setFarmingLoading(true);
    setFarmingError(null);
    try {
      const data = await fetchFarmingMob(result.id);
      setFarming(data);
    } catch (error) {
      setFarmingError(error instanceof Error ? error.message : 'No se pudo calcular el MZW');
    } finally {
      setFarmingLoading(false);
    }
  };

  if (compact && !expanded) {
    const kind = result.mobClass || getRaceName(result.race);
    return (
      <div
        className="result-card result-card--compact result-card--compact-clickable"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(true);
          }
        }}
      >
        <span className="result-card-compact-text">
          <span className="name-title">{result.name}</span>
          {' · '}
          <span className="result-card-id">#{result.id}</span>
          {' · '}
          <span className="mob-level">Nv. {result.lvl} · {kind}</span>
          <span className="result-card-compact-hint"> · clic para desplegar</span>
        </span>
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="result-card-content">
        <div className="result-card-image">
            {result.mexp > 0 && (
            <div className="mvp-icon">
              <img src="/icons/mvp.gif" alt="MVP" />
            </div>
            )}
            <AtlasSprite sprite={result.sprite} alt={result.name} />
        </div>
        <div className="result-card-info">
          <div className="result-card-header">
            <div className="result-card-title">
              <div className="title-container">
                <div className="title-row">
                  <h3>
                    <span className="name-title"><Link to={`/database?tab=mobs&q=${result.id}`}>{result.name}</Link></span>
                    {' '}
                    <span className="name-details">
                      [{result.name2} / {result.code_name}]
                    </span>
                    {' '}
                    <span className="result-card-id">(#{result.id})</span>
                  </h3>
                  <span className="mob-level">
                    Nivel {result.lvl}
                    {result.mobClass ? ` · ${result.mobClass}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="result-card-section mob-spawn-section">
            <div className="mob-spawn-header">Spawns:</div>
            {result.spawnMaps && result.spawnMaps.length > 0 ? (
              <div className="mob-spawn-list">
                {result.spawnMaps.map((spawn) => (
                  <Link
                    key={spawn.map}
                    to={`/database?tab=maps&map=${encodeURIComponent(spawn.map)}`}
                    className={`mob-spawn-map${spawn.instance ? ' is-instance' : ''}`}
                    title={`${spawn.points} punto(s) de spawn · ${spawn.amount} mobs`}
                  >
                    {spawn.map}
                    <span className="mob-spawn-amount">{spawn.amount}</span>
                    {spawn.boss && <span className="mob-spawn-badge">Boss</span>}
                    {spawn.instance && <span className="mob-spawn-badge">Instancia</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mob-spawn-empty">
                {result.hasWorldSpawn === false
                  ? 'Sin spawn en mapas del mundo'
                  : 'Sin datos de spawn'}
              </div>
            )}
          </div>

          {result.spawns && result.spawns.length > 0 && (
            <div className="result-card-section mob-spawn-detail">
              <div className="result-card-script-header">Puntos de spawn:</div>
              <div className="mob-spawn-detail-list">
                {result.spawns.map((spawn, index) => (
                  <div
                    key={`${spawn.map}-${spawn.x}-${spawn.y}-${index}`}
                    className={`mob-spawn-detail-row${spawn.instance ? ' is-instance' : ''}`}
                  >
                    <Link to={`/database?tab=maps&map=${encodeURIComponent(spawn.map)}`}>{spawn.map}</Link>
                    <span>{spawn.x === 0 && spawn.y === 0 ? 'aleatorio' : `${spawn.x}, ${spawn.y}`}</span>
                    <span>{spawn.amount} mobs</span>
                    <span>{(spawn.delay / 1000).toLocaleString('es')}s respawn</span>
                    {spawn.boss && <span className="mob-spawn-badge">Boss</span>}
                    {spawn.instance && <span className="mob-spawn-badge">Instancia</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primera fila: HP, ATK, DEF/MDEF */}
          <div className="result-card-section">
            <div className="result-card-properties">
              <div className="result-card-property">
                <span className="property-label">HP</span>
                <span className="property-value">{displayStat(result.hp)}</span>
              </div>
              <div className="result-card-property">
                <span className="property-label">ATK</span>
                <span className="property-value">
                  {result.attack2 != null && result.attack2 !== result.atk
                    ? `${displayStat(result.atk)}-${displayStat(result.attack2)}`
                    : displayStat(result.atk)}
                </span>
              </div>
              {result.sp != null && result.sp > 0 && (
                <div className="result-card-property">
                  <span className="property-label">SP</span>
                  <span className="property-value">{result.sp.toLocaleString()}</span>
                </div>
              )}
              <div className="result-card-property">
                <span className="property-label">DEF/MDEF</span>
                <span className="property-value">{`${displayStat(result.def)}/${displayStat(result.mdef)}`}</span>
              </div>
            </div>
          </div>

          {/* Nueva fila: Base EXP, Job EXP, MVP EXP */}
          <div className="result-card-section">
            <div className="result-card-properties">
              <div className="result-card-property">
                <span className="property-label">Base EXP</span>
                <span className="property-value">{result.exp != null ? result.exp.toLocaleString() : 'NA'}</span>
              </div>
              <div className="result-card-property">
                <span className="property-label">Job EXP</span>
                <span className="property-value">{result.jexp != null ? result.jexp.toLocaleString() : 'NA'}</span>
              </div>
              {result.mexp > 0 && (
                <div className="result-card-property">
                  <span className="property-label">MVP EXP</span>
                  <span className="property-value">{result.mexp.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Segunda fila: Raza, Elemento, Tamaño */}
          <div className="result-card-section">
            <div className="result-card-properties">
              <div className="result-card-property">
                <span className="property-label">Raza</span>
                <span className="property-value">{getRaceName(result.race)}</span>
              </div>
              <div className="result-card-property">
                <span className="property-label">Elemento</span>
                <span className="property-value">{getElementName(result.element)}</span>
              </div>
              <div className="result-card-property">
                <span className="property-label">Tamaño</span>
                <span className="property-value">{getSizeName(result.size)}</span>
              </div>
            </div>
          </div>

          {/* Tercera fila: Stats y Modos */}
          <div className="result-card-section stats-modes-grid">
            <div className="result-card-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">STR</span>
                  <span className="stat-value">{displayStat(result.str)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">AGI</span>
                  <span className="stat-value">{displayStat(result.agi)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">VIT</span>
                  <span className="stat-value">{displayStat(result.vit)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">INT</span>
                  <span className="stat-value">{displayStat(result.int)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">DEX</span>
                  <span className="stat-value">{displayStat(result.dex)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">LUK</span>
                  <span className="stat-value">{displayStat(result.luk)}</span>
                </div>
              </div>
            </div>
            <div className="result-card-modes">
              {result.activeModes && result.activeModes.length > 0 ? (
                <div className="modes-active-list">
                  {result.activeModes.map((mode) => (
                    <span key={mode} className="mode-tag mode-tag-active">{mode}</span>
                  ))}
                </div>
              ) : (
                <div className="modes-grid">
                {Object.entries(MOB_MODES)
                  .map(([modeId, modeName]) => ({
                    id: modeId,
                    name: modeName,
                    isActive: result.mode?.includes(Number(modeId))
                  }))
                  .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))
                  .map(({ id, name, isActive }) => (
                    <div key={id} className={`mode-item ${isActive ? 'mode-item-active' : ''}`}>
                      <span>{name} :</span><strong> {isActive ? 'SI' : 'NO'}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>



          {result.drop && result.drop.filter(d => d.per > 0).length > 0 && (
            <div className="result-card-section">
              <div className="result-card-drops">
                <div className="result-card-drops-grid normal-drops">
                  {result.drop
                    .filter(d => d.per > 0)
                    .map((drop, index) => {
                      // Convertir el nombre a Title Case y truncar si es necesario
                      const formattedName = drop.itemName
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                      
                      const truncatedName = formattedName.length > 20 
                        ? formattedName.substring(0, 20) + '...'
                        : formattedName;
                      
                      return (
                        <div key={`${drop.id}-${index}`} className={`result-card-drop ${drop.type}`}>
                          <AtlasSprite
                            sprite={drop.itemIcon}
                            alt={formattedName}
                            className="drop-icon"
                          />
                          <span className="drop-name">
                            <Link to={`/database?tab=items&q=${drop.id}`}>{truncatedName}</Link>{drop.type === 'mvp' ? ' (MVP)' : ''}
                          </span>
                          <span className="drop-chance">
                            {(Math.min(drop.per, 10000) / 100).toFixed(2)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
          {result.summons && result.summons.length > 0 && (
            <div className="result-card-section">
              <div className="mob-summons">
                <h4>Invocaciones</h4>
                <ul>
                  {result.summons.map((summon) => (
                    <li key={`${summon.mobId}-${summon.amount}`}>
                      <Link to={`/database?tab=mobs&q=${summon.mobId}`}>{summon.mobName}</Link>
                      {summon.amount > 1 ? ` x${summon.amount}` : ''}
                      {summon.conditions && summon.conditions.length > 0
                        ? ` · ${summon.conditions.join(', ')}`
                        : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="result-card-section mob-farm-section">
            <button
              type="button"
              className="result-card-toggle"
              onClick={toggleFarming}
              aria-expanded={farmingOpen}
            >
              {farmingOpen ? 'Ocultar MZW' : 'Calcular MZW'}
            </button>
            {farmingOpen && (
              <>
                {farmingLoading && <div className="mob-farm-note">Calculando MZW...</div>}
                {farmingError && <div className="mob-farm-note is-error">{farmingError}</div>}
                {farming && (
                  <div className="mob-farm-result">
                    <div className="mob-farm-metrics">
                      <div>
                        <span>MZW</span>
                        <strong>{Math.round(farming.mzw).toLocaleString('es')} z</strong>
                      </div>
                      <div>
                        <span>Zeny/HP</span>
                        <strong>{farming.zenyPerHp.toFixed(3)}</strong>
                      </div>
                      <div>
                        <span>Drops</span>
                        <strong>{farming.dropCount}</strong>
                      </div>
                    </div>
                    <div className="mob-farm-note">
                      Valor NPC bruto, sin penalización por nivel. Los drops MVP se muestran separados.
                    </div>
                    <div className="mob-farm-drops">
                      {farming.drops.map((drop, index) => (
                        <div key={`${drop.id}-${drop.type}-${index}`}>
                          <span>{drop.name}</span>
                          <span>{drop.type === 'mvp' ? 'MVP' : 'Normal'}</span>
                          <span>{drop.chancePercent.toFixed(2)}%</span>
                          <span>{Math.round(drop.expected).toLocaleString('es')} z</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobCard;
export type { MobResult };
export { MOB_SIZE, MOB_MODES, MOB_ELEMENTS, MOB_RACES }; 