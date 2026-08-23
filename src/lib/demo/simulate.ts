import type {
  Car,
  Lap,
  RaceControlPeriod,
  RaceData,
  SessionInfo,
  TrackFlag,
} from "@/lib/race/types";
import entryListJson from "./entry-list.json";

/**
 * Deterministic demo race: a simulated 4-hour ELMS race at Spa-Francorchamps
 * using the real 2025 4 Hours of Spa entry list (from the public OpenWEC
 * results endpoint) with synthesized timing.
 *
 * The race is generated once (seeded PRNG, fully deterministic) and queried
 * by race time T, so the whole app can be developed and demonstrated with
 * no live event and no API key.
 */

export const DEMO_RACE_DURATION_SECONDS = 4 * 3600;

interface EntryJson {
  carNumber: string;
  team: string | null;
  vehicle: string | null;
  className: string | null;
  drivers: { slot: number; firstName: string; lastName: string }[];
}

/** Time-based caution windows (seconds of race time). */
const CAUTION_WINDOWS: { flag: "FCY" | "SC"; start: number; end: number; label: string }[] = [
  { flag: "FCY", start: 1900, end: 2220, label: "Debris at Raidillon" },
  { flag: "SC", start: 4800, end: 5640, label: "Incident at Les Combes" },
  { flag: "FCY", start: 9500, end: 9840, label: "Recovery at Pouhon" },
];

/** Class performance model (green-flag base lap in seconds at Spa). */
const CLASS_MODEL: Record<
  string,
  { baseLap: number; stintTarget: number; carSpread: number; driverSpread: number }
> = {
  LMP2: { baseLap: 125.2, stintTarget: 22, carSpread: 1.4, driverSpread: 0.9 },
  "LMP2 Pro/Am": { baseLap: 126.4, stintTarget: 22, carSpread: 1.6, driverSpread: 1.4 },
  LMP3: { baseLap: 135.8, stintTarget: 20, carSpread: 1.5, driverSpread: 1.1 },
  LMGT3: { baseLap: 142.6, stintTarget: 19, carSpread: 1.7, driverSpread: 1.3 },
};

const PIT_STATIONARY_SECONDS = 32;
const PIT_DRIVER_CHANGE_EXTRA = 14;
const PIT_LANE_LOSS = 26;

/* Seeded PRNG (mulberry32) + helpers, so the race is identical every run. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  // Box-Muller
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function cautionAt(seconds: number): "FCY" | "SC" | null {
  for (const window of CAUTION_WINDOWS) {
    if (seconds >= window.start && seconds < window.end) return window.flag;
  }
  return null;
}

interface SimCar {
  car: Car;
  skill: number;
  driverSkills: number[];
  stintTarget: number;
  laps: Lap[];
  cumulative: number;
  stintAge: number;
  stintNumber: number;
  driverIndex: number;
  retiredAtLap: number | null;
  retireReason: string | null;
  finished: boolean;
  /** Post-pit fresh-tyre bonus laps remaining. */
  freshTyreLaps: number;
  missingDataCar: boolean;
}

function buildCars(): Car[] {
  return (entryListJson as EntryJson[]).map((entry) => ({
    carNumber: entry.carNumber,
    team: entry.team ?? "Unknown team",
    vehicle: entry.vehicle,
    className: entry.className ?? "UNKNOWN",
    drivers: entry.drivers,
  }));
}

