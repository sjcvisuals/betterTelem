import { describe, expect, it } from "vitest";
import { estimateLapProgress } from "./track-position";

describe("estimateLapProgress", () => {
  it("computes the lap fraction from time since crossing and pace", () => {
    const progress = estimateLapProgress({
      raceTimeSeconds: 1060,
      lastCrossingSeconds: 1000,
      paceSeconds: 120,
    });
    expect(progress.fraction).toBeCloseTo(0.5, 5);
    expect(progress.overdue).toBe(false);
  });

  it("holds overdue cars just before the line instead of wrapping", () => {
    const progress = estimateLapProgress({
      raceTimeSeconds: 1200,
      lastCrossingSeconds: 1000,
      paceSeconds: 120, // 200s elapsed on a 120s lap: pitting or trouble
    });
    expect(progress.fraction).toBeCloseTo(0.985, 3);
    expect(progress.overdue).toBe(true);
  });

  it("returns null fraction when data is missing or inconsistent", () => {
    expect(
      estimateLapProgress({ raceTimeSeconds: 100, lastCrossingSeconds: null, paceSeconds: 120 })
        .fraction,
    ).toBeNull();
    expect(
      estimateLapProgress({ raceTimeSeconds: 100, lastCrossingSeconds: 50, paceSeconds: null })
        .fraction,
    ).toBeNull();
    expect(
      estimateLapProgress({ raceTimeSeconds: 40, lastCrossingSeconds: 50, paceSeconds: 120 })
        .fraction,
    ).toBeNull();
  });

  it("flags retired and in-pit cars", () => {
    expect(
      estimateLapProgress({
        raceTimeSeconds: 100,
        lastCrossingSeconds: 50,
        paceSeconds: 120,
        retired: true,
      }).retired,
    ).toBe(true);
    expect(
      estimateLapProgress({
        raceTimeSeconds: 100,
        lastCrossingSeconds: 50,
        paceSeconds: 120,
        inPit: true,
      }).inPit,
    ).toBe(true);
  });
});
