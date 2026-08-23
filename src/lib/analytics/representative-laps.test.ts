import { describe, expect, it } from "vitest";
import type { Lap, TrackFlag } from "@/lib/race/types";
import { representativeLaps } from "./representative-laps";
import { recentPace, paceAdvantage } from "./pace";

function lap(
  lapNumber: number,
  lapTimeSeconds: number | null,
  overrides: Partial<Lap> = {},
): Lap {
  return {
    carNumber: "1",
    lapNumber,
    lapTimeSeconds,
    flag: "GREEN" as TrackFlag,
    endedInPit: false,
    pitTimeSeconds: null,
    driverName: "A Driver",
    elapsedSeconds: null,
    ...overrides,
  };
}

describe("representativeLaps", () => {
  it("excludes lap 1, pit in-laps, out-laps, cautions and missing times", () => {
    const laps: Lap[] = [
      lap(1, 100), // race start lap: excluded
      lap(2, 100),
      lap(3, 101),
      lap(4, 160, { endedInPit: true }), // in-lap: excluded
      lap(5, 130), // out-lap: excluded
      lap(6, 100.5),
      lap(7, 250, { flag: "SC" }), // caution: excluded
      lap(8, 155, { flag: "FCY" }), // caution: excluded
      lap(9, null), // missing time: excluded
      lap(10, 99.8),
    ];
    const reps = representativeLaps(laps);
    expect(reps.map((l) => l.lapNumber)).toEqual([2, 3, 6, 10]);
  });

  it("filters slow outliers relative to the median", () => {
    const laps: Lap[] = [
      lap(2, 100),
      lap(3, 100.2),
      lap(4, 100.4),
      lap(5, 99.9),
      lap(6, 118), // > median * 1.07: excluded
    ];
    const reps = representativeLaps(laps);
    expect(reps.map((l) => l.lapNumber)).toEqual([2, 3, 4, 5]);
  });

  it("applies a rolling window from the most recent laps", () => {
    const laps: Lap[] = [lap(2, 100), lap(3, 101), lap(4, 100), lap(5, 102), lap(6, 100)];
    const reps = representativeLaps(laps, { window: 3 });
    expect(reps.map((l) => l.lapNumber)).toEqual([4, 5, 6]);
  });

  it("returns empty for no usable laps", () => {
    expect(representativeLaps([lap(1, 100), lap(2, null)])).toEqual([]);
  });
});

describe("recentPace", () => {
  it("averages the last N representative laps", () => {
    const laps: Lap[] = [lap(2, 100), lap(3, 104), lap(4, 100), lap(5, 102), lap(6, 101)];
    const pace = recentPace(laps, 3);
    expect(pace.lapCount).toBe(3);
    expect(pace.averageSeconds).toBeCloseTo((100 + 102 + 101) / 3, 5);
  });

  it("returns null when there is no usable data", () => {
    const pace = recentPace([lap(1, 100)]);
    expect(pace.averageSeconds).toBeNull();
    expect(pace.lapCount).toBe(0);
  });
});

describe("paceAdvantage", () => {
  it("is positive when the second car is faster", () => {
    const slower = [lap(2, 101), lap(3, 101), lap(4, 101), lap(5, 101)];
    const faster = [lap(2, 100), lap(3, 100), lap(4, 100), lap(5, 100)];
    expect(paceAdvantage(slower, faster)).toBeCloseTo(1, 5);
  });

  it("requires a minimum sample on both sides", () => {
    const a = [lap(2, 101), lap(3, 101), lap(4, 101)];
    const b = [lap(2, 100)];
    expect(paceAdvantage(a, b)).toBeNull();
  });
});
