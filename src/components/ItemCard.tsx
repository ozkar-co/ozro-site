import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { SpriteRect } from '../api/assets';
import { apiClient, type MobSpawnMapSummary } from '../api/client';
import AtlasSprite from './AtlasSprite';
import {
  PLACEHOLDER_ITEM_ICON,
  PLACEHOLDER_ITEM_ILLUSTRATION
} from '../api/placeholders';

interface SearchResult {
  id: string;
  type: number;
  subtype: number;
  atk: number;
  matk: number;
  defence: number;
  price_buy: number;
  price_sell: number;
  weight: number;
  codename1: string;
  codename2: string;
  script: string;
  name: string;
  description: string;
  icon: SpriteRect | string;
  illustration: SpriteRect | string;
  stack_amount?: number;
  slots?: number;
  equip_level_min?: number;
  equip_level_max?: number;
  refineable?: boolean;
  gradable?: boolean;
  weapon_level?: number;
  armor_level?: number;
  range?: number;
  gender?: string;
  typeLabel?: string;
  subtypeName?: string;
  equipScript?: string;
  unequipScript?: string;
  jobsText?: string;
  classesText?: string;
  locationsText?: string;
  droppedBy?: {
    id: number;
    name: string;
    level: number;
    rate?: number;
    chancePercent?: number | null;
    dropType?: string;
    spawnMaps?: MobSpawnMapSummary[];
    spawnMapCount?: number;
    spawnAmount?: number;
    hasWorldSpawn?: boolean;
  }[];
  equip_locations?: number[];
  equip_upper?: number[];
  equip_jobs?: number[];
}

const JOBS = {
  0: "Novice",
  1: "Swordman",
  2: "Magician",
  3: "Archer",
  4: "Acolyte",
  5: "Merchant",
  6: "Thief",
  7: "Knight",
  8: "Priest",
  9: "Wizard",
  10: "Blacksmith",
  11: "Hunter",
  12: "Assassin",
  13: "Unused",
  14: "Crusader",
  15: "Monk",
  16: "Sage",
  17: "Rogue",
  18: "Alchemist",
  19: "Bard/Dancer",
  20: "Unused",
  21: "Taekwon",
  22: "Star Gladiator",
  23: "Soul Linker",
  24: "Gunslinger",
  25: "Ninja",
  26: "Gangsi",
  27: "Death Knight",
  28: "Dark Collector",
  29: "Kagerou/Oboro",
  30: "Rebellion",
  31: "Summoner"
} as const;

const UPPER_TYPES = {
  0: "Normal jobs",
  1: "Trascended jobs",
  2: "Baby jobs",
  3: "Third jobs",
  4: "Trascended Third jobs",
  5: "Baby Third jobs"
} as const;

const ITEM_TYPES = {
  0: 'Healing item',
  2: 'Usable item',
  3: 'Etc item',
  4: 'Weapon',
  5: 'Armor',
  6: 'Card',
  7: 'Pet egg',
  8: 'Pet equipment',
  10: 'Ammo',
  11: 'Delayed Usable',
  18: 'Usable with Confirmation'
} as const;

const WEAPON_SUBTYPES = {
  0: 'Bare fist',
  1: 'Daggers',
  2: 'One-handed swords',
  3: 'Two-handed swords',
  4: 'One-handed spears',
  5: 'Two-handed spears',
  6: 'One-handed axes',
  7: 'Two-handed axes',
  8: 'Maces',
  9: 'Unused',
  10: 'Staves',
  11: 'Bows',
  12: 'Knuckles',
  13: 'Musical instruments',
  14: 'Whips',
  15: 'Books',
  16: 'Katars',
  17: 'Revolvers',
  18: 'Rifles',
  19: 'Gatling guns',
  20: 'Shotguns',
  21: 'Grenade launchers',
  22: 'Fuuma shurikens',
  23: 'Two-handed staves'
} as const;

const AMMO_SUBTYPES = {
  1: 'Arrows',
  2: 'Throwable daggers',
  3: 'Bullets',
  4: 'Shells',
  5: 'Grenades',
  6: 'Shuriken',
  7: 'Kunai',
  8: 'Cannon balls',
  9: 'Throwable items'
} as const;

