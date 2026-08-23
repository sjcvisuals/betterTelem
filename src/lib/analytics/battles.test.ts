import { describe, expect, it } from "vitest";
import type { Lap } from "@/lib/race/types";
import { findBattles, gapTrendSlope, isTrendStable } from "./battles";

function carLaps(carNumber: string, laps: number, lapTime: number, offset = 0): Lap[] {
  return Array.from({ length: laps }, (_, i) => ({
    carNumber,
    lapNumber: i + 1,
    lapTimeSeconds: lapTime,
    flag: "GREEN" as const,
    endedInPit: false,
    pitTimeSeconds: null,
    driverName: null,
    elapsedSeconds: lapTime * (i + 1) + offset,
  }));
}

/** Chasing car that gains `rate` seconds per lap on a 100s reference. */
function chasingLaps(carNumber: string, laps: number, startGap: number, rate: number): Lap[] {
  return Array.from({ length: laps }, (_, i) => ({
    carNumber,
    lapNumber: i + 1,
    lapTimeSeconds: 100 - rate,
    flag: "GREEN" as const,
    endedInPit: false,
    pitTimeSeconds: null,
    driverName: null,
    elapsedSeconds: 100 * (i + 1) + startGap - rate * (i + 1),
  }));
}

describe("gapTrendSlope / isTrendStable", () => {
  it("detects a steady closing trend", () => {
    const points = [10, 9.5, 9.0, 8.5, 8.0].map((gap, i) => ({
      lapNumber: i + 1,
      gapSeconds: gap,
    }));
    const slope = gapTrendSlope(points);
    expect(slope).toBeCloseTo(-0.5, 5);
    expect(isTrendStable(points, slope as number)).toBe(true);
  });

  it("rejects a trend created by one anomalous lap", () => {
    const points = [10, 10.1, 9.9, 10, 4].map((gap, i) => ({
      lapNumber: i + 1,
      gapSeconds: gap,
    }));
    const slope = gapTrendSlope(points);
    expect(slope).not.toBeNull();
    expect(isTrendStable(points, slope as number)).toBe(false);
  });

  it("needs a minimum number of laps", () => {
    expect(gapTrendSlope([{ lapNumber: 1, gapSeconds: 5 }])).toBeNull();
  });
});

describe("findBattles", () => {
  it("produces a catch estimate for a stable closing battle", () => {
    const lapsByCar = {
      "43": carLaps("43", 20, 100),
      "25": chasingLaps("25", 20, 12, 0.5), // 12s back, gaining 0.5s/lap
    };
    const battles = findBattles({
      className: "LMP2",
      orderedCarNumbers: ["43", "25"],
      lapsByCar,
      classPositions: { "43": 1, "25": 2 },
    });
    expect(battles).toHaveLength(1);
    const battle = battles[0];
    expect(battle.aheadCar).toBe("43");
    expect(battle.chasingCar).toBe("25");
    expect(battle.catchRateSecondsPerLap).toBeCloseTo(0.5, 1);
    expect(battle.lapsToCatch).not.toBeNull();
    expect(battle.lapsToCatch as number).toBeGreaterThan(0);
    expect(battle.lapsToCatch as number).toBeLessThanOrEqual(6);
  });

  it("does not invent catch estimates for distant cars", () => {
    const lapsByCar = {
      "1": carLaps("1", 20, 100),
      "2": carLaps("2", 20, 100, 120), // 2 minutes back: not a battle
    };
    const battles = findBattles({
      className: "LMP3",
      orderedCarNumbers: ["1", "2"],
      lapsByCar,
      classPositions: { "1": 1, "2": 2 },
    });
    expect(battles).toHaveLength(0);
  });

  it("marks a stable gap without a lapsToCatch estimate", () => {
    const lapsByCar = {
      "1": carLaps("1", 20, 100),
      "2": carLaps("2", 20, 100, 5),
    };
    const battles = findBattles({
      className: "LMGT3",
      orderedCarNumbers: ["1", "2"],
      lapsByCar,
      classPositions: { "1": 1, "2": 2 },
    });
    expect(battles).toHaveLength(1);
    expect(battles[0].lapsToCatch).toBeNull();
  });
});
