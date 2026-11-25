import type { SearchOptions } from './databaseMappers';
import {
  defaultSearchOptions,
  ITEM_TYPE_ARMOR,
  ITEM_TYPE_WEAPON
} from './databaseMappers';

export type DatabaseTab = 'items' | 'mobs' | 'skills' | 'npcs' | 'quests' | 'maps' | 'mvps';

const DATABASE_TABS: DatabaseTab[] = ['items', 'mobs', 'skills', 'npcs', 'quests', 'maps', 'mvps'];

/**
 * URL params that only affect in-view focus/highlight (pins, arrival marker).
 * Changing them must NOT refetch/remount Database results — that caused
 * flicker and "click twice to select" across map/NPC deep links.
 */
export const DATABASE_VIEW_FOCUS_PARAMS = ['arrive', 'npc', 'mob'] as const;

/** Stable query string for data-loading effects (view-focus params stripped). */
export function databaseDataSearchKey(search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  for (const key of DATABASE_VIEW_FOCUS_PARAMS) {
    params.delete(key);
  }
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

export interface DatabaseUrlState {
  tab: DatabaseTab;
  q: string;
  page: number;
  run: boolean;
  options: SearchOptions;
  /** Explicit map detail deep link (?map=prontera). Not a search term. */
  mapId: string | null;
}

function optionsDifferFromDefaults(options: SearchOptions, tab: DatabaseTab): boolean {
  const defaults = defaultSearchOptions();
  if (tab === 'items') {
    if (options.selectedTypes.length > 0) return true;
    if (options.selectedArmorSubtypes.length > 0) return true;
    if (options.selectedCostumeSubtypes.length > 0) return true;
    if (options.selectedWeaponSubtypes.length > 0) return true;
    if (options.selectedCardLocations.length > 0) return true;
    if (options.selectedShadowSubtypes.length > 0) return true;
    if (options.selectedAmmoSubtypes.length > 0) return true;
    if (options.selectedJobs.length > 0) return true;
    if (options.selectedClasses.length > 0) return true;
    if (options.scriptQuery.trim()) return true;
    if (options.selectedAcquisitionSources.length > 0) return true;
    if (options.hideItemsWithoutNaturalDrop !== defaults.hideItemsWithoutNaturalDrop) return true;
    if (options.hideWithoutSprite !== defaults.hideWithoutSprite) return true;
    return false;
  }
  if (tab === 'npcs') {
    if (options.selectedNpcTypes.length > 0) return true;
    if (options.npcHasShop) return true;
    if (options.npcHasSprite) return true;
    if (options.npcHasReward) return true;
    if (options.npcHasQuest) return true;
    if (options.npcAccessible) return true;
    return false;
  }
  if (tab === 'quests') {
    if (options.questHasTargets) return true;
    if (options.questHasDrops) return true;
    if (options.questHasNpc) return true;
    if (options.questHasTimeLimit) return true;
    return false;
  }
  if (tab === 'skills') {
    if (options.selectedSkillPrefixes.length > 0) return true;
    if (options.selectedSkillTypes.length > 0) return true;
    if (options.selectedSkillTargetTypes.length > 0) return true;
    if (options.skillPlatinumOnly) return true;
    if (options.skillQuestOnly) return true;
    if (options.skillHasMobUse) return true;
    if (options.skillHasItemCost) return true;
    if (options.skillHasTeacher) return true;
    if (options.skillHasPrereq) return true;
    return false;
  }
  if (tab === 'maps') {
    if (options.selectedMapCategories.length > 0) return true;
    if (options.mapHasSpawns) return true;
    if (options.mapHasNpcs) return true;
    if (options.mapAccessible) return true;
    return false;
  }
  if (options.selectedElements.length > 0) return true;
  if (options.selectedRaces.length > 0) return true;
  if (options.selectedSizes.length > 0) return true;
  if (options.selectedRoles.length > 0) return true;
  if (options.levelMin.trim() || options.levelMax.trim()) return true;
  if (options.hpMin.trim() || options.hpMax.trim()) return true;
  if (options.hideMobsWithoutSpawn !== defaults.hideMobsWithoutSpawn) return true;
  if (options.includeInstanceSpawns !== defaults.includeInstanceSpawns) return true;
  if (options.showBoss !== defaults.showBoss) return true;
  if (options.showNormal !== defaults.showNormal) return true;
  if (options.showMvp !== defaults.showMvp) return true;
  if (options.hideWithoutSprite !== defaults.hideWithoutSprite) return true;
  return false;
}

export function hasSearchCriteria(state: DatabaseUrlState): boolean {
  if (state.mapId) return true;
  if (state.run) return true;
  return Boolean(state.q.trim()) || optionsDifferFromDefaults(state.options, state.tab);
}

function parseCsvList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function parseBoolParam(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return undefined;
}

export function parseDatabaseUrl(search: string): DatabaseUrlState {
  const params = new URLSearchParams(search);
  const tabParam = params.get('tab') as DatabaseTab | null;
  const tab: DatabaseTab = tabParam && DATABASE_TABS.includes(tabParam) ? tabParam : 'items';
  const q = params.get('q') ?? '';
  const pageRaw = parseInt(params.get('page') ?? '1', 10);
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 0 : pageRaw - 1;
  const run = params.get('run') === '1';
  const mapIdRaw = params.get('map');
  const mapId = mapIdRaw && mapIdRaw.trim() ? mapIdRaw.trim() : null;

  const options = defaultSearchOptions();

  const typeNames = params.get('type');
  if (typeNames) {
    // Keep Armor/Armor2 as a single Armor checkbox selection
    const raw = typeNames.split(',').map((name) => name.trim()).filter(Boolean);
    const selected = new Set<string>();
    for (const name of raw) {
      if (name === 'Armor2') selected.add(ITEM_TYPE_ARMOR);
      else selected.add(name);
    }
    options.selectedTypes = [...selected];
  } else if (params.get('subtype')) {
    options.selectedTypes = [ITEM_TYPE_ARMOR];
  } else if (params.get('costumeSubtype')) {
    options.selectedTypes = ['Costume'];
  } else if (params.get('weaponSubtype')) {
    options.selectedTypes = [ITEM_TYPE_WEAPON];
  } else if (params.get('shadowSubtype')) {
    options.selectedTypes = ['Shadowgear'];
  } else if (params.get('ammoSubtype')) {
    options.selectedTypes = ['Ammo'];
  }

  options.selectedArmorSubtypes = parseCsvList(params.get('subtype'));
  options.selectedCostumeSubtypes = parseCsvList(params.get('costumeSubtype'));
  options.selectedWeaponSubtypes = parseCsvList(params.get('weaponSubtype'));
  options.selectedCardLocations = parseCsvList(params.get('cardInsert'));
  options.selectedShadowSubtypes = parseCsvList(params.get('shadowSubtype'));
  options.selectedAmmoSubtypes = parseCsvList(params.get('ammoSubtype'));
  options.selectedJobs = parseCsvList(params.get('jobs'));
  options.selectedClasses = parseCsvList(params.get('class'));
  options.scriptQuery = params.get('script') ?? '';
  options.selectedAcquisitionSources = parseCsvList(params.get('sourceType'));

  const naturalDrop = parseBoolParam(params.get('naturalDrop'));
  if (naturalDrop !== undefined) {
    options.hideItemsWithoutNaturalDrop = naturalDrop;
  }

  const hideSprite = parseBoolParam(params.get('hideNoSprite'));
  if (hideSprite !== undefined) {
    options.hideWithoutSprite = hideSprite;
  }

  options.selectedElements = parseCsvList(params.get('element'));
  options.selectedRaces = parseCsvList(params.get('race'));
  options.selectedSizes = parseCsvList(params.get('size'));
  options.selectedRoles = parseCsvList(params.get('role'));
  options.levelMin = params.get('levelMin') ?? '';
  options.levelMax = params.get('levelMax') ?? '';
  options.hpMin = params.get('hpMin') ?? '';
  options.hpMax = params.get('hpMax') ?? '';

  options.selectedSkillPrefixes = parseCsvList(params.get('prefix')).map((p) => p.toUpperCase());
  options.selectedSkillTypes = parseCsvList(params.get('skillType'));
  options.selectedSkillTargetTypes = parseCsvList(params.get('targetType'));
  const skillPlatinum = parseBoolParam(params.get('platinum'));
  if (skillPlatinum !== undefined) options.skillPlatinumOnly = skillPlatinum;
  const skillQuest = parseBoolParam(params.get('quest'));
  if (skillQuest !== undefined) options.skillQuestOnly = skillQuest;
  const skillHasMob = parseBoolParam(params.get('hasMobUse'));
  if (skillHasMob !== undefined) options.skillHasMobUse = skillHasMob;
  const skillHasCost = parseBoolParam(params.get('hasItemCost'));
  if (skillHasCost !== undefined) options.skillHasItemCost = skillHasCost;
  const skillHasTeacher = parseBoolParam(params.get('hasTeacher'));
  if (skillHasTeacher !== undefined) options.skillHasTeacher = skillHasTeacher;
  const skillHasPrereq = parseBoolParam(params.get('hasPrereq'));
  if (skillHasPrereq !== undefined) options.skillHasPrereq = skillHasPrereq;

  options.selectedMapCategories = parseCsvList(params.get('mapCategory'));
  const mapHasSpawns = parseBoolParam(params.get('mapHasSpawns'));
  if (mapHasSpawns !== undefined) options.mapHasSpawns = mapHasSpawns;
  const mapHasNpcs = parseBoolParam(params.get('mapHasNpcs'));
  if (mapHasNpcs !== undefined) options.mapHasNpcs = mapHasNpcs;
  const mapAccessible = parseBoolParam(params.get('mapAccessible'));
  if (mapAccessible !== undefined) options.mapAccessible = mapAccessible;

  options.selectedNpcTypes = parseCsvList(params.get('npcType'));
  const npcHasShop = parseBoolParam(params.get('npcHasShop'));
  if (npcHasShop !== undefined) options.npcHasShop = npcHasShop;
  const npcHasSprite = parseBoolParam(params.get('npcHasSprite'));
  if (npcHasSprite !== undefined) options.npcHasSprite = npcHasSprite;
  const npcHasReward = parseBoolParam(params.get('npcHasReward'));
  if (npcHasReward !== undefined) options.npcHasReward = npcHasReward;
  const npcHasQuest = parseBoolParam(params.get('npcHasQuest'));
  if (npcHasQuest !== undefined) options.npcHasQuest = npcHasQuest;
  const npcAccessible = parseBoolParam(params.get('npcAccessible'));
  if (npcAccessible !== undefined) options.npcAccessible = npcAccessible;

  const questHasTargets = parseBoolParam(params.get('questHasTargets'));
  if (questHasTargets !== undefined) options.questHasTargets = questHasTargets;
  const questHasDrops = parseBoolParam(params.get('questHasDrops'));
  if (questHasDrops !== undefined) options.questHasDrops = questHasDrops;
  const questHasNpc = parseBoolParam(params.get('questHasNpc'));
  if (questHasNpc !== undefined) options.questHasNpc = questHasNpc;
  const questHasTimeLimit = parseBoolParam(params.get('questHasTimeLimit'));
  if (questHasTimeLimit !== undefined) options.questHasTimeLimit = questHasTimeLimit;

  const kinds = params.get('kinds');
  if (kinds) {
    const set = new Set(kinds.split(',').map((k) => k.trim().toLowerCase()));
    options.showMvp = set.has('mvp');
    options.showBoss = set.has('boss');
    options.showNormal = set.has('normal');
  }

  const hasSpawn = parseBoolParam(params.get('hasSpawn'));
  if (hasSpawn !== undefined) {
    options.hideMobsWithoutSpawn = hasSpawn;
  }

  const includeInstances = parseBoolParam(params.get('includeInstances'));
  if (includeInstances !== undefined) {
    options.includeInstanceSpawns = includeInstances;
  }

  return { tab, q, page, run, options, mapId };
}

/** Deep links ?mob= / ?item= → tab search by id. */
export function getLegacyDeepLinkId(search: string): { tab: DatabaseTab; q: string } | null {
  const params = new URLSearchParams(search);
  const mobId = params.get('mob');
  if (mobId) return { tab: 'mobs', q: mobId };
  const itemId = params.get('item');
  if (itemId) return { tab: 'items', q: itemId };
  return null;
}

export function buildDatabaseSearchParams(
  tab: DatabaseTab,
  q: string,
  page: number,
  options: SearchOptions,
  run = false
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = defaultSearchOptions();

  params.set('tab', tab);
  const trimmed = q.trim();
  if (trimmed) params.set('q', trimmed);
  if (page > 0) params.set('page', String(page + 1));
  if (run) params.set('run', '1');

  if (tab === 'items') {
    if (options.selectedTypes.length > 0) {
      params.set('type', options.selectedTypes.join(','));
    }
    if (options.selectedArmorSubtypes.length > 0) {
      params.set('subtype', options.selectedArmorSubtypes.join(','));
    }
    if (options.selectedCostumeSubtypes.length > 0) {
      params.set('costumeSubtype', options.selectedCostumeSubtypes.join(','));
    }
    if (options.selectedWeaponSubtypes.length > 0) {
      params.set('weaponSubtype', options.selectedWeaponSubtypes.join(','));
    }
    if (options.selectedCardLocations.length > 0) {
      params.set('cardInsert', options.selectedCardLocations.join(','));
    }
    if (options.selectedShadowSubtypes.length > 0) {
      params.set('shadowSubtype', options.selectedShadowSubtypes.join(','));
    }
    if (options.selectedAmmoSubtypes.length > 0) {
      params.set('ammoSubtype', options.selectedAmmoSubtypes.join(','));
    }
    if (options.selectedJobs.length > 0) {
      params.set('jobs', options.selectedJobs.join(','));
    }
    if (options.selectedClasses.length > 0) {
      params.set('class', options.selectedClasses.join(','));
    }
    const script = options.scriptQuery.trim();
    if (script) params.set('script', script);
    if (options.selectedAcquisitionSources.length > 0) {
      params.set('sourceType', options.selectedAcquisitionSources.join(','));
    }
    if (options.hideItemsWithoutNaturalDrop !== defaults.hideItemsWithoutNaturalDrop) {
      params.set('naturalDrop', options.hideItemsWithoutNaturalDrop ? '1' : '0');
    } else if (run) {
      params.set('naturalDrop', options.hideItemsWithoutNaturalDrop ? '1' : '0');
    }
    if (options.hideWithoutSprite !== defaults.hideWithoutSprite) {
      params.set('hideNoSprite', options.hideWithoutSprite ? '1' : '0');
    } else if (run) {
      params.set('hideNoSprite', options.hideWithoutSprite ? '1' : '0');
    }
  }

  if (tab === 'skills') {
    if (options.selectedSkillPrefixes.length > 0) {
      params.set('prefix', options.selectedSkillPrefixes.join(','));
    }
    if (options.selectedSkillTypes.length > 0) {
      params.set('skillType', options.selectedSkillTypes.join(','));
    }
    if (options.selectedSkillTargetTypes.length > 0) {
      params.set('targetType', options.selectedSkillTargetTypes.join(','));
    }
    if (options.skillPlatinumOnly) params.set('platinum', '1');
    if (options.skillQuestOnly) params.set('quest', '1');
    if (options.skillHasMobUse) params.set('hasMobUse', '1');
    if (options.skillHasItemCost) params.set('hasItemCost', '1');
    if (options.skillHasTeacher) params.set('hasTeacher', '1');
    if (options.skillHasPrereq) params.set('hasPrereq', '1');
  }

  if (tab === 'maps') {
    if (options.selectedMapCategories.length > 0) {
      params.set('mapCategory', options.selectedMapCategories.join(','));
    }
    if (options.mapHasSpawns) params.set('mapHasSpawns', '1');
    if (options.mapHasNpcs) params.set('mapHasNpcs', '1');
    if (options.mapAccessible) params.set('mapAccessible', '1');
  }

  if (tab === 'npcs') {
    if (options.selectedNpcTypes.length > 0) {
      params.set('npcType', options.selectedNpcTypes.join(','));
    }
    if (options.npcHasShop) params.set('npcHasShop', '1');
    if (options.npcHasSprite) params.set('npcHasSprite', '1');
    if (options.npcHasReward) params.set('npcHasReward', '1');
    if (options.npcHasQuest) params.set('npcHasQuest', '1');
    if (options.npcAccessible) params.set('npcAccessible', '1');
  }

  if (tab === 'quests') {
    if (options.questHasTargets) params.set('questHasTargets', '1');
    if (options.questHasDrops) params.set('questHasDrops', '1');
    if (options.questHasNpc) params.set('questHasNpc', '1');
    if (options.questHasTimeLimit) params.set('questHasTimeLimit', '1');
  }

  if (tab === 'mobs') {
    if (options.selectedElements.length > 0) {
      params.set('element', options.selectedElements.join(','));
    }
    if (options.selectedRaces.length > 0) {
      params.set('race', options.selectedRaces.join(','));
    }
    if (options.selectedSizes.length > 0) {
      params.set('size', options.selectedSizes.join(','));
    }
    if (options.selectedRoles.length > 0) {
      params.set('role', options.selectedRoles.join(','));
    }
    if (options.levelMin.trim()) params.set('levelMin', options.levelMin.trim());
    if (options.levelMax.trim()) params.set('levelMax', options.levelMax.trim());
    if (options.hpMin.trim()) params.set('hpMin', options.hpMin.trim());
    if (options.hpMax.trim()) params.set('hpMax', options.hpMax.trim());

    const kinds: string[] = [];
    if (options.showMvp) kinds.push('mvp');
    if (options.showBoss) kinds.push('boss');
    if (options.showNormal) kinds.push('normal');
    if (kinds.length > 0 && kinds.length < 3) {
      params.set('kinds', kinds.join(','));
    }

    if (options.hideMobsWithoutSpawn !== defaults.hideMobsWithoutSpawn) {
      params.set('hasSpawn', options.hideMobsWithoutSpawn ? '1' : '0');
    } else if (run) {
      params.set('hasSpawn', options.hideMobsWithoutSpawn ? '1' : '0');
    }
    if (options.includeInstanceSpawns !== defaults.includeInstanceSpawns) {
      params.set('includeInstances', options.includeInstanceSpawns ? '1' : '0');
    }
    if (options.hideWithoutSprite !== defaults.hideWithoutSprite) {
      params.set('hideNoSprite', options.hideWithoutSprite ? '1' : '0');
    } else if (run) {
      params.set('hideNoSprite', options.hideWithoutSprite ? '1' : '0');
    }
  }

  return params;
}