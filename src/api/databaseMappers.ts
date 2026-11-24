import type { ItemDetail, ItemSummary, MobDetail, MobSummary } from './client';
import type { MobResult } from '../components/MobCard';
import type { SearchResult } from '../components/ItemCard';
import {
  PLACEHOLDER_ITEM_ICON,
  PLACEHOLDER_ITEM_ILLUSTRATION,
  PLACEHOLDER_MOB_SPRITE
} from './placeholders';

/** @deprecated Prefer API type strings; kept for legacy numeric card fields. */
export const ITEM_TYPE_TO_API: Record<number, string> = {
  0: 'Healing',
  2: 'Usable',
  3: 'Etc',
  4: 'Weapon',
  5: 'Armor',
  6: 'Card',
  7: 'Petegg',
  8: 'Petarmor',
  10: 'Ammo',
  11: 'DelayConsume',
  12: 'Cash',
  13: 'Shadowgear',
  18: 'Usable'
};

const ITEM_TYPE_TO_NUMBER: Record<string, number> = {
  Healing: 0,
  Usable: 2,
  Etc: 3,
  Weapon: 4,
  Armor: 5,
  Armor2: 5,
  Costume: 5,
  Card: 6,
  Enchant: 6,
  Petegg: 7,
  Petarmor: 8,
  Ammo: 10,
  DelayConsume: 11,
  Delayconsume: 11,
  Cash: 12,
  Shadowgear: 13
};

/** Display label from a meta key — no dictionary, only mechanical cleanup. */
export function formatFilterLabel(value: string): string {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\+/g, ' + ');
}

const JOB_LABELS: Record<string, string> = {
  novice: 'Novice', swordman: 'Swordman', mage: 'Mage', archer: 'Archer',
  acolyte: 'Acolyte', merchant: 'Merchant', thief: 'Thief', knight: 'Knight',
  priest: 'Priest', wizard: 'Wizard', blacksmith: 'Blacksmith', hunter: 'Hunter',
  assassin: 'Assassin', crusader: 'Crusader', monk: 'Monk', sage: 'Sage',
  rogue: 'Rogue', alchemist: 'Alchemist', barddancer: 'Bard/Dancer',
  taekwon: 'Taekwon', stargladiator: 'Star Gladiator', soullinker: 'Soul Linker',
  gunslinger: 'Gunslinger', ninja: 'Ninja', kagerouoboro: 'Kagerou/Oboro',
  rebellion: 'Rebellion', summoner: 'Summoner', spirit_handler: 'Spirit Handler',
  supernovice: 'Super Novice'
};

const CLASS_LABELS: Record<string, string> = {
  normal: 'Normal', upper: 'Trans', baby: 'Baby', third: 'Third',
  third_upper: 'Trans Third', third_baby: 'Baby Third', fourth: 'Fourth'
};

const LOCATION_LABELS: Record<string, string> = {
  headTop: 'Head Top', headMid: 'Head Mid', headLow: 'Head Low',
  armor: 'Armor', rightHand: 'Right Hand', leftHand: 'Left Hand',
  garment: 'Garment', shoes: 'Shoes', rightAccessory: 'Acc. Right',
  leftAccessory: 'Acc. Left', ammo: 'Ammo',
  costumeHeadTop: 'Costume Top', costumeHeadMid: 'Costume Mid',
  costumeHeadLow: 'Costume Low', costumeGarment: 'Costume Garment',
  shadowArmor: 'Shadow Armor', shadowWeapon: 'Shadow Weapon',
  shadowShield: 'Shadow Shield', shadowShoes: 'Shadow Shoes',
  shadowRightAccessory: 'Shadow Acc. R', shadowLeftAccessory: 'Shadow Acc. L'
};

function formatJobs(jobs?: ItemDetail['jobs']): string {
  if (!jobs) return '';
  if (jobs.all) return 'Todos';
  return jobs.jobs.map((j) => JOB_LABELS[j] || j).join(', ');
}

