import type { Lap, PitStatus } from "@/lib/race/types";
import { currentStint, typicalStintLaps } from "./stint-analysis";

/**
 * Plain-language pit status for a car, derived only from observable data
 * (stint age vs the car's / class's typical stint length).
 */

export interface PitStatusInput {
  laps: Lap[];
  /** Fallback typical stint when the car has no completed stints. */
  classTypicalStint: number | null;
}

export interface PitStatusResult {
  status: PitStatus;
  /** Human label, e.g. "Pit expected within ~3 laps". */
  label: string | null;
  stintLapCount: number | null;
  typicalStintLaps: number | null;
  /** Estimated laps until the expected stop (negative = overdue). */
  lapsUntilExpectedStop: number | null;
}

export function pitStatusFor(input: PitStatusInput): PitStatusResult {
  const { laps } = input;
  const stint = currentStint(laps);
  if (!stint) {
    return {
      status: "NORMAL",
      label: null,
      stintLapCount: null,
      typicalStintLaps: null,
      lapsUntilExpectedStop: null,
    };
  }

  const ownTypical = typicalStintLaps(laps);
  const typical = ownTypical ?? input.classTypicalStint;
  const age = stint.lapCount;

  if (age <= 2 && stint.stintNumber > 1) {
    return {
      status: "JUST_PITTED",
      label: "Just pitted",
      stintLapCount: age,
      typicalStintLaps: typical,
      lapsUntilExpectedStop: typical != null ? typical - age : null,
    };
  }

  if (typical == null) {
    return {
      status: "NORMAL",
      label: null,
      stintLapCount: age,
      typicalStintLaps: null,
      lapsUntilExpectedStop: null,
    };
  }

  const lapsUntil = typical - age;

  if (lapsUntil < -2) {
    return {
      status: "LONG_STINT",
      label: `Long stint — ${Math.abs(lapsUntil)} laps past usual stop`,
      stintLapCount: age,
      typicalStintLaps: typical,
      lapsUntilExpectedStop: lapsUntil,
    };
  }
  if (lapsUntil <= 3) {
    return {
      status: "PIT_WINDOW_SOON",
      label:
        lapsUntil <= 0
          ? "Pit expected any lap"
          : `Pit expected within ~${lapsUntil} laps`,
      stintLapCount: age,
      typicalStintLaps: typical,
      lapsUntilExpectedStop: lapsUntil,
    };
  }
  return {
    status: "NORMAL",
    label: null,
    stintLapCount: age,
    typicalStintLaps: typical,
    lapsUntilExpectedStop: lapsUntil,
  };
}

/**
 * A car "owes a stop" relative to the field when it has made fewer pit
 * stops than the median of its class and its stint is older than typical.
 */
export function owesStop(
  ownPitStops: number,
  classMedianPitStops: number,
  lapsUntilExpectedStop: number | null,
): boolean {
  if (ownPitStops < classMedianPitStops) return true;
  return lapsUntilExpectedStop != null && lapsUntilExpectedStop < -1;
}