const EQUIP_LOCATIONS = {
  0: "Lower Headgear",
  1: "Weapon",
  2: "Garment",
  3: "Accessory 1",
  4: "Armor",
  5: "Shield",
  6: "Both Hands",
  7: "Footgear",
  8: "Accessory 2",
  9: "Upper Headgear",
  10: "Middle Headgear",
  11: "Costume Top Headgear",
  12: "Costume Mid Headgear",
  13: "Costume Low Headgear",
  14: "Costume Garment/Robe",
  15: "Ammunition",
  16: "Shadow Armor",
  17: "Shadow Weapon",
  18: "Shadow Shield",
  19: "Shadow 2H Weapon",
  20: "Shadow Shoes",
  21: "Shadow Accessory 2",
  22: "Shadow Accessory 1",
  23: "Shadow Accessories",
} as const;

const getTypeName = (type: number): string => {
  return ITEM_TYPES[type as keyof typeof ITEM_TYPES] || `Unknown (${type})`;
};

const getSubtypeName = (type: number, subtype: number): string => {
  if (type === 4) { // Weapon
    return WEAPON_SUBTYPES[subtype as keyof typeof WEAPON_SUBTYPES] || `Unknown (${subtype})`;
  } else if (type === 10) { // Ammo
    return AMMO_SUBTYPES[subtype as keyof typeof AMMO_SUBTYPES] || `Unknown (${subtype})`;
  }
  return '';
};

const getJobName = (job: number): string => {
  return JOBS[job as keyof typeof JOBS] || `Unknown (${job})`;
};

const getEquipLocationsText = (locations: number[]): string => {
  const locationNames = locations.map(loc => EQUIP_LOCATIONS[loc as keyof typeof EQUIP_LOCATIONS] || `Unknown (${loc})`);
  const fullText = locationNames.join(', ');
  return fullText.length > 30 ? fullText.substring(0, 27) + '...' : fullText;
};

const getUpperTypesText = (upperTypes: number[]): string => {
  const allTypes = [0, 1, 2, 3, 4, 5];
  const missingTypes = allTypes.filter(type => !upperTypes.includes(type));
  const presentTypes = allTypes.filter(type => upperTypes.includes(type));
  
  if (missingTypes.length === 0) {
    return 'Todos';
  }
  
  if (missingTypes.length > 2 || missingTypes.includes(0)) {
    const presentTypesWithoutBaby = presentTypes.filter(type => type !== 5 && type !== 2);
    const presentNames = presentTypesWithoutBaby.map(type => UPPER_TYPES[type as keyof typeof UPPER_TYPES]);
    return `Únicamente ${presentNames.join(', ')}`;
  }
  
  const missingNames = missingTypes.map(type => UPPER_TYPES[type as keyof typeof UPPER_TYPES]);
  return `Todos excepto ${missingNames.join(', ')}`;
};

const processColoredText = (text: string): JSX.Element[] => {
  const parts = text.split(/(\^[0-9A-F]{6})/i);
  let currentColor = '000000';
  const elements: JSX.Element[] = [];
  let key = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('^')) {
      currentColor = part.substring(1);
      continue;
    }
    if (part) {
      elements.push(
        <span 
          key={key++} 
          style={{ color: `#${currentColor}` }}
        >
          {part}
        </span>
      );
    }
  }

  return elements;
};

function formatNpcPrices(buy: number, sell: number): string | null {
  let resolvedBuy = buy > 0 ? buy : null;
  let resolvedSell = sell > 0 ? sell : null;
  if (resolvedBuy === null && resolvedSell !== null) resolvedBuy = resolvedSell * 2;
  if (resolvedSell === null && resolvedBuy !== null) resolvedSell = Math.floor(resolvedBuy / 2);
  if (!resolvedBuy && !resolvedSell) return null;
  return `${resolvedBuy ?? 0}/${resolvedSell ?? 0}`;
}

function formatAtkMatkPair(atk: number, matk: number): string | null {
  const hasAtk = atk > 0;
  const hasMatk = matk > 0;
  if (!hasAtk && !hasMatk) return null;
  return `${hasAtk ? atk : '—'}/${hasMatk ? matk : '—'}`;
}

function formatEquipLevelRange(min?: number, max?: number): string | null {
  if (min == null && max == null) return null;
  const lo = min != null && min > 0 ? min : null;
  const hi = max != null && max > 0 ? max : null;
  if (lo === null && hi === null) return null;
  return `${lo ?? '—'}/${hi ?? '—'}`;
}