function formatClasses(classes?: ItemDetail['classes']): string {
  if (!classes) return '';
  if (classes.all) return 'Todos';
  return classes.classes.map((c) => CLASS_LABELS[c] || c).join(', ');
}

function formatLocations(locations?: Record<string, boolean>): string {
  if (!locations) return '';
  return Object.entries(locations)
    .filter(([, active]) => active)
    .map(([key]) => LOCATION_LABELS[key] || key)
    .join(', ');
}

export const ITEM_TYPE_WEAPON = 'Weapon';
export const ITEM_TYPE_ARMOR = 'Armor';
export const ITEM_TYPE_COSTUME = 'Costume';
export const ITEM_TYPE_CARD = 'Card';
export const ITEM_TYPE_ENCHANT = 'Enchant';
export const ITEM_TYPE_CASH = 'Cash';
export const ITEM_TYPE_SHADOWGEAR = 'Shadowgear';
export const ITEM_TYPE_AMMO = 'Ammo';

/** Debe coincidir con server/api/services/gameDb.js ITEM_ARMOR_DB_TYPES */
export const ITEM_ARMOR_DB_TYPES = ['Armor', 'Armor2'] as const;

function itemTypesForApi(selectedTypes: string[]): string[] {
  // Server expands Armor → Armor/Armor2 and excludes costumes.
  // Do not send Armor2 as a bare type (that would bypass the costume split).
  const names: string[] = [];
  for (const typeName of selectedTypes) {
    if (!typeName || typeName === 'Armor2') continue;
    names.push(typeName);
  }
  return [...new Set(names)];
}


export interface SearchOptions {
  selectedTypes: string[];
  selectedArmorSubtypes: string[];
  selectedCostumeSubtypes: string[];
  selectedWeaponSubtypes: string[];
  selectedCardLocations: string[];
  selectedShadowSubtypes: string[];
  selectedAmmoSubtypes: string[];
  selectedJobs: string[];
  selectedClasses: string[];
  scriptQuery: string;
  selectedAcquisitionSources: string[];
  selectedElements: string[];
  selectedRaces: string[];
  selectedSizes: string[];
  showBoss: boolean;
  showNormal: boolean;
  showMvp: boolean;
  hideMobsWithoutSpawn: boolean;
  includeInstanceSpawns: boolean;
  hideItemsWithoutNaturalDrop: boolean;
  hideWithoutSprite: boolean;
}

export const defaultSearchOptions = (): SearchOptions => ({
  selectedTypes: [],
  selectedArmorSubtypes: [],
  selectedCostumeSubtypes: [],
  selectedWeaponSubtypes: [],
  selectedCardLocations: [],
  selectedShadowSubtypes: [],
  selectedAmmoSubtypes: [],
  selectedJobs: [],
  selectedClasses: [],
  scriptQuery: '',
  selectedAcquisitionSources: [],
  selectedElements: [],
  selectedRaces: [],
  selectedSizes: [],
  showBoss: true,
  showNormal: true,
  showMvp: true,
  hideMobsWithoutSpawn: true,
  includeInstanceSpawns: false,
  hideItemsWithoutNaturalDrop: true,
  hideWithoutSprite: true
});

export function buildMobSearchParams(
  searchTerm: string,
  options: SearchOptions,
  page: number,
  limit: number
): Record<string, string | number> {
  const params: Record<string, string | number> = { page: page + 1, limit };

  if (searchTerm.trim()) {
    params.q = searchTerm.trim();
  }

  if (options.selectedElements.length > 0) {
    params.element = options.selectedElements.join(',');
  }

  if (options.selectedRaces.length > 0) {
    params.race = options.selectedRaces.join(',');
  }

  if (options.selectedSizes.length > 0) {
    params.size = options.selectedSizes.join(',');
  }

  const kinds: string[] = [];
  if (options.showMvp) kinds.push('mvp');
  if (options.showBoss) kinds.push('boss');
  if (options.showNormal) kinds.push('normal');
  if (kinds.length > 0 && kinds.length < 3) {
    params.kinds = kinds.join(',');
  }

  if (options.hideMobsWithoutSpawn) {
    params.hasSpawn = 'true';
    if (options.includeInstanceSpawns) {
      params.includeInstances = 'true';
    }
  }

  return params;
}

