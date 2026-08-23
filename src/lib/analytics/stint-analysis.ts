import type { Lap } from "@/lib/race/types";

/**
 * Stint reconstruction from lap data. A stint ends on a lap that crosses
 * the line in the pit (in-lap); the next lap starts a new stint.
 */

export interface Stint {
  stintNumber: number;
  startLap: number;
  endLap: number;
  lapCount: number;
  /** True for the stint the car is currently on. */
  inProgress: boolean;
  driverName: string | null;
}

export function buildStints(laps: Lap[]): Stint[] {
  if (laps.length === 0) return [];
  const stints: Stint[] = [];
  let startLap = laps[0].lapNumber;
  let stintNumber = 1;
  for (let i = 0; i < laps.length; i += 1) {
    const lap = laps[i];
    if (lap.endedInPit) {
      stints.push({
        stintNumber,
        startLap,
        endLap: lap.lapNumber,
        lapCount: lap.lapNumber - startLap + 1,
        inProgress: false,
        driverName: lap.driverName,
      });
      stintNumber += 1;
      startLap = lap.lapNumber + 1;
    }
  }
  const lastLapNumber = laps[laps.length - 1].lapNumber;
  if (startLap <= lastLapNumber) {
    stints.push({
      stintNumber,
      startLap,
      endLap: lastLapNumber,
      lapCount: lastLapNumber - startLap + 1,
      inProgress: true,
      driverName: laps[laps.length - 1].driverName,
    });
  } else if (stints.length > 0) {
    // Car is currently in the pits / just pitted: current stint has 0 laps so far.
    stints.push({
      stintNumber,
      startLap,
      endLap: lastLapNumber,
      lapCount: 0,
      inProgress: true,
      driverName: laps[laps.length - 1].driverName,
    });
  }
  return stints;
}

export function currentStint(laps: Lap[]): Stint | null {
  const stints = buildStints(laps);
  return stints.length > 0 ? stints[stints.length - 1] : null;
}

export function lastPitLap(laps: Lap[]): number | null {
  for (let i = laps.length - 1; i >= 0; i -= 1) {
    if (laps[i].endedInPit) return laps[i].lapNumber;
  }
  return null;
}

export function pitStopCount(laps: Lap[]): number {
  return laps.reduce((count, lap) => count + (lap.endedInPit ? 1 : 0), 0);
}

/**
 * Typical stint length for a car: median of its completed stints,
 * requiring at least one completed stint. Returns null otherwise.
 */
export function typicalStintLaps(laps: Lap[]): number | null {
  const completed = buildStints(laps).filter((s) => !s.inProgress && s.lapCount >= 5);
  if (completed.length === 0) return null;
  const sorted = completed.map((s) => s.lapCount).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Class-level typical stint length: median of all cars' typical stints.
 * Used as a fallback when a car has no completed stints yet.
 */
export function classTypicalStintLaps(lapsByCar: Record<string, Lap[]>, carNumbers: string[]): number | null {
  const values: number[] = [];
  for (const car of carNumbers) {
    const typical = typicalStintLaps(lapsByCar[car] ?? []);
    if (typical != null) values.push(typical);
  }
  if (values.length === 0) return null;
  const sorted = values.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Estimated total time lost to one pit stop (pit lane transit + stationary),
 * measured from data: median over completed stops of
 * (in-lap + out-lap) - 2 * typical green lap. Falls back to `fallbackSeconds`.
 */
export function estimatePitLossSeconds(
  lapsByCar: Record<string, Lap[]>,
  carNumbers: string[],
  fallbackSeconds = 75,
): number {
  const losses: number[] = [];
  for (const car of carNumbers) {
    const laps = lapsByCar[car] ?? [];
    const greens = laps
      .filter((l) => l.flag === "GREEN" && !l.endedInPit && l.lapTimeSeconds != null)
      .map((l) => l.lapTimeSeconds as number)
      .sort((a, b) => a - b);
    if (greens.length < 5) continue;
    const baseline = greens[Math.floor(greens.length / 2)];
    for (let i = 0; i < laps.length - 1; i += 1) {
      const inLap = laps[i];
      const outLap = laps[i + 1];
      if (!inLap.endedInPit) continue;
      if (inLap.lapTimeSeconds == null || outLap.lapTimeSeconds == null) continue;
      // Only trust green-flag stops; FCY/SC stops distort the measurement.
      if (inLap.flag !== "GREEN" || outLap.flag !== "GREEN") continue;
      const loss = inLap.lapTimeSeconds + outLap.lapTimeSeconds - 2 * baseline;
      if (loss > 20 && loss < 240) losses.push(loss);
    }
  }
  if (losses.length < 3) return fallbackSeconds;
  const sorted = losses.sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
