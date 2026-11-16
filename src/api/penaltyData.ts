export interface LevelPenaltyData {
  schemaVersion: number;
  generatedAt: string;
  source: string[];
  maxLevel: number;
  minDiff: number;
  maxDiff: number;
  penalties: {
    drop: { rates: number[] };
    exp: { rates: number[] };
  };
}

let penaltyPromise: Promise<LevelPenaltyData> | null = null;

export function loadLevelPenalty(): Promise<LevelPenaltyData> {
  if (!penaltyPromise) {
    penaltyPromise = fetch('/assets/farming/levelPenalty.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`No se pudo cargar la penalización (${response.status})`);
        }
        return response.json() as Promise<LevelPenaltyData>;
      })
      .catch((error) => {
        penaltyPromise = null;
        throw error;
      });
  }
  return penaltyPromise;
}

export function penaltyRate(
  data: LevelPenaltyData | null,
  type: 'drop' | 'exp',
  levelDifference: number
): number {
  if (!data) return 100;
  const rates = data.penalties[type]?.rates;
  if (!rates || rates.length === 0) return 100;
  const index = Math.max(0, Math.min(rates.length - 1, levelDifference - data.minDiff));
  return rates[index] ?? 100;
}