function generateRace(): RaceData {
  const rand = mulberry32(20250824);
  const cars = buildCars();

  /* Pick two deterministic retirements for event variety. */
  const lmp3Cars = cars.filter((c) => c.className === "LMP3");
  const gt3Cars = cars.filter((c) => c.className === "LMGT3");
  const retirements: Record<string, { atSeconds: number; reason: string }> = {};
  if (lmp3Cars.length >= 3) {
    retirements[lmp3Cars[2].carNumber] = { atSeconds: 7050, reason: "mechanical" };
  }
  if (gt3Cars.length >= 5) {
    retirements[gt3Cars[4].carNumber] = { atSeconds: 4180, reason: "accident damage" };
  }

  const simCars: SimCar[] = cars.map((car, index) => {
    const model = CLASS_MODEL[car.className] ?? CLASS_MODEL.LMGT3;
    const driverCount = Math.max(1, car.drivers.length);
    return {
      car,
      skill: (rand() - 0.5) * 2 * model.carSpread,
      driverSkills: Array.from({ length: driverCount }, () => (rand() - 0.5) * 2 * model.driverSpread),
      stintTarget: model.stintTarget + Math.floor(rand() * 5) - 2,
      laps: [],
      cumulative: 0,
      stintAge: 0,
      stintNumber: 1,
      driverIndex: index % driverCount,
      retiredAtLap: null,
      retireReason: null,
      finished: false,
      freshTyreLaps: 0,
      // One car per race produces occasional missing lap times (tests missing data).
      missingDataCar: index === 27,
    };
  });

  const horizonSeconds = DEMO_RACE_DURATION_SECONDS + 400;

  /* Group by class so safety-car bunching works within each queue. */
  const classNames = [...new Set(cars.map((c) => c.className))];

  for (const className of classNames) {
    const group = simCars.filter((s) => s.car.className === className);
    const model = CLASS_MODEL[className] ?? CLASS_MODEL.LMGT3;

    let anyRunning = true;
    while (anyRunning) {
      anyRunning = false;

      /* Process the class in track order so SC bunching can reference the car ahead. */
      const running = group
        .filter((s) => !s.finished && s.retiredAtLap == null)
        .sort((a, b) => a.cumulative - b.cumulative);

      let aheadNewCumulative: number | null = null;

      for (const sim of running) {
        if (sim.cumulative >= horizonSeconds) {
          sim.finished = true;
          continue;
        }
        anyRunning = true;

        const lapNumber = sim.laps.length + 1;
        const driverSkill = sim.driverSkills[sim.driverIndex] ?? 0;
        const degradation = 0.03 * sim.stintAge;
        const freshBonus = sim.freshTyreLaps > 0 ? -0.35 : 0;
        const noise = gaussian(rand) * 0.45;
        const startPenalty = lapNumber === 1 ? 6 + rand() * 4 : 0;

        let lapTime =
          model.baseLap + sim.skill + driverSkill + degradation + freshBonus + noise + startPenalty;

        const caution = cautionAt(sim.cumulative);
        let flag: TrackFlag = "GREEN";
        if (caution === "FCY") {
          flag = "FCY";
          lapTime = model.baseLap * 1.55 + rand() * 3;
        } else if (caution === "SC") {
          flag = "SC";
          lapTime = model.baseLap * 1.95 + rand() * 2;
        }

        /* Pit decision at the end of this lap. */
        const mustPit = sim.stintAge + 1 >= sim.stintTarget;
        const opportunisticPit =
          caution != null && sim.stintAge + 1 >= Math.floor(sim.stintTarget * 0.55) && rand() < 0.55;
        const lastStint = sim.cumulative + sim.stintTarget * model.baseLap > DEMO_RACE_DURATION_SECONDS + 120;
        const willPit = (mustPit || opportunisticPit) && !(lastStint && sim.stintAge + 1 < sim.stintTarget + 3);

        let endedInPit = false;
        let pitTime: number | null = null;
        let driverForLap = sim.car.drivers[sim.driverIndex] ?? null;

        if (willPit) {
          endedInPit = true;
          const driverChange = rand() < 0.65 && sim.car.drivers.length > 1;
          pitTime = PIT_STATIONARY_SECONDS + (driverChange ? PIT_DRIVER_CHANGE_EXTRA : 0) + rand() * 4;
          lapTime += PIT_LANE_LOSS / 2 + pitTime;
          if (driverChange) {
            sim.driverIndex = (sim.driverIndex + 1) % sim.car.drivers.length;
          }
        }

        let newCumulative = sim.cumulative + lapTime;

        /* Safety-car bunching: close up to the queue at near racing speed. */
        if (caution === "SC" && aheadNewCumulative != null && !endedInPit) {
          const catchLap = model.baseLap * 1.12 + rand();
          const queueTime = aheadNewCumulative + 1.4 + rand() * 0.8;
          newCumulative = Math.max(sim.cumulative + catchLap, queueTime);
          lapTime = newCumulative - sim.cumulative;
        }

        const missingTime = sim.missingDataCar && rand() < 0.02;

        sim.laps.push({
          carNumber: sim.car.carNumber,
          lapNumber,
          lapTimeSeconds: missingTime ? null : Math.round(lapTime * 1000) / 1000,
          flag,
          endedInPit,
          pitTimeSeconds: pitTime != null ? Math.round(pitTime * 10) / 10 : null,
          driverName: driverForLap
            ? `${driverForLap.firstName} ${driverForLap.lastName}`
            : null,
          elapsedSeconds: Math.round(newCumulative * 1000) / 1000,
        });

        sim.cumulative = newCumulative;
        if (!endedInPit && caution !== "SC") aheadNewCumulative = newCumulative;
        else if (caution === "SC" && !endedInPit) aheadNewCumulative = newCumulative;

        if (endedInPit) {
          sim.stintAge = 0;
          sim.stintNumber += 1;
          sim.freshTyreLaps = 3;
        } else {
          sim.stintAge += 1;
          if (sim.freshTyreLaps > 0) sim.freshTyreLaps -= 1;
        }

        /* Out-lap penalty applied to the next lap via a simple flag. */
        if (endedInPit) {
          sim.skill += 0; // no permanent effect
        }

        /* Retirement check. */
        const retirement = retirements[sim.car.carNumber];
        if (retirement && sim.cumulative >= retirement.atSeconds) {
          sim.retiredAtLap = lapNumber;
          sim.retireReason = retirement.reason;
        }
      }
    }
  }

  /* Out-lap slowdown: add pit-exit loss to the lap after each in-lap. */
  for (const sim of simCars) {
    for (let i = 0; i + 1 < sim.laps.length; i += 1) {
      if (!sim.laps[i].endedInPit) continue;
      const outLap = sim.laps[i + 1];
      if (outLap.lapTimeSeconds != null) {
        const extra = PIT_LANE_LOSS / 2;
        outLap.lapTimeSeconds = Math.round((outLap.lapTimeSeconds + extra) * 1000) / 1000;
        // Shift the whole elapsed chain after the out-lap.
        for (let j = i + 1; j < sim.laps.length; j += 1) {
          if (sim.laps[j].elapsedSeconds != null) {
            sim.laps[j].elapsedSeconds =
              Math.round(((sim.laps[j].elapsedSeconds as number) + extra) * 1000) / 1000;
          }
        }
      }
    }
  }

  /* Derive lap-indexed race-control periods from the overall leader's laps. */
  const raceControl: RaceControlPeriod[] = [];
  const leaderSim = simCars.reduce((best, sim) =>
    sim.laps.length > best.laps.length ? sim : best,
  );
  for (const window of CAUTION_WINDOWS) {
    const startLapEntry = leaderSim.laps.find(
      (lap) => (lap.elapsedSeconds ?? 0) >= window.start,
    );
    const endLapEntry = leaderSim.laps.find((lap) => (lap.elapsedSeconds ?? 0) >= window.end);
    if (!startLapEntry) continue;
    raceControl.push({
      flag: window.flag,
      label: window.label,
      startLap: startLapEntry.lapNumber,
      endLap: endLapEntry ? endLapEntry.lapNumber : startLapEntry.lapNumber + 2,
    });
  }

  const session: SessionInfo = {
    id: "demo-spa",
    seriesName: "European Le Mans Series",
    eventName: "4 Hours of Spa-Francorchamps",
    circuit: "Spa-Francorchamps",
    sessionName: "Race",
    sessionType: "Race",
    startTimeUtc: null,
    scheduledDurationSeconds: DEMO_RACE_DURATION_SECONDS,
  };

  const lapsByCar: Record<string, Lap[]> = {};
  const retired: RaceData["retired"] = {};
  for (const sim of simCars) {
    lapsByCar[sim.car.carNumber] = sim.laps;
    if (sim.retiredAtLap != null) {
      retired[sim.car.carNumber] = { lap: sim.retiredAtLap, reason: sim.retireReason };
    }
  }

  return {
    session,
    cars,
    lapsByCar,
    raceControl,
    elapsedSeconds: DEMO_RACE_DURATION_SECONDS,
    retired,
  };
}

