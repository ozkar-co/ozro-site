import type { SearchOptions } from './databaseMappers';

export type DatabaseTab = 'items' | 'mobs';

export interface DatabaseUrlState {
  tab: DatabaseTab;
  q: string;
  page: number;
}

export function hasSearchCriteria(q: string, options: SearchOptions): boolean {
  return Boolean(
    q.trim() ||
    options.selectedTypes.length > 0 ||
    options.selectedElements.length > 0 ||
    options.selectedRaces.length > 0 ||
    options.selectedSizes.length > 0
  );
}

/** Parse /database query string. Supports legacy ?item= / ?mob= via redirect elsewhere. */
export function parseDatabaseUrl(search: string): DatabaseUrlState {
  const params = new URLSearchParams(search);
  const tab: DatabaseTab = params.get('tab') === 'mobs' ? 'mobs' : 'items';
  const q = params.get('q') ?? '';
  const pageRaw = parseInt(params.get('page') ?? '1', 10);
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 0 : pageRaw - 1;
  return { tab, q, page };
}

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
  page: number
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('tab', tab);
  const trimmed = q.trim();
  if (trimmed) params.set('q', trimmed);
  if (page > 0) params.set('page', String(page + 1));
  return params;
}
