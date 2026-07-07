import type { ItemDetail, ItemSummary, MobDetail, MobSummary } from './client';
import type { MobResult } from '../components/MobCard';
import type { SearchResult } from '../components/ItemCard';

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

const ITEM_TYPE_TO_API: Record<number, string> = {
  0: 'Healing',
  2: 'Usable',
  3: 'Etc',
  4: 'Weapon',
  5: 'Armor',
  6: 'Card',
  7: 'Petegg',
  8: 'Petarmor',
  10: 'Ammo',
  11: 'Delayconsume',
  18: 'Usable'
};

const ITEM_TYPE_TO_NUMBER: Record<string, number> = {
  Healing: 0,
  Usable: 2,
  Etc: 3,
  Weapon: 4,
  Armor: 5,
  Card: 6,
  Petegg: 7,
  Petarmor: 8,
  Ammo: 10,
  Delayconsume: 11,
  Cash: 3,
  Shadowgear: 5,
  Armor2: 5
};

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

export interface SearchOptions {
  selectedTypes: number[];
  selectedElements: number[];
  selectedRaces: number[];
  selectedSizes: number[];
  showBoss: boolean;
  showNormal: boolean;
  showMvp: boolean;
}

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

  if (options.showMvp && !options.showNormal && !options.showBoss) {
    params.mvp = 'true';
  } else if (!options.showMvp && (options.showNormal || options.showBoss)) {
    params.mvp = 'false';
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
    params.type = options.selectedTypes
      .map((id) => ITEM_TYPE_TO_API[id])
      .filter(Boolean)
      .join(',');
  }

  return params;
}

function numericElement(element: string, elementLevel = 1): number {
  const base = ELEMENT_FROM_API[element] ?? 0;
  return base + (Math.max(1, elementLevel) - 1) * 20;
}

export function mapMobToCard(mob: MobSummary | MobDetail, sprite = '/placeholder.png'): MobResult {
  const detail = mob as MobDetail;
  return {
    id: String(mob.id),
    name: mob.name,
    name2: mob.nameJapanese || mob.nameAegis,
    code_name: mob.nameAegis,
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
      itemIcon: '/placeholder.png'
    })),
    mobClass: mob.class || undefined,
    activeModes: detail.modes
      ? Object.entries(detail.modes)
        .filter(([, active]) => active)
        .map(([key]) => MOB_MODE_LABELS[key] || key)
      : undefined,
    attack2: detail.attack2 ?? undefined,
    sp: detail.sp ?? undefined,
    walkSpeed: detail.walkSpeed ?? undefined
  };
}

export function mapItemToCard(
  item: ItemSummary | ItemDetail,
  icon = '/placeholder.png',
  illustration = '/placeholder.png'
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
    codename1: item.nameAegis,
    codename2: item.subtype || '',
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
    droppedBy: detail.droppedBy || []
  };
}
