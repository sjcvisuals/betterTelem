/**
 * Estimated track position: what fraction of the current lap a car has
 * completed. OpenWEC provides no GPS data, so this is a time-based
 * ESTIMATE from the car's last line crossing and its recent pace —
 * accurate to a few seconds of track time, and always labeled as such.
 */

export interface LapProgressInput {
  /** Current race time in seconds. */
  raceTimeSeconds: number;
  /** Race time when the car last crossed the start/finish line. */
  lastCrossingSeconds: number | null;
  /** Expected lap time: recent pace, falling back to last lap. */
  paceSeconds: number | null;
  /** True when the car is stationary in the pits (stint age 0). */
  inPit?: boolean;
  retired?: boolean;
}

export interface LapProgress {
  /** 0 (just crossed the line) .. <1 (about to cross). Null when unknown. */
  fraction: number | null;
  /** True when the car is past its expected crossing (pitting or slow lap). */
  overdue: boolean;
  inPit: boolean;
  retired: boolean;
}

export function estimateLapProgress(input: LapProgressInput): LapProgress {
  const { raceTimeSeconds, lastCrossingSeconds, paceSeconds } = input;
  const retired = input.retired ?? false;
  const inPit = input.inPit ?? false;

  if (retired) return { fraction: null, overdue: false, inPit: false, retired: true };
  if (
    lastCrossingSeconds == null ||
    paceSeconds == null ||
    paceSeconds <= 0 ||
    raceTimeSeconds < lastCrossingSeconds
  ) {
    return { fraction: null, overdue: false, inPit, retired: false };
  }

  const sinceCrossing = raceTimeSeconds - lastCrossingSeconds;
  const raw = sinceCrossing / paceSeconds;
  if (raw >= 1) {
    // Past the expected crossing: hold the dot just before the line rather
    // than inventing a position on the next lap.
    return { fraction: 0.985, overdue: true, inPit, retired: false };
  }
  return { fraction: raw, overdue: false, inPit, retired: false };
}
