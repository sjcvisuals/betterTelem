import type { EffectivePositionEstimate, Lap } from "@/lib/race/types";
import { recentPace } from "./pace";
import { gapBetween } from "./standings";
import { currentStint, pitStopCount, typicalStintLaps } from "./stint-analysis";

/**
 * Effective Position: an ESTIMATE of where each car in a class will run
 * once every car has made the pit stops it still owes.
 *
 * Method (deliberately conservative, documented in the README):
 * 1. Estimate remaining race laps from time remaining / class pace.
 * 2. For each car, estimate remaining stops:
 *      fuelLapsLeft = typicalStint - currentStintAge
 *      stopsLeft    = ceil((remainingLaps - fuelLapsLeft) / typicalStint), min 0
 * 3. Adjusted deficit to class leader = current gap + (stopsLeft_car - stopsLeft_leader) * pitLoss.
 *    Cars a lap down get lapsBehind * typical lap time added.
 * 4. Sort by adjusted deficit.
 *
 * Confidence is LOW until the class has completed pit cycles to learn from
 * (>= 1 completed stint per car on average), MEDIUM afterwards.
 * Returns null estimates when there is not enough data (early race).
 */

export interface EffectivePositionInput {
  /** Class order, leader first (current, non-retired cars). */
  orderedCarNumbers: string[];
  lapsByCar: Record<string, Lap[]>;
  classTypicalStint: number | null;
  pitLossSeconds: number;
  remainingSeconds: number | null;
}

export function computeEffectivePositions(
  input: EffectivePositionInput,
): Record<string, EffectivePositionEstimate | null> {
  const { orderedCarNumbers, lapsByCar, classTypicalStint, pitLossSeconds, remainingSeconds } = input;
  const empty: Record<string, EffectivePositionEstimate | null> = {};
  for (const car of orderedCarNumbers) empty[car] = null;

  if (orderedCarNumbers.length === 0 || remainingSeconds == null || remainingSeconds <= 0) {
    return empty;
  }

  const leader = orderedCarNumbers[0];
  const leaderLaps = lapsByCar[leader] ?? [];
  const leaderPace = recentPace(leaderLaps, 10);
  if (leaderPace.averageSeconds == null || leaderPace.lapCount < 3) return empty;
  const lapSeconds = leaderPace.averageSeconds;
  const remainingLaps = remainingSeconds / lapSeconds;

  // Not worth estimating in the final laps — stops no longer fit.
  if (remainingLaps < 3) return empty;

  const stintBasis = classTypicalStint;
  if (stintBasis == null) return empty; // no completed stints anywhere yet

  let completedStintSamples = 0;

  interface CarProjection {
    carNumber: string;
    adjustedDeficit: number;
    stopsLeft: number;
  }
  const projections: CarProjection[] = [];

  for (const carNumber of orderedCarNumbers) {
    const laps = lapsByCar[carNumber] ?? [];
    const stint = currentStint(laps);
    const ownTypical = typicalStintLaps(laps);
    if (ownTypical != null) completedStintSamples += 1;
    const typical = ownTypical ?? stintBasis;
    const stintAge = stint?.lapCount ?? 0;

    const fuelLapsLeft = Math.max(0, typical - stintAge);
    const stopsLeft = Math.max(0, Math.ceil((remainingLaps - fuelLapsLeft) / typical));

    const gap = gapBetween(lapsByCar[leader] ?? [], laps);
    const gapSeconds = (gap.seconds ?? 0) + gap.laps * lapSeconds;

    projections.push({ carNumber, adjustedDeficit: gapSeconds, stopsLeft });
  }

  const leaderStops = projections[0]?.stopsLeft ?? 0;
  for (const projection of projections) {
    projection.adjustedDeficit += (projection.stopsLeft - leaderStops) * pitLossSeconds;
  }

  const sorted = [...projections].sort((a, b) => a.adjustedDeficit - b.adjustedDeficit);
  const confidence: EffectivePositionEstimate["confidence"] =
    completedStintSamples >= Math.ceil(orderedCarNumbers.length / 2) ? "MEDIUM" : "LOW";

  const result: Record<string, EffectivePositionEstimate | null> = {};
  const currentPositions: Record<string, number> = {};
  orderedCarNumbers.forEach((car, index) => {
    currentPositions[car] = index + 1;
  });

  sorted.forEach((projection, index) => {
    const position = index + 1;
    const current = currentPositions[projection.carNumber];
    const stopsDiff = projection.stopsLeft - leaderStops;
    result[projection.carNumber] = {
      position,
      differsFromCurrent: position !== current,
      confidence,
      reason:
        projection.stopsLeft === 0
          ? "No further stops expected"
          : stopsDiff > 0
            ? `Owes ${stopsDiff} more stop${stopsDiff > 1 ? "s" : ""} than the class leader`
            : `~${projection.stopsLeft} stop${projection.stopsLeft > 1 ? "s" : ""} remaining, same as or fewer than the leader`,
    };
  });
  return result;
}
