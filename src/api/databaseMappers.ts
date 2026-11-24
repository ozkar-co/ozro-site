import type { ItemDetail, ItemSummary, MobDetail, MobSummary } from './client';
import type { MobResult } from '../components/MobCard';
import type { SearchResult } from '../components/ItemCard';
import {
  PLACEHOLDER_ITEM_ICON,
  PLACEHOLDER_ITEM_ILLUSTRATION,
  PLACEHOLDER_MOB_SPRITE
} from './placeholders';

const ELEMENT_TO_API: Record<number, string> = {
  0: 'Neutral',
  1: 'Water',
  2: 'Earth',
  3: 'Fire',
  4: 'Wind',
  5: 'Poison',
  6: 'Holy',
  7: 'Shadow',
  8: 'Ghost',
  9: 'Undead'
};

const RACE_TO_API: Record<number, string> = {
  0: 'Formless',
  1: 'Undead',
  2: 'Brute',
  3: 'Plant',
  4: 'Insect',
  5: 'Fish',
  6: 'Demon',
  7: 'Demi-Human',
  8: 'Angel',
  9: 'Dragon'
};

const SIZE_TO_API: Record<number, string> = {
  0: 'Small',
  1: 'Medium',
  2: 'Large'
};

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
  Card: 6,
  Petegg: 7,
  Petarmor: 8,
  Ammo: 10,
  DelayConsume: 11,
  Delayconsume: 11,
  Cash: 12,
  Shadowgear: 13
};

/** Labels for ozro_items.type filter checkboxes. */
export const ITEM_TYPE_FILTER_LABELS: Record<string, string> = {
  Healing: 'Healing',
  Usable: 'Usable',
  Etc: 'Etc',
  Weapon: 'Weapon',
  Armor: 'Armor',
  Card: 'Card',
  Cash: 'Cash',
  Shadowgear: 'Shadow gear',
  DelayConsume: 'Delayed usable',
  Petegg: 'Pet egg',
  Petarmor: 'Pet equipment',
  Ammo: 'Ammo',
  Armor2: 'Armor (alt)'
};

/** Fallback order when /items/meta is unavailable. */
export const ITEM_TYPE_FILTER_ORDER = [
  'Healing', 'Usable', 'Etc', 'Weapon', 'Armor', 'Card',
  'Cash', 'Shadowgear', 'DelayConsume', 'Petegg', 'Petarmor', 'Ammo'
] as const;

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

