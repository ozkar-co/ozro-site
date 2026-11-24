import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { SpriteRect } from '../api/assets';
import {
  cardAtlasUrl,
  catalogHasCard,
  findCardEntry,
  loadCardCatalog,
  type CardEntry,
  type CardPage
} from '../api/cards';
import {
  apiClient,
  type BoxGroupResponse,
  type ItemAcquisition,
  type MobSpawnMapSummary
} from '../api/client';
import AtlasSprite from './AtlasSprite';
import {
  PLACEHOLDER_ITEM_ICON,
  PLACEHOLDER_ITEM_ILLUSTRATION
} from '../api/placeholders';
import { formatItemNameDetails } from '../utils/nameDetails';

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
  nameAegis?: string | null;
  nameEnglish?: string | null;
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
  acquisition?: ItemAcquisition | null;
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
  12: 'Cash',
  13: 'Shadow gear',
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

function formatDropperSummary(total: number, withSpawn: number, withoutSpawn: number): string {
  if (withSpawn === 0) {
    return `Lo dropean: ${total} (todos sin spawn)`;
  }
  if (withoutSpawn === 0) {
    return `Lo dropean: ${total} (todos con spawn)`;
  }
  return `Lo dropean: ${total} (${withSpawn} con spawn y ${withoutSpawn} sin spawn)`;
}

function summarizeAcquisition(
  acquisition: ItemAcquisition | null | undefined,
  dropCount: number
): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  const dropTotal = Math.max(dropCount, acquisition?.dropCount || 0);
  if (dropTotal > 0) chips.push({ key: 'mob_drop', label: `Drop ×${dropTotal}` });
  if (!acquisition) return chips;

  const push = (key: string, count: number | undefined, label: string) => {
    if (count && count > 0) chips.push({ key, label: `${label} ×${count}` });
  };
  push('npc_shop', acquisition.shopTotal ?? acquisition.shops?.length, 'Tienda');
  push('box_reward', acquisition.boxTotal ?? acquisition.boxes?.length, 'Cofre');
  push('crafting', acquisition.crafting?.length, 'Craft');
  push('npc_barter', acquisition.barterTotal ?? acquisition.barters?.length, 'Trueque');
  push('npc_reward', acquisition.npcRewardTotal ?? acquisition.npcRewards?.length, 'NPC');
  push('quest_drop', acquisition.summary?.quest_drop, 'Quest');
  push('map_drop', acquisition.mapDropCount, 'Mapa');
  const otherCount = (acquisition.summary?.socketing || 0)
    + (acquisition.summary?.enchanting || 0);
  if (otherCount > 0) chips.push({ key: 'other', label: `Otros ×${otherCount}` });
  return chips;
}