function ResultProperty({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  if (value === null || value === undefined || value === false) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'NA' || trimmed === '???') return null;
  }
  return (
    <div className="result-card-property">
      <span className="property-label">{label}</span>
      <span className="property-value">{value}</span>
    </div>
  );
}

interface ItemCardProps {
  result: SearchResult;
  compact?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ result, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(result.description);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [dropsOpen, setDropsOpen] = useState(false);

  const drops = result.droppedBy ?? [];
  const dropWithSpawn = drops.filter((mob) => mob.hasWorldSpawn === true).length;
  const dropWithoutSpawn = drops.length - dropWithSpawn;
  const equipLocationsText = result.equip_locations?.length
    ? getEquipLocationsText(result.equip_locations)
    : null;
  const priceText = formatNpcPrices(result.price_buy, result.price_sell);
  const atkMatkText = formatAtkMatkPair(result.atk, result.matk);
  const equipLevelText = formatEquipLevelRange(result.equip_level_min, result.equip_level_max);
  const defenceText = result.defence > 0 ? String(result.defence) : null;
  const weightText = result.weight > 0 ? String(result.weight) : null;
  const weaponLevelText = result.weapon_level != null && result.weapon_level > 0
    ? String(result.weapon_level)
    : null;

  const toggleDescription = async () => {
    if (descriptionOpen) {
      setDescriptionOpen(false);
      return;
    }

    setDescriptionOpen(true);
    if (description || descriptionLoading) return;

    setDescriptionLoading(true);
    setDescriptionError(false);
    try {
      const response = await apiClient.getItemDescription(result.id);
      const lines = response.identified.length > 0 ? response.identified : response.unidentified;
      setDescription(lines.join('\n'));
    } catch {
      setDescriptionError(true);
    } finally {
      setDescriptionLoading(false);
    }
  };

