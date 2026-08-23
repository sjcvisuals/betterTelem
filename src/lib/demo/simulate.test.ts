import { describe, expect, it } from "vitest";
import { buildSnapshot } from "@/lib/analytics/snapshot";
import { demoRaceAt, demoScenarios, fullDemoRace, DEMO_RACE_DURATION_SECONDS } from "./simulate";

describe("demo race simulation", () => {
  it("is deterministic", () => {
    const a = fullDemoRace();
    const b = fullDemoRace();
    expect(a).toBe(b); // cached
    expect(a.cars.length).toBe(44);
  });

  it("produces a plausible 4-hour ELMS race", () => {
    const race = fullDemoRace();
    // LMP2 leader should complete roughly 85-120 laps in 4 hours at Spa.
    const lapCounts = race.cars.map((c) => {
      const laps = race.lapsByCar[c.carNumber] ?? [];
      return laps.filter((l) => (l.elapsedSeconds ?? Infinity) <= DEMO_RACE_DURATION_SECONDS).length;
    });
    const maxLaps = Math.max(...lapCounts);
    expect(maxLaps).toBeGreaterThan(85);
    expect(maxLaps).toBeLessThan(125);

    // Every classified car makes multiple pit stops.
    for (const car of race.cars) {
      if (car.carNumber in race.retired) continue;
      const stops = (race.lapsByCar[car.carNumber] ?? []).filter((l) => l.endedInPit).length;
      expect(stops).toBeGreaterThanOrEqual(3);
      expect(stops).toBeLessThanOrEqual(10);
    }

    // Race control periods exist (FCY + SC scripted).
    expect(race.raceControl.length).toBeGreaterThanOrEqual(2);
    expect(race.raceControl.some((p) => p.flag === "SC")).toBe(true);
    expect(race.raceControl.some((p) => p.flag === "FCY")).toBe(true);

    // Two scripted retirements.
    expect(Object.keys(race.retired)).toHaveLength(2);
  });

  it("truncates cleanly at a time cut", () => {
    const cut = demoRaceAt(3600);
    for (const laps of Object.values(cut.lapsByCar)) {
      for (const lap of laps) {
        expect(lap.elapsedSeconds).not.toBeNull();
        expect(lap.elapsedSeconds as number).toBeLessThanOrEqual(3600);
      }
    }
    expect(cut.elapsedSeconds).toBe(3600);
  });

  it("elapsed times are strictly increasing per car", () => {
    const race = fullDemoRace();
    for (const laps of Object.values(race.lapsByCar)) {
      for (let i = 1; i < laps.length; i += 1) {
        expect((laps[i].elapsedSeconds as number) > (laps[i - 1].elapsedSeconds as number)).toBe(
          true,
        );
      }
    }
  });
});

describe("snapshot built from the demo race", () => {
  it("mid-race snapshot has coherent standings, battles and events", () => {
    const snapshot = buildSnapshot(demoRaceAt(7200), { dataSource: "DEMO" });

    expect(snapshot.classNames.sort()).toEqual(["LMGT3", "LMP2", "LMP2 Pro/Am", "LMP3"]);
    expect(snapshot.cars).toHaveLength(44);

    // Class positions are 1..N within each class for non-retired cars.
    for (const className of snapshot.classNames) {
      const positions = snapshot.cars
        .filter((c) => c.className === className && !c.retired)
        .map((c) => c.classPosition)
        .sort((a, b) => (a ?? 0) - (b ?? 0));
      positions.forEach((p, i) => expect(p).toBe(i + 1));
    }

    // Each class leader has null gap to leader.
    for (const className of snapshot.classNames) {
      const leader = snapshot.cars.find((c) => c.className === className && c.classPosition === 1);
      expect(leader?.gapToClassLeaderSeconds).toBeNull();
    }

    // Non-leader lead-lap cars have sensible positive gaps.
    const p2 = snapshot.cars.find((c) => c.className === "LMP2" && c.classPosition === 2);
    if (p2 && p2.lapsBehindClassLeader === 0) {
      expect(p2.gapToClassLeaderSeconds).not.toBeNull();
      expect(p2.gapToClassLeaderSeconds as number).toBeGreaterThan(0);
    }

    // Pit stops mean stint data and events exist by half distance.
    expect(snapshot.timeline.some((e) => e.kind === "PIT_STOP")).toBe(true);
    expect(snapshot.timeline.some((e) => e.kind === "SC_START")).toBe(true);
    expect(snapshot.recentEvents.length).toBeGreaterThan(0);

    // Battles are detected and conservative.
    for (const battle of snapshot.battles) {
      expect(battle.gapSeconds).toBeGreaterThanOrEqual(0);
      if (battle.lapsToCatch != null) {
        expect(battle.catchRateSecondsPerLap).not.toBeNull();
        expect(battle.catchRateSecondsPerLap as number).toBeGreaterThan(0);
      }
    }

    // Effective positions exist for at least some cars by half distance.
    const withEstimates = snapshot.cars.filter((c) => c.effectivePosition != null);
    expect(withEstimates.length).toBeGreaterThan(10);

    expect(snapshot.feedStatus).toBe("LIVE");
    expect(snapshot.remainingSeconds).toBeCloseTo(DEMO_RACE_DURATION_SECONDS - 7200, 0);
  });

  it("flag state reflects scripted cautions", () => {
    const scenarios = demoScenarios();
    const sc = scenarios.find((s) => s.id === "sc");
    const snapshot = buildSnapshot(demoRaceAt(sc!.t), { dataSource: "DEMO" });
    expect(["SC", "FCY"]).toContain(snapshot.currentFlag);
  });

  it("stale scenario reports a stale feed", () => {
    const snapshot = buildSnapshot(demoRaceAt(6600), {
      dataSource: "DEMO",
      forceStaleSeconds: 240,
    });
    expect(snapshot.feedStatus).toBe("STALE");
  });

  it("race end reports ENDED with chequered flag", () => {
    const snapshot = buildSnapshot(demoRaceAt(DEMO_RACE_DURATION_SECONDS + 120), {
      dataSource: "DEMO",
    });
    expect(snapshot.feedStatus).toBe("ENDED");
    expect(snapshot.currentFlag).toBe("CHEQUERED");
  });
});
