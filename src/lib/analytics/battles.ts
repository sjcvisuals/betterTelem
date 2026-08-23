import type { BattlePair, Lap } from "@/lib/race/types";
import { paceAdvantage } from "./pace";
import { gapHistory } from "./standings";

/**
 * Battle detection: pairs of cars in the same class, close on track,
 * with an optional "time to catch" estimate.
 *
 * Estimates are deliberately conservative:
 * - catch rate needs >= MIN_TREND_LAPS common laps of gap history
 * - the trend must be reasonably consistent (not one anomalous lap)
 * - lapsToCatch is only produced for meaningful closing rates
 */

const MAX_BATTLE_GAP_SECONDS = 45;
const MIN_TREND_LAPS = 4;
const TREND_WINDOW = 6;
const MIN_CATCH_RATE = 0.15; // s/lap
const STABLE_BAND = 0.1; // |rate| below this = "stable"

export interface BattleInput {
  className: string;
  /** Class order, leader first — only cars on the class lead lap battle for position. */
  orderedCarNumbers: string[];
  lapsByCar: Record<string, Lap[]>;
  classPositions: Record<string, number>;
}

/** Least-squares slope of gap vs lap: negative = chasing car closing. */
export function gapTrendSlope(points: { lapNumber: number; gapSeconds: number }[]): number | null {
  if (points.length < MIN_TREND_LAPS) return null;
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.lapNumber, 0) / n;
  const meanY = points.reduce((s, p) => s + p.gapSeconds, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.lapNumber - meanX) * (p.gapSeconds - meanY);
    den += (p.lapNumber - meanX) ** 2;
  }
  if (den === 0) return null;
  return num / den;
}

/**
 * Trend consistency check: the slope should explain most of the movement.
 * Guards against a single anomalous lap creating a fake "catching" signal.
 */
export function isTrendStable(
  points: { lapNumber: number; gapSeconds: number }[],
  slope: number,
): boolean {
  if (points.length < MIN_TREND_LAPS) return false;
  const meanY = points.reduce((s, p) => s + p.gapSeconds, 0) / points.length;
  const meanX = points.reduce((s, p) => s + p.lapNumber, 0) / points.length;
  let residualSS = 0;
  let totalSS = 0;
  for (const p of points) {
    const predicted = meanY + slope * (p.lapNumber - meanX);
    residualSS += (p.gapSeconds - predicted) ** 2;
    totalSS += (p.gapSeconds - meanY) ** 2;
  }
  if (totalSS < 0.25) return true; // essentially flat gap: stable by definition
  if (residualSS / totalSS >= 0.5) return false;

  // Directional consistency: most lap-to-lap steps must move with the slope.
  // Guards against one anomalous lap manufacturing a fake trend.
  if (Math.abs(slope) > STABLE_BAND) {
    let withSlope = 0;
    let steps = 0;
    for (let i = 1; i < points.length; i += 1) {
      const step = points[i].gapSeconds - points[i - 1].gapSeconds;
      if (Math.abs(step) < 0.05) continue; // ignore noise-level steps
      steps += 1;
      if (Math.sign(step) === Math.sign(slope)) withSlope += 1;
    }
    if (steps > 0 && withSlope / steps < 0.7) return false;
  }
  return true;
}

export function findBattles(input: BattleInput): BattlePair[] {
  const { orderedCarNumbers, lapsByCar, classPositions, className } = input;
  const battles: BattlePair[] = [];

  for (let i = 0; i < orderedCarNumbers.length - 1; i += 1) {
    const ahead = orderedCarNumbers[i];
    const chasing = orderedCarNumbers[i + 1];
    const aheadLaps = lapsByCar[ahead] ?? [];
    const chasingLaps = lapsByCar[chasing] ?? [];

    const history = gapHistory(aheadLaps, chasingLaps, TREND_WINDOW);
    if (history.length === 0) continue;
    const currentGap = history[history.length - 1].gapSeconds;
    if (currentGap < 0 || currentGap > MAX_BATTLE_GAP_SECONDS) continue;

    const slope = gapTrendSlope(history);
    const stable = slope != null && isTrendStable(history, slope);
    // Positive catchRate = chasing car gaining.
    const catchRate = slope != null && stable ? -slope : null;

    let lapsToCatch: number | null = null;
    if (catchRate != null && catchRate >= MIN_CATCH_RATE && currentGap > 0.5) {
      lapsToCatch = Math.ceil(currentGap / catchRate);
      if (lapsToCatch > 60) lapsToCatch = null; // too far out to be meaningful
    }

    // Corroborate with pace: if gap trend is unavailable, fall back to pace delta.
    const pace = paceAdvantage(aheadLaps, chasingLaps);

    battles.push({
      className,
      aheadCar: ahead,
      chasingCar: chasing,
      gapSeconds: currentGap,
      gapLapsAgo: history.length >= 2 ? history.length - 1 : null,
      previousGapSeconds: history.length >= 2 ? history[0].gapSeconds : null,
      catchRateSecondsPerLap: catchRate ?? (pace != null && Math.abs(pace) >= MIN_CATCH_RATE ? pace : null),
      lapsToCatch,
      aheadClassPosition: classPositions[ahead] ?? i + 1,
      chasingClassPosition: classPositions[chasing] ?? i + 2,
    });
  }

  // Most interesting battles first: closing fast and close together.
  battles.sort((a, b) => battleScore(b) - battleScore(a));
  return battles;
}

function battleScore(battle: BattlePair): number {
  const closeness = Math.max(0, 1 - battle.gapSeconds / MAX_BATTLE_GAP_SECONDS);
  const closing = battle.catchRateSecondsPerLap != null && battle.catchRateSecondsPerLap > 0
    ? Math.min(1, battle.catchRateSecondsPerLap)
    : 0;
  const front = 1 / battle.aheadClassPosition;
  return closeness * 2 + closing * 3 + front;
}

export function trendFromCatchRate(rate: number | null): "CATCHING" | "STABLE" | "LOSING" | null {
  if (rate == null) return null;
  if (rate > STABLE_BAND) return "CATCHING";
  if (rate < -STABLE_BAND) return "LOSING";
  return "STABLE";
}
