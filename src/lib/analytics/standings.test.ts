import { describe, expect, it } from "vitest";
import type { Lap } from "@/lib/race/types";
import { classOrderAtLap, computeStandings, gapBetween, gapHistory } from "./standings";

/** Builds laps with constant lap time; elapsed = lapTime * lapNumber + offset. */
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

describe("computeStandings", () => {
  it("orders by laps completed, then crossing time; retired cars last", () => {
    const lapsByCar = {
      "1": carLaps("1", 20, 100),
      "2": carLaps("2", 20, 100, 5), // 5s behind
      "3": carLaps("3", 19, 100), // one lap down
      "4": carLaps("4", 21, 100), // most laps, but retired
    };
    const standings = computeStandings(lapsByCar, ["1", "2", "3", "4"], { "4": {} });
    expect(standings.map((s) => s.carNumber)).toEqual(["1", "2", "3", "4"]);
    expect(standings[3].retired).toBe(true);
  });
});

describe("gapBetween", () => {
  it("measures seconds at the last common lap crossing", () => {
    const ahead = carLaps("1", 20, 100);
    const behind = carLaps("2", 20, 100, 8.5);
    const gap = gapBetween(ahead, behind);
    expect(gap.seconds).toBeCloseTo(8.5, 5);
    expect(gap.laps).toBe(0);
  });

  it("reports whole laps when the cars are on different laps", () => {
    const ahead = carLaps("1", 22, 100);
    const behind = carLaps("2", 20, 100, 30);
    const gap = gapBetween(ahead, behind);
    expect(gap.laps).toBe(2);
    expect(gap.seconds).toBeCloseTo(30, 5);
  });
});

describe("gapHistory", () => {
  it("tracks a closing gap lap by lap", () => {
    // Behind car is 1s/lap faster: gap shrinks each lap.
    const ahead = carLaps("1", 10, 101);
    const behind: Lap[] = Array.from({ length: 10 }, (_, i) => ({
      carNumber: "2",
      lapNumber: i + 1,
      lapTimeSeconds: 100,
      flag: "GREEN" as const,
      endedInPit: false,
      pitTimeSeconds: null,
      driverName: null,
      elapsedSeconds: 100 * (i + 1) + 15, // started 15s behind, gains 1s/lap
    }));
    const history = gapHistory(ahead, behind, 5);
    expect(history).toHaveLength(5);
    const gaps = history.map((h) => h.gapSeconds);
    for (let i = 1; i < gaps.length; i += 1) {
      expect(gaps[i]).toBeLessThan(gaps[i - 1]);
    }
  });
});

describe("classOrderAtLap", () => {
  it("orders by elapsed time at the lap crossing and skips cars that have not crossed", () => {
    const lapsByCar = {
      a: carLaps("a", 10, 100),
      b: carLaps("b", 10, 100, -2), // crossed 2s earlier: leads
      c: carLaps("c", 4, 100),
    };
    expect(classOrderAtLap(lapsByCar, ["a", "b", "c"], 8)).toEqual(["b", "a"]);
  });
});
