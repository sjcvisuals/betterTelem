import type { Lap } from "@/lib/race/types";

/**
 * Position and gap calculations from cumulative lap-crossing times.
 * Order: most laps completed first; ties broken by earliest crossing time.
 */

export interface StandingEntry {
  carNumber: string;
  lapsCompleted: number;
  /** Elapsed race time at the car's latest lap crossing. */
  lastCrossingSeconds: number | null;
  retired: boolean;
}

export function computeStandings(
  lapsByCar: Record<string, Lap[]>,
  carNumbers: string[],
  retired: Record<string, unknown>,
): StandingEntry[] {
  const entries: StandingEntry[] = carNumbers.map((carNumber) => {
    const laps = lapsByCar[carNumber] ?? [];
    const last = laps.length > 0 ? laps[laps.length - 1] : null;
    return {
      carNumber,
      lapsCompleted: last?.lapNumber ?? 0,
      lastCrossingSeconds: last?.elapsedSeconds ?? null,
      retired: carNumber in retired,
    };
  });

  entries.sort((a, b) => {
    if (a.retired !== b.retired) return a.retired ? 1 : -1;
    if (a.lapsCompleted !== b.lapsCompleted) return b.lapsCompleted - a.lapsCompleted;
    const timeA = a.lastCrossingSeconds ?? Number.POSITIVE_INFINITY;
    const timeB = b.lastCrossingSeconds ?? Number.POSITIVE_INFINITY;
    return timeA - timeB;
  });
  return entries;
}

export interface GapResult {
  /** Seconds behind, when both cars are on the same lap. */
  seconds: number | null;
  /** Whole laps behind (0 when on the same lap). */
  laps: number;
}

/** Elapsed time when `carLaps`'s car completed lap `lapNumber`, or null. */
export function elapsedAtLap(carLaps: Lap[], lapNumber: number): number | null {
  // Laps are ordered; direct index is usually correct but not guaranteed.
  const direct = carLaps[lapNumber - 1];
  if (direct?.lapNumber === lapNumber) return direct.elapsedSeconds;
  const found = carLaps.find((l) => l.lapNumber === lapNumber);
  return found?.elapsedSeconds ?? null;
}

/**
 * Gap from `behind` to `ahead` (positive seconds = behind is later).
 * Measured at the last lap both cars completed — the standard timing
 * convention for interval columns.
 */
export function gapBetween(aheadLaps: Lap[], behindLaps: Lap[]): GapResult {
  const aheadCount = aheadLaps.length > 0 ? aheadLaps[aheadLaps.length - 1].lapNumber : 0;
  const behindCount = behindLaps.length > 0 ? behindLaps[behindLaps.length - 1].lapNumber : 0;
  if (aheadCount === 0 || behindCount === 0) return { seconds: null, laps: 0 };

  const lapsBehind = Math.max(0, aheadCount - behindCount);
  const commonLap = Math.min(aheadCount, behindCount);
  const aheadElapsed = elapsedAtLap(aheadLaps, commonLap);
  const behindElapsed = elapsedAtLap(behindLaps, commonLap);
  if (aheadElapsed == null || behindElapsed == null) {
    return { seconds: null, laps: lapsBehind };
  }
  return { seconds: behindElapsed - aheadElapsed, laps: lapsBehind };
}

/**
 * Gap history between two cars over their last `window` common laps:
 * gap measured at each common lap crossing, oldest first.
 */
export function gapHistory(
  aheadLaps: Lap[],
  behindLaps: Lap[],
  window: number,
): { lapNumber: number; gapSeconds: number }[] {
  const aheadCount = aheadLaps.length > 0 ? aheadLaps[aheadLaps.length - 1].lapNumber : 0;
  const behindCount = behindLaps.length > 0 ? behindLaps[behindLaps.length - 1].lapNumber : 0;
  const commonLap = Math.min(aheadCount, behindCount);
  const points: { lapNumber: number; gapSeconds: number }[] = [];
  for (let lap = Math.max(2, commonLap - window + 1); lap <= commonLap; lap += 1) {
    const aheadElapsed = elapsedAtLap(aheadLaps, lap);
    const behindElapsed = elapsedAtLap(behindLaps, lap);
    if (aheadElapsed == null || behindElapsed == null) continue;
    points.push({ lapNumber: lap, gapSeconds: behindElapsed - aheadElapsed });
  }
  return points;
}

/**
 * Class order (car numbers, leader first) at the moment lap `lapNumber`
 * was completed. Cars that never completed the lap are excluded.
 * Used for lead-change and position-swing detection.
 */
export function classOrderAtLap(
  lapsByCar: Record<string, Lap[]>,
  carNumbers: string[],
  lapNumber: number,
): string[] {
  const crossed: { carNumber: string; elapsed: number }[] = [];
  for (const carNumber of carNumbers) {
    const elapsed = elapsedAtLap(lapsByCar[carNumber] ?? [], lapNumber);
    if (elapsed != null) crossed.push({ carNumber, elapsed });
  }
  crossed.sort((a, b) => a.elapsed - b.elapsed);
  return crossed.map((c) => c.carNumber);
}
