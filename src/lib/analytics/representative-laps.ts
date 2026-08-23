import type { Lap } from "@/lib/race/types";

/**
 * Representative laps are the laps we trust for pace analysis:
 * green-flag, not in-laps or out-laps, with a valid time that is not
 * wildly slower than the car's own typical pace.
 */

export interface RepresentativeLapOptions {
  /** Laps slower than median * threshold are discarded. Default 1.07. */
  outlierThreshold?: number;
  /** Keep only the last N representative laps (0 = all). */
  window?: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Marks each lap as an out-lap when the previous lap ended in the pits. */
function isOutLap(laps: Lap[], index: number): boolean {
  return index > 0 && laps[index - 1].endedInPit;
}

export function representativeLaps(
  laps: Lap[],
  options: RepresentativeLapOptions = {},
): Lap[] {
  const { outlierThreshold = 1.07, window = 0 } = options;

  const candidates: Lap[] = [];
  for (let i = 0; i < laps.length; i += 1) {
    const lap = laps[i];
    if (lap.lapTimeSeconds == null) continue;
    if (lap.flag !== "GREEN") continue;
    if (lap.endedInPit) continue;
    if (isOutLap(laps, i)) continue;
    if (lap.lapNumber === 1) continue; // standing/rolling start lap
    candidates.push(lap);
  }

  const med = median(candidates.map((l) => l.lapTimeSeconds as number));
  const filtered =
    med == null
      ? candidates
      : candidates.filter((l) => (l.lapTimeSeconds as number) <= med * outlierThreshold);

  if (window > 0 && filtered.length > window) {
    return filtered.slice(filtered.length - window);
  }
  return filtered;
}