/* Generate once per process; deterministic anyway. */
const globalCache = globalThis as unknown as { __betterTelemDemoRace?: RaceData };

export function fullDemoRace(): RaceData {
  if (!globalCache.__betterTelemDemoRace) {
    globalCache.__betterTelemDemoRace = generateRace();
  }
  return globalCache.__betterTelemDemoRace;
}

/** The demo race truncated to race time T: only data visible at that moment. */
export function demoRaceAt(elapsedSeconds: number): RaceData {
  const full = fullDemoRace();
  const t = Math.max(0, Math.min(elapsedSeconds, DEMO_RACE_DURATION_SECONDS + 300));

  const lapsByCar: Record<string, Lap[]> = {};
  for (const [carNumber, laps] of Object.entries(full.lapsByCar)) {
    lapsByCar[carNumber] = laps.filter(
      (lap) => lap.elapsedSeconds != null && lap.elapsedSeconds <= t,
    );
  }

  const retired: RaceData["retired"] = {};
  for (const [carNumber, info] of Object.entries(full.retired)) {
    const visibleLaps = lapsByCar[carNumber] ?? [];
    if (visibleLaps.length >= info.lap) retired[carNumber] = info;
  }

  const leaderLap = Math.max(
    0,
    ...Object.values(lapsByCar).map((laps) => (laps.length > 0 ? laps[laps.length - 1].lapNumber : 0)),
  );
  const raceControl = full.raceControl.filter((p) => p.startLap <= leaderLap);

  return {
    session: full.session,
    cars: full.cars,
    lapsByCar,
    raceControl,
    elapsedSeconds: t,
    retired,
  };
}

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  /** Race time anchor in seconds. */
  t: number;
  stale?: boolean;
}

export function demoScenarios(): DemoScenario[] {
  return [
    { id: "start", label: "Race start", description: "Opening laps, field settling", t: 150 },
    { id: "green", label: "Green running", description: "Clean racing, battles forming", t: 3400 },
    { id: "fcy", label: "FCY", description: "Full Course Yellow with pit reactions", t: 1980 },
    { id: "sc", label: "Safety Car", description: "Field bunched, strategy reset", t: 5000 },
    { id: "pit-cycle", label: "Pit cycle", description: "Green-flag stops distorting positions", t: 2760 },
    { id: "late", label: "Final hour", description: "Last stops, run to the flag", t: 11800 },
    { id: "finish", label: "Finish", description: "Chequered flag approaching", t: 14200 },
    { id: "stale", label: "Stale feed", description: "Timing feed interruption", t: 6600, stale: true },
  ];
}
