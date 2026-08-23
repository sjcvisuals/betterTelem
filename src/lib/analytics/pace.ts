import type { Lap } from "@/lib/race/types";
import { representativeLaps } from "./representative-laps";

/** Default rolling window used across the app. */
export const DEFAULT_PACE_WINDOW = 5;
export const PACE_WINDOWS = [3, 5, 10] as const;

export interface RecentPace {
  /** Average of the last N representative laps, seconds. */
  averageSeconds: number | null;
  /** How many representative laps the average is built on. */
  lapCount: number;
  windowRequested: number;
}

export function recentPace(laps: Lap[], window = DEFAULT_PACE_WINDOW): RecentPace {
  const reps = representativeLaps(laps, { window });
  if (reps.length === 0) {
    return { averageSeconds: null, lapCount: 0, windowRequested: window };
  }
  const total = reps.reduce((sum, lap) => sum + (lap.lapTimeSeconds as number), 0);
  return {
    averageSeconds: total / reps.length,
    lapCount: reps.length,
    windowRequested: window,
  };
}

export function bestLap(laps: Lap[]): number | null {
  let best: number | null = null;
  for (const lap of laps) {
    if (lap.lapTimeSeconds == null) continue;
    if (best == null || lap.lapTimeSeconds < best) best = lap.lapTimeSeconds;
  }
  return best;
}

export function lastLap(laps: Lap[]): number | null {
  for (let i = laps.length - 1; i >= 0; i -= 1) {
    if (laps[i].lapTimeSeconds != null) return laps[i].lapTimeSeconds;
  }
  return null;
}

/**
 * Pace advantage of car B over car A in seconds per lap
 * (positive = B is faster). Requires enough representative laps on both sides.
 */
export function paceAdvantage(
  lapsA: Lap[],
  lapsB: Lap[],
  window = DEFAULT_PACE_WINDOW,
  minLaps = 3,
): number | null {
  const paceA = recentPace(lapsA, window);
  const paceB = recentPace(lapsB, window);
  if (
    paceA.averageSeconds == null ||
    paceB.averageSeconds == null ||
    paceA.lapCount < minLaps ||
    paceB.lapCount < minLaps
  ) {
    return null;
  }
  return paceA.averageSeconds - paceB.averageSeconds;
}
