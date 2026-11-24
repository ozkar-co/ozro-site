import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { SpriteRect } from '../api/assets';
import type { MobSpawnMapSummary, MobSpawnPoint } from '../api/client';
import AtlasSprite from './AtlasSprite';
import { fetchFarmingMob, type FarmingMob } from '../api/farming';
import { formatFilterLabel } from '../api/databaseMappers';
import { formatMobNameDetails } from '../utils/nameDetails';
import { isPlaceholderAsset } from '../api/placeholders';

interface MobDrop {
  id: number;
  type: string | null;
  per: number;
  chancePercent?: number | null;
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
  nameJapanese?: string | null;
  nameAegis?: string;
  sprite: SpriteRect | string;
  hp: number | null;
  lvl: number | null;
  def: number | null;
  mdef: number | null;
  atk: number | null;
  str: number | null;
  agi: number | null;
  vit: number | null;
  int: number | null;
  dex: number | null;
  luk: number | null;
  exp: number | null;
  jexp: number | null;
  mexp: number | null;
  element: string | null;
  elementLevel?: number | null;
  size: string | null;
  race: string | null;
  isMvp?: boolean | null;
  drop: MobDrop[];
  activeModes?: string[] | null;
  mobClass?: string | null;
  attack2?: number | null;
  sp?: number | null;
  walkSpeed?: number | null;
  spawns?: MobSpawnPoint[];
  spawnMaps?: MobSpawnMapSummary[];
  spawnMapCount?: number;
  spawnAmount?: number;
  hasWorldSpawn?: boolean;
  summons?: MobSummon[];
}

const displayStat = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return value.toLocaleString();
};

const formatElement = (element: string | null | undefined, level: number | null | undefined): string | null => {
  if (!element) return null;
  const label = formatFilterLabel(element);
  return level != null ? `${label} ${level}` : label;
};

interface MobCardProps {
  result: MobResult;
  compact?: boolean;
}

const MOB_SPRITE_FIT = { maxWidth: 96, maxHeight: 96 };

