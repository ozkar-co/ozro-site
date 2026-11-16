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
