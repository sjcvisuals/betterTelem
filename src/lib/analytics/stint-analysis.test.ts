import { describe, expect, it } from "vitest";
import type { Lap } from "@/lib/race/types";
import {
  buildStints,
  currentStint,
  lastPitLap,
  pitStopCount,
  typicalStintLaps,
} from "./stint-analysis";

function lap(lapNumber: number, endedInPit = false): Lap {
  return {
    carNumber: "7",
    lapNumber,
    lapTimeSeconds: 100,
    flag: "GREEN",
    endedInPit,
    pitTimeSeconds: endedInPit ? 30 : null,
    driverName: endedInPit ? "Out Going" : "Current Driver",
    elapsedSeconds: lapNumber * 100,
  };
}

function race(totalLaps: number, pitLaps: number[]): Lap[] {
  return Array.from({ length: totalLaps }, (_, i) => lap(i + 1, pitLaps.includes(i + 1)));
}

describe("buildStints", () => {
  it("splits stints at pit in-laps", () => {
    const stints = buildStints(race(30, [10, 22]));
    expect(stints).toHaveLength(3);
    expect(stints[0]).toMatchObject({ startLap: 1, endLap: 10, lapCount: 10, inProgress: false });
    expect(stints[1]).toMatchObject({ startLap: 11, endLap: 22, lapCount: 12, inProgress: false });
    expect(stints[2]).toMatchObject({ startLap: 23, endLap: 30, lapCount: 8, inProgress: true });
  });

  it("handles a car that just pitted on its latest lap", () => {
    const stints = buildStints(race(10, [10]));
    expect(stints).toHaveLength(2);
    expect(stints[1]).toMatchObject({ lapCount: 0, inProgress: true });
  });

  it("returns empty for no laps", () => {
    expect(buildStints([])).toEqual([]);
  });
});

describe("stint helpers", () => {
  const laps = race(50, [12, 25, 38]);

  it("currentStint reports the in-progress stint", () => {
    expect(currentStint(laps)).toMatchObject({ stintNumber: 4, lapCount: 12, inProgress: true });
  });

  it("lastPitLap and pitStopCount", () => {
    expect(lastPitLap(laps)).toBe(38);
    expect(pitStopCount(laps)).toBe(3);
    expect(lastPitLap(race(5, []))).toBeNull();
  });

  it("typicalStintLaps is the median completed stint", () => {
    // Completed stints: 12, 13, 13 laps -> median 13
    expect(typicalStintLaps(laps)).toBe(13);
    expect(typicalStintLaps(race(5, []))).toBeNull();
  });
});