export function buildItemSearchParams(
  searchTerm: string,
  options: SearchOptions,
  page: number,
  limit: number
): Record<string, string | number> {
  const params: Record<string, string | number> = { page: page + 1, limit };

  if (searchTerm.trim()) {
    params.q = searchTerm.trim();
  }

  if (options.selectedTypes.length > 0) {
    params.type = itemTypesForApi(options.selectedTypes).join(',');
  } else if (options.selectedArmorSubtypes.length > 0) {
    params.type = ITEM_TYPE_ARMOR;
  } else if (options.selectedCostumeSubtypes.length > 0) {
    params.type = ITEM_TYPE_COSTUME;
  } else if (options.selectedWeaponSubtypes.length > 0) {
    params.type = ITEM_TYPE_WEAPON;
  } else if (options.selectedShadowSubtypes.length > 0) {
    params.type = ITEM_TYPE_SHADOWGEAR;
  } else if (options.selectedAmmoSubtypes.length > 0) {
    params.type = ITEM_TYPE_AMMO;
  }

  if (options.hideItemsWithoutNaturalDrop) {
    params.hasNaturalDrop = 'true';
  }

  if (options.selectedArmorSubtypes.length > 0) {
    params.subtype = options.selectedArmorSubtypes.join(',');
  }

  if (options.selectedCostumeSubtypes.length > 0) {
    params.costumeSubtype = options.selectedCostumeSubtypes.join(',');
  }

  if (options.selectedWeaponSubtypes.length > 0) {
    params.weaponSubtype = options.selectedWeaponSubtypes.join(',');
  }

  if (options.selectedShadowSubtypes.length > 0) {
    params.shadowSubtype = options.selectedShadowSubtypes.join(',');
  }

  if (options.selectedAmmoSubtypes.length > 0) {
    params.ammoSubtype = options.selectedAmmoSubtypes.join(',');
  }

  const cardSelected = options.selectedTypes.includes(ITEM_TYPE_CARD);
  if (cardSelected && options.selectedCardLocations.length > 0) {
    params.cardInsert = options.selectedCardLocations.join(',');
  }

  if (options.selectedJobs.length > 0) {
    params.jobs = options.selectedJobs.join(',');
  }

  if (options.selectedClasses.length > 0) {
    params.class = options.selectedClasses.join(',');
  }

  const script = options.scriptQuery.trim();
  if (script) {
    params.script = script;
  }

  if (options.selectedAcquisitionSources.length > 0) {
    params.sourceType = options.selectedAcquisitionSources.join(',');
  }

  return params;
}

