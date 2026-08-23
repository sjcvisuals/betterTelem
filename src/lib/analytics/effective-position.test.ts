import { describe, expect, it } from "vitest";
import type { Lap } from "@/lib/race/types";
import { computeEffectivePositions } from "./effective-position";

/**
 * Builds a car's laps with a given lap time and pit stops at specific laps.
 * Pit laps cost `pitLoss` extra seconds. Elapsed is fully consistent.
 */
function carLaps(
  carNumber: string,
  totalLaps: number,
  lapTime: number,
  pitLaps: number[],
  pitLoss = 75,
  startOffset = 0,
): Lap[] {
  const laps: Lap[] = [];
  let elapsed = startOffset;
  for (let n = 1; n <= totalLaps; n += 1) {
    const isPit = pitLaps.includes(n);
    const time = lapTime + (isPit ? pitLoss : 0);
    elapsed += time;
    laps.push({
      carNumber,
      lapNumber: n,
      lapTimeSeconds: time,
      flag: "GREEN",
      endedInPit: isPit,
      pitTimeSeconds: isPit ? 30 : null,
      driverName: null,
      elapsedSeconds: elapsed,
    });
  }
  return laps;
}

describe("computeEffectivePositions", () => {
  it("promotes a car that has banked its stop over one that still owes it", () => {
    // Both cars pit every ~15 laps. Car A (track leader) has NOT made its
    // 2nd stop yet (stint age 14, due any lap). Car B has made both stops
    // (2 x 75s lost vs A's 1 x 75s) and trails by 25s on track — less than
    // one pit loss. With ~11 laps left, B reaches the flag on its fuel while
    // A still owes one stop, so B is effectively ahead.
    const lapsByCar = {
      A: carLaps("A", 29, 100, [15]),
      B: carLaps("B", 29, 100, [15, 27], 75, -50),
    };
    const estimates = computeEffectivePositions({
      orderedCarNumbers: ["A", "B"],
      lapsByCar,
      classTypicalStint: 15,
      pitLossSeconds: 75,
      remainingSeconds: 1100, // ~11 laps left: A owes one more stop than B
    });
    expect(estimates.B?.position).toBe(1);
    expect(estimates.A?.position).toBe(2);
    expect(estimates.B?.differsFromCurrent).toBe(true);
  });

  it("keeps the order when both cars owe the same stops", () => {
    const lapsByCar = {
      A: carLaps("A", 20, 100, [15]),
      B: carLaps("B", 20, 100, [15], 75, 10),
    };
    const estimates = computeEffectivePositions({
      orderedCarNumbers: ["A", "B"],
      lapsByCar,
      classTypicalStint: 15,
      pitLossSeconds: 75,
      remainingSeconds: 2000,
    });
    expect(estimates.A?.position).toBe(1);
    expect(estimates.B?.position).toBe(2);
    expect(estimates.A?.differsFromCurrent).toBe(false);
  });

  it("returns null estimates when no stints have completed (early race)", () => {
    const lapsByCar = {
      A: carLaps("A", 5, 100, []),
      B: carLaps("B", 5, 100, [], 75, 10),
    };
    const estimates = computeEffectivePositions({
      orderedCarNumbers: ["A", "B"],
      lapsByCar,
      classTypicalStint: null,
      pitLossSeconds: 75,
      remainingSeconds: 12000,
    });
    expect(estimates.A).toBeNull();
    expect(estimates.B).toBeNull();
  });

  it("returns null estimates when the race is effectively over", () => {
    const lapsByCar = {
      A: carLaps("A", 20, 100, [15]),
      B: carLaps("B", 20, 100, [15], 75, 10),
    };
    const estimates = computeEffectivePositions({
      orderedCarNumbers: ["A", "B"],
      lapsByCar,
      classTypicalStint: 15,
      pitLossSeconds: 75,
      remainingSeconds: 120, // ~1 lap left
    });
    expect(estimates.A).toBeNull();
    expect(estimates.B).toBeNull();
  });
});