  if (compact && !expanded) {
    const typeName = result.typeLabel || getTypeName(result.type);
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
          <span className="item-type">{typeName}</span>
          <span className="result-card-compact-hint"> · clic para desplegar</span>
        </span>
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="result-card-content">
        <div className="result-card-image">
          <AtlasSprite
            sprite={result.illustration || result.icon}
            alt={result.name}
            fallback={PLACEHOLDER_ITEM_ILLUSTRATION}
          />
        </div>
        <div className="result-card-info">
          <div className="result-card-header">
            <div className="result-card-title">
              <AtlasSprite
                sprite={result.icon}
                alt={result.name}
                className="small-icon"
                fallback={PLACEHOLDER_ITEM_ICON}
              />
              <div className="title-container">
                <div className="title-row">
                  <h3>
                    <span className="name-title"><Link to={`/database?tab=items&q=${result.id}`}>{result.name}</Link></span>
                    {' '}
                    <span className="name-details">
                      [{result.codename1}/{result.codename2 || '???'}]
                    </span>
                    {' '}
                    <span className="result-card-id">(#{result.id})</span>
                  </h3>
                  <span className="item-type">
                    {result.typeLabel || getTypeName(result.type)}
                    {result.subtypeName ? (
                      <span className="item-subtype"> — {result.subtypeName}</span>
                    ) : (result.type === 4 || result.type === 10) && result.subtype ? (
                      <span className={`item-type-${result.type === 4 ? 'weapon' : 'ammo'}`}>
                        {' - '}
                        {getSubtypeName(result.type, result.subtype)}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {(atkMatkText || defenceText || priceText || weightText) && (
          <div className="result-card-section">
            <div className="result-card-properties">
              <ResultProperty label="ATK/MATK" value={atkMatkText} />
              <ResultProperty label="DEF" value={defenceText} />
              <ResultProperty label="Precio" value={priceText} />
              <ResultProperty label="Peso" value={weightText} />
            </div>
          </div>
          )}
          {Number(result.type) === 4 && (
            <div className="result-card-section">
              <div className="result-card-properties">
                <ResultProperty label="Slots" value={result.slots != null ? String(result.slots) : null} />
                <ResultProperty label="Nivel Equip" value={equipLevelText} />
                <ResultProperty label="Refinable" value={result.refineable ? 'Sí' : 'No'} />
                <ResultProperty label="Nivel Arma" value={weaponLevelText} />
                {result.range != null && result.range > 0 && (
                  <ResultProperty label="Alcance" value={String(result.range)} />
                )}
              </div>
            </div>
          )}
          {Number(result.type) === 5 && (
            <div className="result-card-section">
              <div className="result-card-properties">
                <ResultProperty label="Slots" value={result.slots != null ? String(result.slots) : null} />
                <ResultProperty label="Nivel Equip" value={equipLevelText} />
                <ResultProperty label="Refinable" value={result.refineable ? 'Sí' : 'No'} />
                <ResultProperty
                  label="Ubicación"
                  value={equipLocationsText}
                />
              </div>
            </div>
          )}
          {(Number(result.type) === 4 || Number(result.type) === 5) && (
            <div className="result-card-section">
              <div className="result-card-jobs">
                <div className="result-card-property">
                  <span className="property-label">Jobs</span>
                  <span className="property-value">
                    {result.jobsText
                      || (result.equip_jobs && result.equip_jobs.length > 0
                        ? result.equip_jobs.map((job) => getJobName(job)).join(', ')
                        : 'Todos')}
                  </span>
                </div>
                <div className="result-card-property">
                  <span className="property-label">Grupos</span>
                  <span className="property-value">
                    {result.classesText
                      || (result.equip_upper?.length ? getUpperTypesText(result.equip_upper) : 'Todos')}
                  </span>
                </div>
              </div>
            </div>
          )}
          {result.locationsText && (
            <div className="result-card-section">
              <div className="result-card-property">
                <span className="property-label">Ubicación</span>
                <span className="property-value">{result.locationsText}</span>
              </div>
            </div>
          )}
          {drops.length > 0 && (
            <div className="result-card-section result-card-collapsible-actions">
              <button
                type="button"
                className="result-card-toggle"
                onClick={() => setDropsOpen((open) => !open)}
                aria-expanded={dropsOpen}
              >
                {dropsOpen
                  ? 'Ocultar lo que lo dropean'
                  : `Lo dropean: ${drops.length} (${dropWithSpawn} con spawn, ${dropWithoutSpawn} sin spawn)`}
              </button>
              {dropsOpen && (
              <div className="result-card-dropped-by">
                {drops.map((mob) => {
                  const pct = mob.chancePercent ?? (mob.rate != null ? Math.min(mob.rate, 10000) / 100 : null);
                  return (
                    <div key={mob.id} className="dropped-by-item">
                      <Link to={`/database?tab=mobs&q=${mob.id}`}>
                        {mob.name} (Nv. {mob.level})
                        {pct != null ? ` — ${pct.toFixed(2)}%` : ''}
                        {mob.dropType === 'mvp' ? ' [MVP]' : ''}
                      </Link>
                      <div className="dropped-by-maps">
                        {(mob.spawnMaps ?? [])
                          .filter((spawn) => !spawn.instance)
                          .map((spawn) => (
                            <Link
                              key={spawn.map}
                              to={`/database?tab=maps&map=${encodeURIComponent(spawn.map)}`}
                              className="dropped-by-map"
                            >
                              {spawn.map}
                            </Link>
                          ))}
                        {mob.hasWorldSpawn === false && (
                          <span className="dropped-by-map is-muted">Sin spawn en el mundo</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
          <div className="result-card-section result-card-collapsible-actions">
            <button
              type="button"
              className="result-card-toggle"
              onClick={toggleDescription}
              aria-expanded={descriptionOpen}
            >
              {descriptionOpen ? 'Ocultar descripción' : 'Ver descripción'}
            </button>
            {descriptionOpen && (
              <>
                <div className="result-card-description-header">Descripción:</div>
                <div className="result-card-description">
                  <div className="result-card-description-content">
                    {descriptionLoading
                      ? 'Cargando descripción...'
                      : descriptionError
                        ? 'No se pudo cargar la descripción.'
                        : description
                          ? processColoredText(description)
                          : 'Sin descripción disponible.'}
                  </div>
                </div>
              </>
            )}
          </div>
          {result.script && (
            <div className="result-card-section">
              <div className="result-card-script-header">Al usar:</div>
              <pre className="result-card-script">{result.script}</pre>
            </div>
          )}
          {result.equipScript && (
            <div className="result-card-section">
              <div className="result-card-script-header">Al equipar:</div>
              <pre className="result-card-script">{result.equipScript}</pre>
            </div>
          )}
          {result.unequipScript && (
            <div className="result-card-section">
              <div className="result-card-script-header">Al desequipar:</div>
              <pre className="result-card-script">{result.unequipScript}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
export type { SearchResult };
export {ITEM_TYPES};