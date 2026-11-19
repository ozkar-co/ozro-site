import type { SearchOptions } from './databaseMappers';
import { defaultSearchOptions, ITEM_TYPE_TO_API } from './databaseMappers';

export type DatabaseTab = 'items' | 'mobs' | 'maps' | 'mvps';

const DATABASE_TABS: DatabaseTab[] = ['items', 'mobs', 'maps', 'mvps'];

export interface DatabaseUrlState {
  tab: DatabaseTab;
  q: string;
  page: number;
  run: boolean;
  options: SearchOptions;
}

function optionsDifferFromDefaults(options: SearchOptions, tab: DatabaseTab): boolean {
  const defaults = defaultSearchOptions();
  if (tab === 'items') {
    if (options.selectedTypes.length > 0) return true;
    if (options.selectedArmorSubtypes.length > 0) return true;
    if (options.selectedCardLocations.length > 0) return true;
    if (options.scriptQuery.trim()) return true;
    if (options.hideItemsWithoutNaturalDrop !== defaults.hideItemsWithoutNaturalDrop) return true;
    return false;
  }
  if (options.selectedElements.length > 0) return true;
  if (options.selectedRaces.length > 0) return true;
  if (options.selectedSizes.length > 0) return true;
  if (options.hideMobsWithoutSpawn !== defaults.hideMobsWithoutSpawn) return true;
  if (options.includeInstanceSpawns !== defaults.includeInstanceSpawns) return true;
  if (options.showBoss !== defaults.showBoss) return true;
  if (options.showNormal !== defaults.showNormal) return true;
  if (options.showMvp !== defaults.showMvp) return true;
  return false;
}

export function hasSearchCriteria(state: DatabaseUrlState): boolean {
  if (state.run) return true;
  return Boolean(state.q.trim()) || optionsDifferFromDefaults(state.options, state.tab);
}

function parseIntList(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => !Number.isNaN(n));
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

  const options = defaultSearchOptions();

  const typeNames = params.get('type');
  if (typeNames) {
    const reverseType: Record<string, number> = {};
    for (const [id, name] of Object.entries(ITEM_TYPE_TO_API)) {
      reverseType[name.toLowerCase()] = Number(id);
    }
    options.selectedTypes = typeNames
      .split(',')
      .map((name) => reverseType[name.trim().toLowerCase()])
      .filter((n) => n !== undefined);
  } else if (params.get('subtype')) {
    options.selectedTypes = [5];
  }

  options.selectedArmorSubtypes = parseCsvList(params.get('subtype'));
  options.selectedCardLocations = parseCsvList(params.get('location'));
  options.scriptQuery = params.get('script') ?? '';

  const naturalDrop = parseBoolParam(params.get('naturalDrop'));
  if (naturalDrop !== undefined) {
    options.hideItemsWithoutNaturalDrop = naturalDrop;
  }

  options.selectedElements = parseIntList(params.get('element'));
  options.selectedRaces = parseIntList(params.get('race'));
  options.selectedSizes = parseIntList(params.get('size'));

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

  return { tab, q, page, run, options };
}

/** Parse /database query string. Supports legacy ?item= / ?mob= via redirect elsewhere. */
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
      params.set(
        'type',
        options.selectedTypes
          .map((id) => ITEM_TYPE_TO_API[id])
          .filter(Boolean)
          .join(',')
      );
    }
    if (options.selectedArmorSubtypes.length > 0) {
      params.set('subtype', options.selectedArmorSubtypes.join(','));
    }
    if (options.selectedCardLocations.length > 0) {
      params.set('location', options.selectedCardLocations.join(','));
    }
    const script = options.scriptQuery.trim();
    if (script) params.set('script', script);
    if (options.hideItemsWithoutNaturalDrop !== defaults.hideItemsWithoutNaturalDrop) {
      params.set('naturalDrop', options.hideItemsWithoutNaturalDrop ? '1' : '0');
    } else if (run) {
      params.set('naturalDrop', options.hideItemsWithoutNaturalDrop ? '1' : '0');
    }
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
  }

  return params;
}