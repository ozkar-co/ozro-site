export interface TransportDestination {
  name: string;
  map: string;
}

export interface TransportTooltipGroup {
  type: string;
  label: string;
  destinations: TransportDestination[];
}

export interface TransportNode {
  id: string;
  name: string;
  kind: string;
  region: string;
  shape?: 'double';
  shapeLabels?: string[];
}

export interface TransportStop {
  station: string;
  map: string;
}

export interface TransportLine {
  id: string;
  type: 'kafra' | 'airship';
  name?: string;
  group?: string;
  bidirectional?: boolean;
  loop?: boolean;
  from?: string;
  to?: string;
  stops?: TransportStop[];
}

export interface TransportGraph {
  schemaVersion: number;
  kind: string;
  notes: string[];
  nodes: TransportNode[];
  lines: TransportLine[];
  tooltips: Record<string, TransportTooltipGroup[]>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

let transportPromise: Promise<TransportGraph> | null = null;

export function loadTransport(): Promise<TransportGraph> {
  if (!transportPromise) {
    transportPromise = fetchJson<TransportGraph>('/assets/world/transport.json').catch((error) => {
      transportPromise = null;
      throw error;
    });
  }
  return transportPromise;
}
