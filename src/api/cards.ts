export const CARD_ASSETS_BASE = '/assets/cards';

export interface CardPage {
  page: number;
  image: string;
  width: number;
  height: number;
  count: number;
}

export interface CardEntry {
  id: number;
  name: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CardCategory {
  code: string;
  label: string;
  cards: CardEntry[];
}

export interface CardCatalog {
  version: number;
  generatedAt: string;
  total: number;
  cardWidth: number;
  cardHeight: number;
  pages: CardPage[];
  categories: CardCategory[];
  /** Full id → art index (includes cards outside the collector book). */
  byId?: Record<string, CardEntry>;
}

let catalogPromise: Promise<CardCatalog> | null = null;

export function loadCardCatalog(): Promise<CardCatalog> {
  if (!catalogPromise) {
    catalogPromise = fetch(`${CARD_ASSETS_BASE}/catalog.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el catálogo de cartas');
        }
        return response.json() as Promise<CardCatalog>;
      })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  }
  return catalogPromise;
}

export function cardAtlasUrl(image: string): string {
  return `${CARD_ASSETS_BASE}/${image.replace(/^\//, '')}`;
}

export function findCardEntry(
  catalog: CardCatalog,
  itemId: string | number
): { entry: CardEntry; page: CardPage } | null {
  const id = Number(itemId);
  if (!Number.isFinite(id)) return null;

  const fromIndex = catalog.byId?.[String(id)];
  const entry = fromIndex
    ?? catalog.categories.flatMap((category) => category.cards).find((card) => card.id === id)
    ?? null;
  if (!entry) return null;

  const page = catalog.pages.find((p) => p.page === entry.page);
  if (!page) return null;
  return { entry, page };
}

export function catalogHasCard(catalog: CardCatalog, itemId: string | number): boolean {
  return findCardEntry(catalog, itemId) != null;
}