const MOB_MODE_LABELS: Record<string, string> = {
  canmove: 'Can Move', looter: 'Looter', aggressive: 'Agresivo', assist: 'Assist',
  castsensoridle: 'Cast Sensor', norandomwalk: 'No Random Walk', nocast: 'No Cast',
  canattack: 'Can Attack', castsensorchase: 'Cast Chase', changechase: 'Change Chase',
  angry: 'Angry', changetargetmelee: 'Change Target Melee',
  changetargetchase: 'Change Target Chase', targetweak: 'Target Weak',
  randomtarget: 'Random Target', ignoremelee: 'Ignore Melee',
  ignoremagic: 'Ignore Magic', ignoreranged: 'Ignore Ranged',
  mvp: 'MVP', ignoremisc: 'Ignore Misc', knockbackimmune: 'No Knockback',
  teleportblock: 'No Teleport', fixeditemdrop: 'Fixed Drop', detector: 'Detector',
  statusimmune: 'Status Immune', skillimmune: 'Skill Immune'
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

const ELEMENT_FROM_API = Object.fromEntries(
  Object.entries(ELEMENT_TO_API).map(([id, name]) => [name, Number(id)])
);

const RACE_FROM_API = Object.fromEntries(
  Object.entries(RACE_TO_API).map(([id, name]) => [name, Number(id)])
);

const SIZE_FROM_API = Object.fromEntries(
  Object.entries(SIZE_TO_API).map(([id, name]) => [name, Number(id)])
);

export const ITEM_TYPE_WEAPON = 'Weapon';
export const ITEM_TYPE_ARMOR = 'Armor';
export const ITEM_TYPE_CARD = 'Card';
export const ITEM_TYPE_CASH = 'Cash';
export const ITEM_TYPE_SHADOWGEAR = 'Shadowgear';

/** Debe coincidir con server/api/services/gameDb.js ITEM_ARMOR_DB_TYPES */
export const ITEM_ARMOR_DB_TYPES = ['Armor', 'Armor2'] as const;

function itemTypesForApi(selectedTypes: string[]): string[] {
  const names: string[] = [];
  for (const typeName of selectedTypes) {
    if (!typeName) continue;
    if (typeName === ITEM_TYPE_ARMOR) {
      names.push(...ITEM_ARMOR_DB_TYPES);
    } else {
      names.push(typeName);
    }
  }
  return [...new Set(names)];
}

export function itemTypeFilterLabel(typeName: string): string {
  return ITEM_TYPE_FILTER_LABELS[typeName] || typeName.replace(/_/g, ' ');
}

export const CARD_LOCATION_OPTIONS: Record<string, string> = {
  headTop: 'Casco (arriba)',
  headMid: 'Casco (medio)',
  headLow: 'Casco (abajo)',
  armor: 'Armadura',
  rightHand: 'Mano derecha',
  leftHand: 'Mano izquierda',
  garment: 'Capa',
  shoes: 'Calzado',
  rightAccessory: 'Accesorio derecho',
  leftAccessory: 'Accesorio izquierdo',
  shadowArmor: 'Shadow armadura',
  shadowWeapon: 'Shadow arma',
  shadowShield: 'Shadow escudo',
  shadowShoes: 'Shadow calzado',
  shadowRightAccessory: 'Shadow acc. derecho',
  shadowLeftAccessory: 'Shadow acc. izquierdo'
};

export const ARMOR_SUBTYPE_LABELS: Record<string, string> = {
  Armor: 'Armadura',
  Garment: 'Capa',
  Head_Top: 'Casco (arriba)',
  Head_Mid: 'Casco (medio)',
  Head_Low: 'Casco (abajo)',
  Shoes: 'Calzado',
  Left_Accessory: 'Accesorio izquierdo',
  Right_Accessory: 'Accesorio derecho',
  Both_Hand: 'Dos manos (escudo)',
  Ammo: 'Munición',
  Shadow_Armor: 'Shadow armadura',
  Shadow_Weapon: 'Shadow arma',
  Shadow_Shield: 'Shadow escudo',
  Shadow_Shoes: 'Shadow calzado',
  Shadow_Left_Accessory: 'Shadow acc. izquierdo',
  Shadow_Right_Accessory: 'Shadow acc. derecho',
  Costume_Head_Top: 'Disfraz casco (arriba)',
  Costume_Head_Mid: 'Disfraz casco (medio)',
  Costume_Head_Low: 'Disfraz casco (abajo)',
  Costume_Garment: 'Disfraz capa'
};

export function armorSubtypeLabel(value: string): string {
  return ARMOR_SUBTYPE_LABELS[value] || value.replace(/_/g, ' ');
}

export const WEAPON_SUBTYPE_LABELS: Record<string, string> = {
  Fist: 'Puño',
  Dagger: 'Daga',
  '1hSword': 'Espada 1 mano',
  '2hSword': 'Espada 2 manos',
  '1hSpear': 'Lanza 1 mano',
  '2hSpear': 'Lanza 2 manos',
  '1hAxe': 'Hacha 1 mano',
  '2hAxe': 'Hacha 2 manos',
  Mace: 'Maza',
  Staff: 'Bastón',
  Bow: 'Arco',
  Knuckle: 'Puños',
  Musical: 'Instrumento',
  Whip: 'Látigo',
  Book: 'Libro',
  Katar: 'Katar',
  Revolver: 'Revólver',
  Rifle: 'Rifle',
  Gatling: 'Gatling',
  Shotgun: 'Escopeta',
  Grenade: 'Granada',
  Huuma: 'Huuma',
  '2hStaff': 'Bastón 2 manos'
};

export function weaponSubtypeLabel(value: string): string {
  return WEAPON_SUBTYPE_LABELS[value] || value.replace(/_/g, ' ');
}

/** Filtros de obtención (API sourceType). */
export const ACQUISITION_SOURCE_OPTIONS: { id: string; label: string }[] = [
  { id: 'mob_drop', label: 'Drop monstruo' },
  { id: 'npc_shop', label: 'Tienda NPC' },
  { id: 'box_reward', label: 'Cofre / caja' },
  { id: 'crafting', label: 'Crafteo' },
  { id: 'npc_barter', label: 'Trueque' },
  { id: 'npc_reward', label: 'Recompensa NPC' },
  { id: 'quest_drop', label: 'Drop quest' },
  { id: 'map_drop', label: 'Drop de mapa' }
];

export interface SearchOptions {
  selectedTypes: string[];
  selectedArmorSubtypes: string[];
  selectedWeaponSubtypes: string[];
  selectedCardLocations: string[];
  scriptQuery: string;
  selectedAcquisitionSources: string[];
  selectedElements: number[];
  selectedRaces: number[];
  selectedSizes: number[];
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
  selectedWeaponSubtypes: [],
  selectedCardLocations: [],
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
    params.element = options.selectedElements
      .map((id) => ELEMENT_TO_API[id])
      .filter(Boolean)
      .join(',');
  }

  if (options.selectedRaces.length > 0) {
    params.race = options.selectedRaces
      .map((id) => RACE_TO_API[id])
      .filter(Boolean)
      .join(',');
  }

  if (options.selectedSizes.length > 0) {
    params.size = options.selectedSizes
      .map((id) => SIZE_TO_API[id])
      .filter(Boolean)
      .join(',');
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
    // Subtipos de armadura pueden incluir slots shadow → incluir Shadowgear
    const shadowSubtype = options.selectedArmorSubtypes.some((s) => s.startsWith('Shadow_'));
    params.type = shadowSubtype
      ? [...ITEM_ARMOR_DB_TYPES, ITEM_TYPE_SHADOWGEAR].join(',')
      : ITEM_ARMOR_DB_TYPES.join(',');
  } else if (options.selectedWeaponSubtypes.length > 0) {
    params.type = 'Weapon';
  }

  if (options.hideItemsWithoutNaturalDrop) {
    params.hasNaturalDrop = 'true';
  }

  if (options.selectedArmorSubtypes.length > 0) {
    params.subtype = options.selectedArmorSubtypes.join(',');
  }

  if (options.selectedWeaponSubtypes.length > 0) {
    params.weaponSubtype = options.selectedWeaponSubtypes.join(',');
  }

  const cardSelected = options.selectedTypes.includes(ITEM_TYPE_CARD);
  if (cardSelected && options.selectedCardLocations.length > 0) {
    params.location = options.selectedCardLocations.join(',');
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

function numericElement(element: string, elementLevel = 1): number {
  const base = ELEMENT_FROM_API[element] ?? 0;
  return base + (Math.max(1, elementLevel) - 1) * 20;
}

export function mapMobToCard(mob: MobSummary | MobDetail, sprite = PLACEHOLDER_MOB_SPRITE): MobResult {
  const detail = mob as MobDetail;
  return {
    id: String(mob.id),
    name: mob.name,
    nameJapanese: mob.nameJapanese ?? null,
    nameAegis: mob.nameAegis,
    sprite,
    hp: mob.hp ?? 0,
    lvl: mob.level ?? 0,
    def: mob.defense ?? 0,
    mdef: mob.magicDefense ?? 0,
    atk: mob.attack ?? 0,
    str: detail.str ?? 0,
    agi: detail.agi ?? 0,
    vit: detail.vit ?? 0,
    int: detail.int ?? 0,
    dex: detail.dex ?? 0,
    luk: detail.luk ?? 0,
    exp: mob.baseExp ?? 0,
    jexp: mob.jobExp ?? 0,
    mexp: mob.mvpExp ?? 0,
    element: numericElement(mob.element, mob.elementLevel),
    size: SIZE_FROM_API[mob.size] ?? 0,
    race: RACE_FROM_API[mob.race] ?? 0,
    drop: (detail.drops || []).map((drop) => ({
      id: drop.itemId ?? 0,
      type: drop.type === 'mvp' ? 'mvp' as const : drop.itemAegis?.includes('_C') ? 'card' as const : 'normal' as const,
      per: drop.rate ?? 0,
      itemName: drop.itemName,
      itemIcon: PLACEHOLDER_ITEM_ICON
    })),
    mobClass: mob.class || undefined,
    activeModes: detail.modes
      ? Object.entries(detail.modes)
        .filter(([, active]) => active)
        .map(([key]) => MOB_MODE_LABELS[key] || key)
      : undefined,
    attack2: detail.attack2 ?? undefined,
    sp: detail.sp ?? undefined,
    walkSpeed: detail.walkSpeed ?? undefined,
    spawns: detail.spawns,
    spawnMaps: mob.spawnMaps,
    spawnMapCount: mob.spawnMapCount,
    spawnAmount: mob.spawnAmount,
    hasWorldSpawn: mob.hasWorldSpawn,
    summons: mob.summons
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