function AcquisitionBlock({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="acquisition-group">
      <div className="acquisition-group-title">{title}</div>
      {children}
    </div>
  );
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
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [openAcquisitionKey, setOpenAcquisitionKey] = useState<string | null>(null);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardArt, setCardArt] = useState<{ entry: CardEntry; page: CardPage } | null>(null);
  const [cardArtLoading, setCardArtLoading] = useState(false);
  const [cardArtError, setCardArtError] = useState(false);
  const [hasCardArt, setHasCardArt] = useState(false);
  const [boxGroupModalOpen, setBoxGroupModalOpen] = useState(false);
  const [boxGroupName, setBoxGroupName] = useState<string | null>(null);
  const [boxGroupData, setBoxGroupData] = useState<BoxGroupResponse | null>(null);
  const [boxGroupLoading, setBoxGroupLoading] = useState(false);
  const [boxGroupError, setBoxGroupError] = useState(false);

  const scriptMain = result.script?.trim() || '';
  const scriptEquip = result.equipScript?.trim() || '';
  const scriptUnequip = result.unequipScript?.trim() || '';
  const hasScripts = Boolean(scriptMain || scriptEquip || scriptUnequip);
  const isCardItem = result.typeLabel === 'Card' || Number(result.type) === 6;

  const drops = result.droppedBy ?? [];
  const dropWithSpawn = drops.filter((mob) => mob.hasWorldSpawn === true).length;
  const dropWithoutSpawn = drops.length - dropWithSpawn;
  const acquisition = result.acquisition;
  const acquisitionChips = summarizeAcquisition(acquisition, drops.length);
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
  const genderExclusiveText = (() => {
    const g = (result.gender || '').trim().toLowerCase();
    if (g === 'male') return 'Exclusivo para Hombre';
    if (g === 'female') return 'Exclusivo para Mujer';
    return null;
  })();
  const nameDetailsText = formatItemNameDetails(result.nameAegis, result.nameEnglish);

  const closeDescriptionModal = useCallback(() => {
    setDescriptionModalOpen(false);
  }, []);

  const closeScriptModal = useCallback(() => {
    setScriptModalOpen(false);
  }, []);

  const closeCardModal = useCallback(() => {
    setCardModalOpen(false);
  }, []);

  const closeBoxGroupModal = useCallback(() => {
    setBoxGroupModalOpen(false);
  }, []);

  const openBoxGroupModal = useCallback(async (groupName: string) => {
    const name = groupName.trim();
    if (!name) return;
    setBoxGroupModalOpen(true);
    setBoxGroupName(name);
    setBoxGroupData(null);
    setBoxGroupError(false);
    setBoxGroupLoading(true);
    try {
      const data = await apiClient.getBoxGroup(name);
      setBoxGroupData(data);
    } catch {
      setBoxGroupError(true);
    } finally {
      setBoxGroupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCardItem) {
      setHasCardArt(false);
      return;
    }
    let cancelled = false;
    loadCardCatalog()
      .then((catalog) => {
        if (!cancelled) setHasCardArt(catalogHasCard(catalog, result.id));
      })
      .catch(() => {
        if (!cancelled) setHasCardArt(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCardItem, result.id]);

  const openCardArtModal = async () => {
    setCardModalOpen(true);
    if (cardArt || cardArtLoading) return;

    setCardArtLoading(true);
    setCardArtError(false);
    try {
      const catalog = await loadCardCatalog();
      const found = findCardEntry(catalog, result.id);
      if (!found) {
        setCardArtError(true);
        return;
      }
      setCardArt(found);
    } catch {
      setCardArtError(true);
    } finally {
      setCardArtLoading(false);
    }
  };

  const openDescriptionModal = async () => {
    setDescriptionModalOpen(true);
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

  useEffect(() => {
    if (!descriptionModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDescriptionModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [descriptionModalOpen, closeDescriptionModal]);

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
            sprite={result.illustration}
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
                    {nameDetailsText && (
                      <>
                        <span className="name-details">{nameDetailsText}</span>
                        {' '}
                      </>
                    )}
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
                {result.gradable != null && (
                  <ResultProperty label="Gradeable" value={result.gradable ? 'Sí' : 'No'} />
                )}
                <ResultProperty label="Nivel Arma" value={weaponLevelText} />
                {result.range != null && result.range > 0 && (
                  <ResultProperty label="Alcance" value={String(result.range)} />
                )}
                {genderExclusiveText && (
                  <ResultProperty label="Género" value={genderExclusiveText} />
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
                {result.gradable != null && (
                  <ResultProperty label="Gradeable" value={result.gradable ? 'Sí' : 'No'} />
                )}
                <ResultProperty
                  label="Ubicación"
                  value={equipLocationsText}
                />
                {genderExclusiveText && (
                  <ResultProperty label="Género" value={genderExclusiveText} />
                )}
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
          {acquisitionChips.length > 0 && (
            <div className="result-card-section">
              <div className="acquisition-chips" role="group" aria-label="Fuentes de obtención">
                {acquisitionChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className={`acquisition-chip${openAcquisitionKey === chip.key ? ' is-active' : ''}`}
                    aria-pressed={openAcquisitionKey === chip.key}
                    onClick={() => {
                      setOpenAcquisitionKey((current) => (current === chip.key ? null : chip.key));
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {openAcquisitionKey === 'mob_drop' && drops.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock title={formatDropperSummary(drops.length, dropWithSpawn, dropWithoutSpawn)}>
                    <div className="result-card-dropped-by">
                      {drops.map((mob) => {
                        const pct = mob.chancePercent
                          ?? (mob.rate != null ? Math.min(mob.rate, 10000) / 100 : null);
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
                                    to={`/database?tab=maps&q=${encodeURIComponent(spawn.map)}&run=1`}
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
                  </AcquisitionBlock>
                </div>
              )}
              {openAcquisitionKey === 'npc_shop' && acquisition?.shops && acquisition.shops.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock
                    title={`Tienda NPC (${acquisition.shopTotal ?? acquisition.shops.length})`}
                  >
                    <ul className="acquisition-list">
                      {acquisition.shops.map((shop, index) => (
                        <li key={`${shop.shopId || shop.shopName}-${index}`}>
                          {shop.npcId ? (
                            <Link
                              to={`/database?tab=npcs&q=${encodeURIComponent(shop.npcId)}&run=1`}
                              className="acquisition-primary"
                            >
                              {shop.shopName}
                            </Link>
                          ) : (
                            <span className="acquisition-primary">{shop.shopName}</span>
                          )}
                          {shop.mapId && (
                            <>
                              {' · '}
                              <Link
                                to={`/database?tab=maps&q=${encodeURIComponent(shop.mapId)}&run=1`}
                                className="dropped-by-map"
                              >
                                {shop.mapId}
                                {shop.x != null && shop.y != null ? ` (${shop.x},${shop.y})` : ''}
                              </Link>
                            </>
                          )}
                          {shop.price != null && shop.price >= 0 && (
                            <span className="acquisition-meta"> — {shop.price.toLocaleString()}z</span>
                          )}
                          {shop.runtimeMutated && (
                            <span className="acquisition-flag"> puede cambiar in-game</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {(acquisition.shopTotal || 0) > acquisition.shops.length && (
                      <div className="acquisition-more">
                        +{(acquisition.shopTotal || 0) - acquisition.shops.length} tiendas más
                      </div>
                    )}
                  </AcquisitionBlock>
                </div>
              )}
              {openAcquisitionKey === 'box_reward' && acquisition?.boxes && acquisition.boxes.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock
                    title={`Cofre / caja (${acquisition.boxTotal ?? acquisition.boxes.length})`}
                  >
                    <ul className="acquisition-list">
                      {acquisition.boxes.map((box, index) => (
                        <li key={`${box.boxId || box.groupName}-${index}`}>
                          <span className="acquisition-primary">
                            {box.openers.length > 0
                              ? box.openers.map((o) => o.name).join(', ')
                              : 'Caja'}
                          </span>
                          {box.groupName && (
                            <>
                              <span className="acquisition-meta"> · grupo </span>
                              <button
                                type="button"
                                className="acquisition-group-link"
                                onClick={() => openBoxGroupModal(box.groupName!)}
                              >
                                {box.groupName}
                              </button>
                            </>
                          )}
                          {box.chanceLabel && (
                            <span className="acquisition-meta"> — {box.chanceLabel}</span>
                          )}
                          {box.openers.length > 0 && (
                            <div className="dropped-by-maps">
                              {box.openers.map((opener) => (
                                <Link
                                  key={opener.id}
                                  to={`/database?tab=items&q=${opener.id}`}
                                  className="dropped-by-map"
                                >
                                  #{opener.id}
                                </Link>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    {(acquisition.boxTotal || 0) > acquisition.boxes.length && (
                      <div className="acquisition-more">
                        +{(acquisition.boxTotal || 0) - acquisition.boxes.length} cajas más
                      </div>
                    )}
                  </AcquisitionBlock>
                </div>
              )}
              {openAcquisitionKey === 'crafting' && acquisition?.crafting && acquisition.crafting.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock title={`Crafteo (${acquisition.crafting.length})`}>
                    <ul className="acquisition-list">
                      {acquisition.crafting.map((recipe, index) => (
                        <li key={`${recipe.recipeId}-${index}`}>
                          <span className="acquisition-primary">
                            {recipe.skillName
                              ? `${recipe.skillName}${recipe.skillLevel != null ? ` Lv.${recipe.skillLevel}` : ''}`
                              : (recipe.family || 'Receta')}
                          </span>
                          {recipe.amount != null && recipe.amount > 1 && (
                            <span className="acquisition-meta"> · x{recipe.amount}</span>
                          )}
                          {recipe.successVariable ? (
                            <span className="acquisition-flag"> — éxito variable (no es 0%)</span>
                          ) : recipe.successLabel ? (
                            <span className="acquisition-meta"> — {recipe.successLabel}</span>
                          ) : null}
                          {recipe.zenyCost != null && recipe.zenyCost > 0 && (
                            <span className="acquisition-meta"> · {recipe.zenyCost.toLocaleString()}z</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AcquisitionBlock>
                </div>
              )}
              {openAcquisitionKey === 'npc_barter' && acquisition?.barters && acquisition.barters.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock
                    title={`Trueque (${acquisition.barterTotal ?? acquisition.barters.length})`}
                  >
                    <ul className="acquisition-list">
                      {acquisition.barters.map((barter, index) => (
                        <li key={`${barter.barterName}-${index}`}>
                          <span className="acquisition-primary">
                            {barter.barterName || 'Barter'}
                          </span>
                          {barter.zeny != null && barter.zeny > 0 && (
                            <span className="acquisition-meta"> · {barter.zeny.toLocaleString()}z</span>
                          )}
                          {barter.requires.length > 0 && (
                            <div className="acquisition-requires">
                              Requiere:{' '}
                              {barter.requires.map((req, reqIndex) => (
                                <span key={`${req.id}-${reqIndex}`}>
                                  {reqIndex > 0 ? ', ' : ''}
                                  <Link to={`/database?tab=items&q=${req.id}`}>
                                    {req.name} x{req.amount}
                                  </Link>
                                </span>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AcquisitionBlock>
                </div>
              )}
              {openAcquisitionKey === 'npc_reward' && acquisition?.npcRewards && acquisition.npcRewards.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock
                    title={`Recompensa NPC (${acquisition.npcRewardTotal ?? acquisition.npcRewards.length})`}
                  >
                    <ul className="acquisition-list">
                      {acquisition.npcRewards.map((reward, index) => (
                        <li key={`${reward.npcId || reward.npcName}-${index}`}>
                          {reward.npcId ? (
                            <Link
                              to={`/database?tab=npcs&q=${encodeURIComponent(reward.npcId)}&run=1`}
                              className="acquisition-primary"
                            >
                              {reward.npcName}
                            </Link>
                          ) : (
                            <span className="acquisition-primary">{reward.npcName}</span>
                          )}
                          {reward.mapId && (
                            <>
                              {' · '}
                              <Link
                                to={`/database?tab=maps&q=${encodeURIComponent(reward.mapId)}&run=1`}
                                className="dropped-by-map"
                              >
                                {reward.mapId}
                              </Link>
                            </>
                          )}
                          {reward.quantityMin != null && (
                            <span className="acquisition-meta">
                              {' '}
                              — x{reward.quantityMin}
                              {reward.quantityMax != null && reward.quantityMax !== reward.quantityMin
                                ? `–${reward.quantityMax}`
                                : ''}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {(acquisition.npcRewardTotal || 0) > acquisition.npcRewards.length && (
                      <div className="acquisition-more">
                        +{(acquisition.npcRewardTotal || 0) - acquisition.npcRewards.length} más
                      </div>
                    )}
                  </AcquisitionBlock>
                </div>
              )}
              {(openAcquisitionKey === 'other'
                || openAcquisitionKey === 'quest_drop'
                || openAcquisitionKey === 'map_drop')
                && acquisition?.other
                && acquisition.other.length > 0 && (
                <div className="acquisition-panel">
                  <AcquisitionBlock title="Otras fuentes">
                    <ul className="acquisition-list">
                      {acquisition.other.map((row, index) => (
                        <li key={`${row.sourceType}-${index}`}>
                          <span className="acquisition-primary">{row.label}</span>
                          {row.mapId && (
                            <span className="acquisition-meta"> · {row.mapId}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AcquisitionBlock>
                </div>
              )}
            </div>
          )}
          <div className="result-card-section result-card-collapsible-actions result-card-action-row">
            {isCardItem && hasCardArt && (
              <button
                type="button"
                className="result-card-toggle"
                onClick={openCardArtModal}
              >
                Ver carta
              </button>
            )}
            <button
              type="button"
              className="result-card-toggle"
              onClick={openDescriptionModal}
            >
              Ver descripción
            </button>
            {hasScripts && (
              <button
                type="button"
                className="result-card-toggle"
                onClick={() => setScriptModalOpen(true)}
              >
                Ver script
              </button>
            )}
          </div>
          {descriptionModalOpen && createPortal(
            <div
              className="item-desc-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeDescriptionModal();
              }}
            >
              <div
                className="item-desc-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`item-desc-title-${result.id}`}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="item-desc-modal-head">
                  <div>
                    <h4 id={`item-desc-title-${result.id}`}>Descripción</h4>
                    <p className="item-desc-modal-subtitle">{result.name} (#{result.id})</p>
                  </div>
                  <button
                    type="button"
                    className="item-desc-modal-close"
                    onClick={closeDescriptionModal}
                    aria-label="Cerrar"
                  >
                    Cerrar
                  </button>
                </div>
                {descriptionLoading ? (
                  <div className="item-desc-modal-loading" aria-busy="true" aria-live="polite">
                    <img src="/logo.png" alt="Cargando descripción…" className="loading-logo" />
                  </div>
                ) : (
                  <div className="result-card-description item-desc-modal-body">
                    <div className="result-card-description-content">
                      {descriptionError
                        ? 'No se pudo cargar la descripción.'
                        : description
                          ? processColoredText(description)
                          : 'Sin descripción disponible.'}
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
          {scriptModalOpen && hasScripts && createPortal(
            <div
              className="item-desc-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeScriptModal();
              }}
            >
              <div
                className="item-desc-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`item-script-title-${result.id}`}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="item-desc-modal-head">
                  <div>
                    <h4 id={`item-script-title-${result.id}`}>Script</h4>
                    <p className="item-desc-modal-subtitle">{result.name} (#{result.id})</p>
                  </div>
                  <button
                    type="button"
                    className="item-desc-modal-close"
                    onClick={closeScriptModal}
                    aria-label="Cerrar"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="item-script-modal-body">
                  {scriptMain && (
                    <pre className="result-card-script">{scriptMain}</pre>
                  )}
                  {scriptEquip && (
                    <>
                      <div className="result-card-script-header">Al equipar:</div>
                      <pre className="result-card-script">{scriptEquip}</pre>
                    </>
                  )}
                  {scriptUnequip && (
                    <>
                      <div className="result-card-script-header">Al desequipar:</div>
                      <pre className="result-card-script">{scriptUnequip}</pre>
                    </>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
          {cardModalOpen && createPortal(
            <div
              className="item-card-art-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeCardModal();
              }}
            >
              <div
                className="item-card-art-frame"
                role="dialog"
                aria-modal="true"
                aria-label={result.name}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="item-card-art-close"
                  onClick={closeCardModal}
                  aria-label="Cerrar"
                >
                  ×
                </button>
                {cardArtLoading ? (
                  <div className="item-card-art-loading" aria-busy="true" aria-live="polite">
                    <img src="/logo.png" alt="Cargando carta…" className="loading-logo" />
                  </div>
                ) : cardArtError || !cardArt ? (
                  <p className="item-card-art-missing">No se encontró el arte de esta carta.</p>
                ) : (
                  <div
                    className="item-card-art-preview"
                    style={{
                      width: Math.round(cardArt.entry.w * 2.4),
                      height: Math.round(cardArt.entry.h * 2.4),
                      backgroundImage: `url(${cardAtlasUrl(cardArt.page.image)})`,
                      backgroundPosition: `-${cardArt.entry.x * 2.4}px -${cardArt.entry.y * 2.4}px`,
                      backgroundSize: `${cardArt.page.width * 2.4}px ${cardArt.page.height * 2.4}px`
                    }}
                    role="img"
                    aria-label={cardArt.entry.name}
                  />
                )}
              </div>
            </div>,
            document.body
          )}
          {boxGroupModalOpen && createPortal(
            <div
              className="item-desc-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeBoxGroupModal();
              }}
            >
              <div
                className="item-desc-modal item-box-group-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`box-group-title-${result.id}`}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="item-desc-modal-head">
                  <div>
                    <h4 id={`box-group-title-${result.id}`}>Grupo de caja</h4>
                    <p className="item-desc-modal-subtitle">
                      {boxGroupName}
                      {boxGroupData ? ` · ${boxGroupData.itemCount} objetos` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="item-desc-modal-close"
                    onClick={closeBoxGroupModal}
                    aria-label="Cerrar"
                  >
                    Cerrar
                  </button>
                </div>
                {boxGroupLoading ? (
                  <div className="item-desc-modal-loading" aria-busy="true" aria-live="polite">
                    <img src="/logo.png" alt="Cargando grupo…" className="loading-logo" />
                  </div>
                ) : boxGroupError || !boxGroupData ? (
                  <div className="item-desc-modal-body">No se pudo cargar el grupo.</div>
                ) : (
                  <ul className="box-group-list">
                    {boxGroupData.items.map((item) => (
                      <li key={item.rewardId} className="box-group-item">
                        <Link
                          to={`/database?tab=items&q=${item.id}`}
                          className="box-group-item-name"
                          onClick={closeBoxGroupModal}
                        >
                          {item.name}
                        </Link>
                        <span className="box-group-item-meta">
                          #{item.id}
                          {item.amount > 1 ? ` · x${item.amount}` : ''}
                          {item.subgroup != null ? ` · sub ${item.subgroup}` : ''}
                        </span>
                        <span className="box-group-item-chance">
                          {item.chanceLabel || '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
export type { SearchResult };
export {ITEM_TYPES};