export function mapMobToCard(mob: MobSummary | MobDetail, sprite = PLACEHOLDER_MOB_SPRITE): MobResult {
  const detail = mob as MobDetail;
  const drops = detail.drops || [];
  return {
    id: String(mob.id),
    name: mob.name,
    nameJapanese: mob.nameJapanese ?? null,
    nameAegis: mob.nameAegis,
    sprite,
    hp: mob.hp ?? null,
    lvl: mob.level ?? null,
    def: mob.defense ?? null,
    mdef: mob.magicDefense ?? null,
    atk: mob.attack ?? null,
    str: detail.str ?? null,
    agi: detail.agi ?? null,
    vit: detail.vit ?? null,
    int: detail.int ?? null,
    dex: detail.dex ?? null,
    luk: detail.luk ?? null,
    exp: mob.baseExp ?? null,
    jexp: mob.jobExp ?? null,
    mexp: mob.mvpExp ?? null,
    element: mob.element ?? null,
    elementLevel: mob.elementLevel ?? null,
    size: mob.size ?? null,
    race: mob.race ?? null,
    isMvp: mob.isMvp ?? null,
    drop: drops
      .filter((drop) => drop.itemId != null && drop.rate != null)
      .map((drop) => ({
        id: drop.itemId as number,
        type: drop.type || null,
        per: drop.rate as number,
        chancePercent: drop.chancePercent ?? null,
        itemName: drop.itemName || drop.itemAegis || `#${drop.itemId}`,
        itemIcon: PLACEHOLDER_ITEM_ICON
      })),
    mobClass: mob.class || null,
    mobRole: mob.mobRole || null,
    activeModes: detail.modes
      ? Object.keys(detail.modes).map((key) => formatFilterLabel(key))
      : null,
    attack2: detail.attack2 ?? null,
    sp: detail.sp ?? null,
    attackRange: detail.attackRange ?? null,
    walkSpeed: detail.walkSpeed ?? null,
    attackDelay: detail.attackDelay ?? null,
    attackMotion: detail.attackMotion ?? null,
    damageMotion: detail.damageMotion ?? null,
    skillRange: detail.skillRange ?? null,
    chaseRange: detail.chaseRange ?? null,
    damageTaken: detail.damageTaken ?? null,
    resistance: detail.resistance ?? null,
    magicResistance: detail.magicResistance ?? null,
    raceGroups: detail.raceGroups ?? null,
    title: detail.title ?? null,
    ai: detail.ai ?? null,
    hpBase: mob.hpBase ?? null,
    hpStatus: mob.hpStatus ?? null,
    hpNote: mob.hpNote ?? null,
    spawns: detail.spawns,
    spawnMaps: mob.spawnMaps,
    spawnMapCount: mob.spawnMapCount,
    spawnAmount: mob.spawnAmount,
    hasWorldSpawn: mob.hasWorldSpawn,
    summons: (mob.summons || []).map((summon) => ({
      mobId: summon.mobId ?? null,
      mobName: summon.mobName ?? null,
      mobAegis: summon.mobAegis ?? null,
      amount: summon.amount ?? null,
      kind: summon.kind ?? null,
      skillId: summon.skillId ?? null,
      skillName: summon.skillName ?? null,
      conditions: summon.conditions ?? null
    })),
    skills: (detail.skills || []).map((skill) => ({
      skillId: skill.skillId ?? null,
      skillName: skill.skillName ?? null,
      skillLv: skill.skillLv ?? null,
      state: skill.state ?? null,
      conditionType: skill.conditionType ?? null,
      conditionValue: skill.conditionValue ?? null,
      rate: skill.rate ?? null
    }))
  };
}

export function mapItemToCard(
  item: ItemSummary | ItemDetail,
  icon = PLACEHOLDER_ITEM_ICON,
  illustration = PLACEHOLDER_ITEM_ILLUSTRATION
): SearchResult {
  const detail = item as ItemDetail;
  const jobsText = formatJobs(detail.jobs);
  const classesText = formatClasses(detail.classes);
  const locationsText = formatLocations(detail.locations);

  return {
    id: String(item.id),
    type: ITEM_TYPE_TO_NUMBER[item.type] ?? 3,
    typeLabel: item.type,
    subtype: 0,
    subtypeName: item.subtype || '',
    atk: item.attack ?? 0,
    matk: item.magicAttack ?? 0,
    defence: item.defense ?? 0,
    price_buy: item.priceBuy ?? 0,
    price_sell: item.priceSell ?? 0,
    weight: item.weight ?? 0,
    nameAegis: item.nameAegis,
    nameEnglish: item.nameEnglish ?? null,
    script: detail.script?.trim() || '',
    equipScript: detail.equipScript?.trim() || '',
    unequipScript: detail.unequipScript?.trim() || '',
    name: item.name,
    description: '',
    icon,
    illustration,
    slots: item.slots,
    equip_level_min: item.equipLevelMin,
    equip_level_max: item.equipLevelMax,
    refineable: detail.refineable,
    gradable: detail.gradable,
    weapon_level: detail.weaponLevel,
    armor_level: detail.armorLevel,
    range: detail.range,
    gender: detail.gender,
    jobsText,
    classesText,
    locationsText,
    droppedBy: detail.droppedBy || [],
    acquisition: detail.acquisition || null
  };
}
