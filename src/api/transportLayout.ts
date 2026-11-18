export interface TransportDestination {
  name: string;
  map: string;
}

export interface TransportTooltipGroup {
  type: string;
  label: string;
  destinations: TransportDestination[];
}

export interface TransportLayoutNode {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  tooltips: TransportTooltipGroup[];
}

export interface TransportViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransportLayout {
  version: number;
  viewBox: TransportViewBox;
  nodes: TransportLayoutNode[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

let layoutPromise: Promise<TransportLayout> | null = null;

export function loadTransportLayout(): Promise<TransportLayout> {
  if (!layoutPromise) {
    layoutPromise = fetchJson<TransportLayout>(`/assets/world/transport-layout.json?v=${Date.now()}`).catch((error) => {
      layoutPromise = null;
      throw error;
    });
  }
  return layoutPromise;
}