const MobCard: React.FC<MobCardProps> = ({ result, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [spriteModalOpen, setSpriteModalOpen] = useState(false);
  const [farming, setFarming] = useState<FarmingMob | null>(null);
  const [farmingOpen, setFarmingOpen] = useState(false);
  const [farmingLoading, setFarmingLoading] = useState(false);
  const [farmingError, setFarmingError] = useState<string | null>(null);

  const closeSpriteModal = useCallback(() => setSpriteModalOpen(false), []);
  const canOpenSprite = !isPlaceholderAsset(result.sprite);

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
    const kind = result.mobClass || (result.race ? formatFilterLabel(result.race) : null);
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
          <span className="mob-level">Nv. {result.lvl ?? '?'}{kind ? ` · ${kind}` : ''}</span>
          <span className="result-card-compact-hint"> · clic para desplegar</span>
        </span>
      </div>
    );
  }

  const nameDetailsText = formatMobNameDetails(result.nameJapanese, result.nameAegis);

  return (
    <div className="result-card">
      <div className="result-card-content">
        <div className="result-card-image">
            {result.isMvp === true && (
            <div className="mvp-icon">
              <img src="/icons/mvp.gif" alt="MVP" />
            </div>
            )}
            <button
              type="button"
              className={`result-card-image-button${canOpenSprite ? '' : ' is-static'}`}
              onClick={() => {
                if (canOpenSprite) setSpriteModalOpen(true);
              }}
              disabled={!canOpenSprite}
              aria-label={canOpenSprite ? `Ver sprite de ${result.name}` : undefined}
              title={canOpenSprite ? 'Ver sprite completo' : undefined}
            >
              <AtlasSprite
                sprite={result.sprite}
                alt={result.name}
                fit={MOB_SPRITE_FIT}
              />
            </button>
        </div>
        <div className="result-card-info">
          <div className="result-card-header">
            <div className="result-card-title">
              <div className="title-container">
                <div className="title-row">
                  <h3>
                    <span className="name-title"><Link to={`/database?tab=mobs&q=${result.id}`}>{result.name}</Link></span>
                    {' '}
                    {nameDetailsText && (
                      <>
                        <span className="name-details">{nameDetailsText}</span>
                        {' '}
                      </>
                    )}
                    <span className="result-card-id">(#{result.id})</span>
                  </h3>
                  <span className="mob-level">
                    {result.lvl != null ? `Nivel ${result.lvl}` : null}
                    {result.mobClass ? `${result.lvl != null ? ' · ' : ''}${formatFilterLabel(result.mobClass)}` : ''}
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

          <div className="result-card-section">
            <div className="result-card-properties">
              {displayStat(result.hp) != null && (
                <div className="result-card-property">
                  <span className="property-label">HP</span>
                  <span className="property-value">{displayStat(result.hp)}</span>
                </div>
              )}
              {displayStat(result.atk) != null && (
                <div className="result-card-property">
                  <span className="property-label">ATK</span>
                  <span className="property-value">
                    {result.attack2 != null && result.attack2 !== result.atk
                      ? `${displayStat(result.atk)}-${displayStat(result.attack2)}`
                      : displayStat(result.atk)}
                  </span>
                </div>
              )}
              {result.sp != null && (
                <div className="result-card-property">
                  <span className="property-label">SP</span>
                  <span className="property-value">{result.sp.toLocaleString()}</span>
                </div>
              )}
              {(displayStat(result.def) != null || displayStat(result.mdef) != null) && (
                <div className="result-card-property">
                  <span className="property-label">DEF/MDEF</span>
                  <span className="property-value">
                    {`${displayStat(result.def) ?? '—'}/${displayStat(result.mdef) ?? '—'}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="result-card-section">
            <div className="result-card-properties">
              {result.exp != null && (
                <div className="result-card-property">
                  <span className="property-label">Base EXP</span>
                  <span className="property-value">{result.exp.toLocaleString()}</span>
                </div>
              )}
              {result.jexp != null && (
                <div className="result-card-property">
                  <span className="property-label">Job EXP</span>
                  <span className="property-value">{result.jexp.toLocaleString()}</span>
                </div>
              )}
              {result.mexp != null && (
                <div className="result-card-property">
                  <span className="property-label">MVP EXP</span>
                  <span className="property-value">{result.mexp.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="result-card-section">
            <div className="result-card-properties">
              {result.race && (
                <div className="result-card-property">
                  <span className="property-label">Raza</span>
                  <span className="property-value">{formatFilterLabel(result.race)}</span>
                </div>
              )}
              {formatElement(result.element, result.elementLevel) && (
                <div className="result-card-property">
                  <span className="property-label">Elemento</span>
                  <span className="property-value">
                    {formatElement(result.element, result.elementLevel)}
                  </span>
                </div>
              )}
              {result.size && (
                <div className="result-card-property">
                  <span className="property-label">Tamaño</span>
                  <span className="property-value">{formatFilterLabel(result.size)}</span>
                </div>
              )}
              {result.mobClass && (
                <div className="result-card-property">
                  <span className="property-label">Clase</span>
                  <span className="property-value">{formatFilterLabel(result.mobClass)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="result-card-section stats-modes-grid">
            <div className="result-card-stats">
              <div className="stats-grid">
                {([
                  ['STR', result.str],
                  ['AGI', result.agi],
                  ['VIT', result.vit],
                  ['INT', result.int],
                  ['DEX', result.dex],
                  ['LUK', result.luk]
                ] as const).map(([label, value]) => (
                  displayStat(value) != null ? (
                    <div key={label} className="stat-item">
                      <span className="stat-label">{label}</span>
                      <span className="stat-value">{displayStat(value)}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
            {result.activeModes && result.activeModes.length > 0 && (
              <div className="result-card-modes">
                <div className="modes-active-list">
                  {result.activeModes.map((mode) => (
                    <span key={mode} className="mode-tag mode-tag-active">{mode}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.drop && result.drop.length > 0 && (
            <div className="result-card-section">
              <div className="result-card-drops">
                <div className="result-card-drops-grid normal-drops">
                  {result.drop.map((drop, index) => {
                    const chanceText = drop.chancePercent != null
                      ? `${drop.chancePercent.toFixed(2)}%`
                      : null;
                    return (
                      <div
                        key={`${drop.id}-${index}`}
                        className={`result-card-drop${drop.type ? ` ${drop.type}` : ''}`}
                      >
                        <AtlasSprite
                          sprite={drop.itemIcon}
                          alt={drop.itemName}
                          className="drop-icon"
                        />
                        <span className="drop-name">
                          <Link to={`/database?tab=items&q=${drop.id}`}>{drop.itemName}</Link>
                          {drop.type === 'mvp' ? ' (MVP)' : ''}
                        </span>
                        {chanceText && (
                          <span className="drop-chance">{chanceText}</span>
                        )}
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
      {spriteModalOpen && canOpenSprite && createPortal(
        <div
          className="item-card-art-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSpriteModal();
          }}
        >
          <div
            className="item-card-art-frame mob-sprite-modal-frame"
            role="dialog"
            aria-modal="true"
            aria-label={result.name}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="item-card-art-close"
              onClick={closeSpriteModal}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="mob-sprite-modal-body">
              <AtlasSprite sprite={result.sprite} alt={result.name} />
            </div>
            <p className="mob-sprite-modal-caption">
              {result.name} <span>#{result.id}</span>
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MobCard;
export type { MobResult }; 