import { useCallback, useMemo, useState } from 'react';
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
  mobId: number | null;
  mobAegis?: string | null;
  mobName?: string | null;
  amount: number | null;
  kind?: string | null;
  skillId?: number | null;
  skillName?: string | null;
  conditions?: Record<string, unknown> | null;
}

interface MobSkill {
  skillId: number | null;
  skillName: string | null;
  skillLv: number | null;
  state: string | null;
  conditionType: string | null;
  conditionValue: string | null;
  rate: number | null;
}

interface MobResult {
  id: string;
  name: string;
  nameJapanese?: string | null;
  nameAegis?: string;
  sprite: SpriteRect | string;
  hp: number | null;
  hpBase?: number | null;
  hpStatus?: string | null;
  hpNote?: string | null;
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
  mobRole?: string | null;
  attack2?: number | null;
  sp?: number | null;
  attackRange?: number | null;
  walkSpeed?: number | null;
  attackDelay?: number | null;
  attackMotion?: number | null;
  damageMotion?: number | null;
  skillRange?: number | null;
  chaseRange?: number | null;
  damageTaken?: number | null;
  resistance?: number | null;
  magicResistance?: number | null;
  raceGroups?: string[] | null;
  title?: string | null;
  ai?: string | null;
  spawns?: MobSpawnPoint[];
  spawnMaps?: MobSpawnMapSummary[];
  spawnMapCount?: number;
  spawnAmount?: number;
  hasWorldSpawn?: boolean;
  summons?: MobSummon[];
  skills?: MobSkill[];
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

interface GroupedSummon {
  mobId: number | null;
  mobAegis?: string | null;
  mobName?: string | null;
  amount: number;
}

const MOB_SPRITE_FIT = { maxWidth: 148, maxHeight: 148 };

const MODE_SINGLE_ROW_MAX = 7;

const splitModeRows = (modes: string[]): string[][] => {
  if (modes.length <= MODE_SINGLE_ROW_MAX) return [modes];
  const mid = Math.ceil(modes.length / 2);
  return [modes.slice(0, mid), modes.slice(mid)];
};

const groupSummons = (summons: MobSummon[]): GroupedSummon[] => {
  const map = new Map<string, GroupedSummon>();
  for (const summon of summons) {
    const key = summon.mobId != null
      ? `id:${summon.mobId}`
      : `name:${summon.mobAegis || summon.mobName || '?'}`;
    const existing = map.get(key);
    const amount = summon.amount ?? 0;
    if (existing) {
      existing.amount += amount;
      if (!existing.mobName && summon.mobName) existing.mobName = summon.mobName;
      if (!existing.mobAegis && summon.mobAegis) existing.mobAegis = summon.mobAegis;
      continue;
    }
    map.set(key, {
      mobId: summon.mobId,
      mobAegis: summon.mobAegis,
      mobName: summon.mobName,
      amount,
    });
  }
  return [...map.values()];
};

const MobCard: React.FC<MobCardProps> = ({ result, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [spriteModalOpen, setSpriteModalOpen] = useState(false);
  const [summonsModalOpen, setSummonsModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [farming, setFarming] = useState<FarmingMob | null>(null);
  const [farmingOpen, setFarmingOpen] = useState(false);
  const [farmingLoading, setFarmingLoading] = useState(false);
  const [farmingError, setFarmingError] = useState<string | null>(null);

  const closeSpriteModal = useCallback(() => setSpriteModalOpen(false), []);
  const closeSummonsModal = useCallback(() => setSummonsModalOpen(false), []);
  const closeSkillsModal = useCallback(() => setSkillsModalOpen(false), []);
  const canOpenSprite = !isPlaceholderAsset(result.sprite);
  const normalDrops = (result.drop || []).filter((d) => d.type !== 'mvp');
  const mvpDrops = (result.drop || []).filter((d) => d.type === 'mvp');
  const summons = result.summons || [];
  const skills = result.skills || [];
  const groupedSummons = useMemo(() => groupSummons(summons), [summons]);

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
    <div className="result-card result-card--mob">
      <div className="mob-card-top">
        <div className={`result-card-image${result.isMvp === true ? ' result-card-image--mvp' : ''}`}>
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
          {result.isMvp === true && (
            <div className="mvp-icon" aria-hidden="true">
              <img src="/icons/mvp.gif" alt="" />
            </div>
          )}
        </div>
        <div className="mob-card-top-meta">
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

          <div className="mob-card-top-row">
            <div className="mob-spawn-wrap">
              <div className="result-card-section mob-spawn-section">
                <div className="mob-spawn-header">Spawns:</div>
                {result.spawnMaps && result.spawnMaps.length > 0 ? (
                  <div className="mob-spawn-list">
                    {result.spawnMaps.map((spawn) => {
                      const spawnType = spawn.type
                        || (spawn.instance ? 'instance' : 'permanent');
                      return (
                        <Link
                          key={spawn.map}
                          to={`/database?tab=maps&map=${encodeURIComponent(spawn.map)}`}
                          className={`mob-spawn-map spawn-type-${spawnType}${spawn.boss ? ' is-boss' : ''}`}
                        >
                          {spawn.map}
                          <span className="mob-spawn-amount">{spawn.amount}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mob-spawn-empty">
                    {result.hasWorldSpawn === false
                      ? 'Sin spawn en mapas del mundo'
                      : 'Sin datos de spawn'}
                  </div>
                )}
              </div>
            </div>

            <aside className="mob-side-meta" aria-label="Extra Data">
              <div className="mob-side-meta-heading">Extra Data</div>
              <div className="mob-side-meta-tags">
                {skills.length > 0 && (
                  <button
                    type="button"
                    className="mob-side-meta-tag is-action"
                    onClick={() => setSkillsModalOpen(true)}
                  >
                    {skills.length} skill{skills.length === 1 ? '' : 's'}
                  </button>
                )}
                {result.mobRole && (
                  <span className="mob-side-meta-tag">
                    {formatFilterLabel(result.mobRole)}
                  </span>
                )}
                {result.title && (
                  <span className="mob-side-meta-tag">{result.title}</span>
                )}
                {[...new Set(
                  (result.spawnMaps || [])
                    .map((spawn) => spawn.type || (spawn.instance ? 'instance' : null))
                    .filter((type): type is string => Boolean(type))
                )].map((type) => (
                  <span key={`spawn-${type}`} className={`mob-side-meta-tag spawn-type-${type}`}>
                    {formatFilterLabel(type)}
                  </span>
                ))}
                {(result.raceGroups || []).map((group) => (
                  <span key={group} className="mob-side-meta-tag is-group">
                    {formatFilterLabel(group)}
                  </span>
                ))}
                {skills.length === 0
                  && !result.mobRole
                  && !result.title
                  && !(result.spawnMaps && result.spawnMaps.length > 0)
                  && !(result.raceGroups && result.raceGroups.length > 0) && (
                  <span className="mob-side-meta-empty">Sin datos</span>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="mob-card-body">
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
            {result.hpStatus === 'not_extractable' && result.hpNote && (
              <div className="mob-hp-note">{result.hpNote}</div>
            )}
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

          <div className="result-card-section mob-attrs-panel">
            <div className="mob-attrs-stats">
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
            <div className="mob-attrs-combat">
              <div className="mob-combat-grid">
                {([
                  ['Atk range', displayStat(result.attackRange)],
                  ['Skill range', displayStat(result.skillRange)],
                  ['Chase range', displayStat(result.chaseRange)],
                  ['Walk speed', displayStat(result.walkSpeed)],
                  ['Atk delay', displayStat(result.attackDelay)],
                  ['Atk motion', displayStat(result.attackMotion)],
                  ['Dmg motion', displayStat(result.damageMotion)],
                  [
                    'Dmg taken',
                    result.damageTaken != null && result.damageTaken !== 100
                      ? `${result.damageTaken}%`
                      : null
                  ],
                  ['RES', displayStat(result.resistance)],
                  ['MRES', displayStat(result.magicResistance)]
                ] as const).map(([label, value]) => (
                  value != null ? (
                    <div key={label} className="result-card-property">
                      <span className="property-label">{label}</span>
                      <span className="property-value">{value}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          </div>

          {result.activeModes && result.activeModes.length > 0 && (
            <div className="result-card-section result-card-modes">
              <div className={`modes-active-list${result.activeModes.length > MODE_SINGLE_ROW_MAX ? ' is-balanced' : ''}`}>
                {splitModeRows(result.activeModes).map((row, rowIndex) => (
                  <div key={rowIndex} className="modes-active-row">
                    {row.map((mode) => (
                      <span key={mode} className="mode-tag mode-tag-active">{mode}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(normalDrops.length > 0 || mvpDrops.length > 0) && (
            <div className="result-card-section">
              <div className="result-card-drops">
                {normalDrops.length > 0 && (
                  <div className="mob-drop-block">
                    <div className="result-card-drops-header">Drops</div>
                    <div className="result-card-drops-grid">
                      {normalDrops.map((drop, index) => {
                        const chanceText = drop.chancePercent != null
                          ? `${drop.chancePercent.toFixed(2)}%`
                          : null;
                        return (
                          <div
                            key={`n-${drop.id}-${index}`}
                            className={`result-card-drop${drop.type && drop.type !== 'normal' ? ` ${drop.type}` : ''}`}
                          >
                            <AtlasSprite
                              sprite={drop.itemIcon}
                              alt={drop.itemName}
                              className="drop-icon"
                            />
                            <span className="drop-name">
                              <Link to={`/database?tab=items&q=${drop.id}`}>{drop.itemName}</Link>
                            </span>
                            {chanceText && (
                              <span className="drop-chance">{chanceText}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {mvpDrops.length > 0 && (
                  <div className="mob-drop-block">
                    <div className="result-card-drops-header">Drops MVP</div>
                    <div className="result-card-drops-grid">
                      {mvpDrops.map((drop, index) => {
                        const chanceText = drop.chancePercent != null
                          ? `${drop.chancePercent.toFixed(2)}%`
                          : null;
                        return (
                          <div
                            key={`m-${drop.id}-${index}`}
                            className="result-card-drop mvp"
                          >
                            <AtlasSprite
                              sprite={drop.itemIcon}
                              alt={drop.itemName}
                              className="drop-icon"
                            />
                            <span className="drop-name">
                              <Link to={`/database?tab=items&q=${drop.id}`}>{drop.itemName}</Link>
                            </span>
                            {chanceText && (
                              <span className="drop-chance">{chanceText}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {groupedSummons.length > 0 && (
            <div className="result-card-section mob-farm-section">
              <button
                type="button"
                className="result-card-toggle"
                onClick={() => setSummonsModalOpen(true)}
              >
                Ver invocaciones ({groupedSummons.length})
              </button>
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
              <AtlasSprite sprite={result.sprite} alt={result.name} scale={2} />
            </div>
            <p className="mob-sprite-modal-caption">
              {result.name} <span>#{result.id}</span>
            </p>
          </div>
        </div>,
        document.body
      )}
      {summonsModalOpen && groupedSummons.length > 0 && createPortal(
        <div
          className="item-desc-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSummonsModal();
          }}
        >
          <div
            className="item-desc-modal item-box-group-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mob-summons-title-${result.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="item-desc-modal-head">
              <div>
                <h4 id={`mob-summons-title-${result.id}`}>Invocaciones</h4>
                <p className="item-desc-modal-subtitle">
                  {result.name} · {groupedSummons.length} tipos
                </p>
              </div>
              <button
                type="button"
                className="item-desc-modal-close"
                onClick={closeSummonsModal}
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <ul className="box-group-list">
              {groupedSummons.map((summon, index) => {
                const label = summon.mobName
                  || summon.mobAegis
                  || (summon.mobId != null ? `#${summon.mobId}` : null);
                return (
                  <li
                    key={`${summon.mobId ?? 'x'}-${index}`}
                    className="box-group-item"
                  >
                    {summon.mobId != null && label ? (
                      <Link
                        to={`/database?tab=mobs&q=${summon.mobId}`}
                        className="box-group-item-name"
                        onClick={closeSummonsModal}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="box-group-item-name">{label || '—'}</span>
                    )}
                    <span className="box-group-item-meta">
                      {summon.mobId != null ? `#${summon.mobId}` : ''}
                      {summon.amount > 0 ? `${summon.mobId != null ? ' · ' : ''}x${summon.amount}` : ''}
                    </span>
                    <span className="box-group-item-chance" />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body
      )}
      {skillsModalOpen && skills.length > 0 && createPortal(
        <div
          className="item-desc-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSkillsModal();
          }}
        >
          <div
            className="item-desc-modal item-box-group-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mob-skills-title-${result.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="item-desc-modal-head">
              <div>
                <h4 id={`mob-skills-title-${result.id}`}>Skills</h4>
                <p className="item-desc-modal-subtitle">
                  {result.name} · {skills.length} entradas
                </p>
              </div>
              <button
                type="button"
                className="item-desc-modal-close"
                onClick={closeSkillsModal}
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <ul className="box-group-list">
              {skills.map((skill, index) => {
                const label = skill.skillName
                  || (skill.skillId != null ? `#${skill.skillId}` : '—');
                const rateText = skill.rate != null
                  ? `${(skill.rate / 100).toFixed(skill.rate % 100 === 0 ? 0 : 1)}%`
                  : null;
                const metaParts = [
                  skill.skillId != null ? `#${skill.skillId}` : null,
                  skill.skillLv != null ? `Lv ${skill.skillLv}` : null,
                  skill.state || null,
                  skill.conditionType
                    ? `${skill.conditionType}${skill.conditionValue != null && skill.conditionValue !== '' ? ` ${skill.conditionValue}` : ''}`
                    : null
                ].filter(Boolean);
                return (
                  <li
                    key={`${skill.skillId ?? 's'}-${skill.state ?? ''}-${index}`}
                    className="box-group-item"
                  >
                    {skill.skillId != null ? (
                      <Link
                        to={`/database?tab=skills&q=${skill.skillId}&run=1`}
                        className="box-group-item-name"
                        onClick={closeSkillsModal}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="box-group-item-name">{label}</span>
                    )}
                    <span className="box-group-item-meta">{metaParts.join(' · ')}</span>
                    <span className="box-group-item-chance">{rateText || ''}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MobCard;
export type { MobResult }; 