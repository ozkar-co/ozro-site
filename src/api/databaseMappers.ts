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

const ITEM_TYPE_TO_NUMBER: Record<string, number> = Object.fromEntries(
  Object.entries(ITEM_TYPE_TO_API).map(([num, name]) => [name, Number(num)])
);

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
    }))
  };
}

export function mapItemToCard(
  item: ItemSummary | ItemDetail,
  icon = '/placeholder.png',
  illustration = '/placeholder.png'
): SearchResult {
  const detail = item as ItemDetail;
  return {
    id: String(item.id),
    type: ITEM_TYPE_TO_NUMBER[item.type] ?? 3,
    subtype: 0,
    atk: item.attack ?? 0,
    matk: item.magicAttack ?? 0,
    defence: item.defense ?? 0,
    price_buy: item.priceBuy ?? 0,
    price_sell: item.priceSell ?? 0,
    weight: item.weight ?? 0,
    codename1: item.nameAegis,
    codename2: item.subtype || '',
    script: detail.script || '',
    name: item.name,
    description: '',
    icon,
    illustration,
    slots: item.slots,
    equip_level_min: item.equipLevelMin,
    equip_level_max: item.equipLevelMax,
    refinable: detail.refineable,
    weapon_level: detail.weaponLevel
  };
}
