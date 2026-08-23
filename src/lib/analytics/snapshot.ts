import type {
  LiveCarState,
  RaceData,
  RaceSnapshot,
  StrategyCarView,
  TrackFlag,
} from "@/lib/race/types";
import { buildBattleEvents, buildRaceEvents } from "./explanations";
import { findBattles, trendFromCatchRate } from "./battles";
import { computeEffectivePositions } from "./effective-position";
import { bestLap, lastLap, recentPace, DEFAULT_PACE_WINDOW } from "./pace";
import { owesStop, pitStatusFor } from "./pit-window";
import { representativeLaps } from "./representative-laps";
import {
  computeStandings,
  gapBetween,
  gapHistory,
} from "./standings";
import {
  classTypicalStintLaps,
  currentStint,
  estimatePitLossSeconds,
  lastPitLap,
  pitStopCount,
} from "./stint-analysis";

/**
 * Builds the full derived RaceSnapshot from normalized RaceData.
 * This is the single computation path shared by demo and live modes.
 */

export interface SnapshotOptions {
  dataSource: "DEMO" | "LIVE";
  nowMs?: number;
  /** Force the feed to appear stale (demo scenario). */
  forceStaleSeconds?: number | null;
}

const STALE_AFTER_SECONDS = 180;

function currentFlagFrom(data: RaceData, leaderLap: number | null): TrackFlag {
  if (leaderLap == null) return "UNKNOWN";
  for (const period of data.raceControl) {
    if (leaderLap >= period.startLap && leaderLap <= period.endLap) return period.flag;
  }
  // Fall back to the most recent lap flags seen across the field.
  let latestElapsed = -1;
  let latestFlag: TrackFlag = "GREEN";
  for (const laps of Object.values(data.lapsByCar)) {
    const last = laps[laps.length - 1];
    if (last?.elapsedSeconds != null && last.elapsedSeconds > latestElapsed) {
      latestElapsed = last.elapsedSeconds;
      latestFlag = last.flag === "UNKNOWN" ? "GREEN" : last.flag;
    }
  }
  return latestFlag;
}

export function buildSnapshot(data: RaceData, options: SnapshotOptions): RaceSnapshot {
  const nowMs = options.nowMs ?? Date.now();
  const carNumbers = data.cars.map((c) => c.carNumber);

  /* Overall standings */
  const overall = computeStandings(data.lapsByCar, carNumbers, data.retired);
  const overallPositions: Record<string, number> = {};
  overall.forEach((entry, index) => {
    overallPositions[entry.carNumber] = index + 1;
  });

  /* Class standings */
  const classNames = [...new Set(data.cars.map((c) => c.className))];
  const classOrder: Record<string, string[]> = {};
  const classPositions: Record<string, number> = {};
  for (const className of classNames) {
    const classCars = data.cars.filter((c) => c.className === className).map((c) => c.carNumber);
    const standings = computeStandings(data.lapsByCar, classCars, data.retired);
    classOrder[className] = standings.map((s) => s.carNumber);
    standings.forEach((entry, index) => {
      classPositions[entry.carNumber] = index + 1;
    });
  }

  const leaderLap = overall.length > 0 ? overall[0].lapsCompleted : null;
  const currentFlag = currentFlagFrom(data, leaderLap);

  const remainingSeconds =
    data.session.scheduledDurationSeconds != null
      ? Math.max(0, data.session.scheduledDurationSeconds - data.elapsedSeconds)
      : null;

  /* Per-class shared analytics inputs */
  const classTypical: Record<string, number | null> = {};
  const classPitLoss: Record<string, number> = {};
  const classMedianStops: Record<string, number> = {};
  for (const className of classNames) {
    const cars = classOrder[className];
    classTypical[className] = classTypicalStintLaps(data.lapsByCar, cars);
    classPitLoss[className] = estimatePitLossSeconds(data.lapsByCar, cars);
    const stops = cars
      .map((car) => pitStopCount(data.lapsByCar[car] ?? []))
      .sort((a, b) => a - b);
    classMedianStops[className] =
      stops.length === 0 ? 0 : stops[Math.floor(stops.length / 2)];
  }

  /* Effective positions per class */
  const effectiveByCar: Record<string, ReturnType<typeof computeEffectivePositions>[string]> = {};
  for (const className of classNames) {
    const active = classOrder[className].filter((car) => !(car in data.retired));
    const estimates = computeEffectivePositions({
      orderedCarNumbers: active,
      lapsByCar: data.lapsByCar,
      classTypicalStint: classTypical[className],
      pitLossSeconds: classPitLoss[className],
      remainingSeconds,
    });
    Object.assign(effectiveByCar, estimates);
  }

  /* Per-car states */
  const carStates: LiveCarState[] = data.cars.map((car) => {
    const laps = data.lapsByCar[car.carNumber] ?? [];
    const className = car.className;
    const order = classOrder[className];
    const classPosition = classPositions[car.carNumber] ?? null;

    const classLeaderNumber = order[0];
    const gapToLeader =
      classLeaderNumber && classLeaderNumber !== car.carNumber
        ? gapBetween(data.lapsByCar[classLeaderNumber] ?? [], laps)
        : { seconds: null, laps: 0 };

    const aheadIndex = classPosition != null ? classPosition - 2 : -1;
    const aheadNumber = aheadIndex >= 0 ? order[aheadIndex] : null;
    const gapToAhead = aheadNumber
      ? gapBetween(data.lapsByCar[aheadNumber] ?? [], laps)
      : { seconds: null, laps: 0 };

    /* Trend vs the car ahead */
    let catchRate: number | null = null;
    if (aheadNumber) {
      const history = gapHistory(data.lapsByCar[aheadNumber] ?? [], laps, 6);
      if (history.length >= 4) {
        const first = history[0].gapSeconds;
        const last = history[history.length - 1].gapSeconds;
        catchRate = (first - last) / (history.length - 1);
      }
    }

    const stint = currentStint(laps);
    const pit = pitStatusFor({
      laps,
      classTypicalStint: classTypical[className],
    });
    const stops = pitStopCount(laps);
    const carOwesStop = owesStop(stops, classMedianStops[className], pit.lapsUntilExpectedStop);

    const pace = recentPace(laps, DEFAULT_PACE_WINDOW);
    const reps = representativeLaps(laps);
    const lastLapEntry = laps[laps.length - 1];
    const retired = car.carNumber in data.retired;

    let strategyLabel: string | null = pit.label;
    if (!retired && carOwesStop && pit.status !== "PIT_WINDOW_SOON" && pit.status !== "JUST_PITTED") {
      strategyLabel = "Still owes a stop";
    }

    return {
      carNumber: car.carNumber,
      team: car.team,
      vehicle: car.vehicle,
      className,
      drivers: car.drivers,
      currentDriver: lastLapEntry?.driverName ?? null,

      overallPosition: overallPositions[car.carNumber] ?? null,
      classPosition,
      lapsCompleted: laps.length > 0 ? laps[laps.length - 1].lapNumber : 0,
      retired,

      gapToClassLeaderSeconds: gapToLeader.laps > 0 ? null : gapToLeader.seconds,
      lapsBehindClassLeader: gapToLeader.laps,
      gapToAheadInClassSeconds: gapToAhead.laps > 0 ? null : gapToAhead.seconds,
      lapsBehindAheadInClass: gapToAhead.laps,

      lastLapSeconds: lastLap(laps),
      bestLapSeconds: bestLap(laps),
      recentPaceSeconds: pace.averageSeconds,
      representativeLapCount: reps.length,

      gapTrend: trendFromCatchRate(catchRate),
      catchRateSecondsPerLap: catchRate,

      stintLapCount: stint?.lapCount ?? null,
      stintNumber: stint?.stintNumber ?? 1,
      lastPitLap: lastPitLap(laps),
      pitStopCount: stops,
      pitStatus: retired ? "NORMAL" : carOwesStop && pit.status === "NORMAL" ? "OWES_STOP" : pit.status,
      strategyLabel: retired ? "Retired" : strategyLabel,

      effectivePosition: retired ? null : (effectiveByCar[car.carNumber] ?? null),
    };
  });

  /* Order car states by overall position for stable rendering */
  carStates.sort(
    (a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999),
  );

  /* Battles per class */
  const battles = classNames.flatMap((className) =>
    findBattles({
      className,
      orderedCarNumbers: classOrder[className].filter((car) => !(car in data.retired)),
      lapsByCar: data.lapsByCar,
      classPositions,
    }),
  );

  /* Strategy views per class */
  const strategyByClass: Record<string, StrategyCarView[]> = {};
  for (const className of classNames) {
    strategyByClass[className] = classOrder[className]
      .filter((car) => !(car in data.retired))
      .map((carNumber) => {
        const state = carStates.find((c) => c.carNumber === carNumber);
        const typical = classTypical[className];
        return {
          carNumber,
          classPosition: state?.classPosition ?? null,
          stintLapCount: state?.stintLapCount ?? null,
          typicalStintLaps: typical,
          lastPitLap: state?.lastPitLap ?? null,
          pitStopCount: state?.pitStopCount ?? 0,
          pitStatus: state?.pitStatus ?? "NORMAL",
          owesStop: state?.pitStatus === "OWES_STOP" || state?.strategyLabel === "Still owes a stop",
          stintProgress:
            state?.stintLapCount != null && typical != null && typical > 0
              ? state.stintLapCount / typical
              : null,
          projectedClassPosition: state?.effectivePosition?.position ?? null,
        };
      });
  }

  /* Events */
  const timeline = buildRaceEvents(data, data.cars);
  const battleEvents = buildBattleEvents(battles.slice(0, 6), data.elapsedSeconds);
  const allEvents = [...timeline, ...battleEvents].sort((a, b) => a.atSeconds - b.atSeconds);
  const recentEvents = [...allEvents]
    .filter((e) => data.elapsedSeconds - e.atSeconds < 1200)
    .reverse()
    .slice(0, 12);

  /* Feed status */
  let latestDataSeconds = 0;
  for (const laps of Object.values(data.lapsByCar)) {
    const last = laps[laps.length - 1];
    if (last?.elapsedSeconds != null) {
      latestDataSeconds = Math.max(latestDataSeconds, last.elapsedSeconds);
    }
  }
  let secondsSinceLastData: number | null =
    latestDataSeconds > 0 ? Math.max(0, data.elapsedSeconds - latestDataSeconds) : null;
  if (options.forceStaleSeconds != null) {
    secondsSinceLastData = options.forceStaleSeconds;
  }

  const raceOver = remainingSeconds != null && remainingSeconds <= 0;
  const feedStatus = raceOver
    ? "ENDED"
    : secondsSinceLastData != null && secondsSinceLastData > STALE_AFTER_SECONDS
      ? "STALE"
      : "LIVE";

  return {
    session: data.session,
    dataSource: options.dataSource,
    generatedAtMs: nowMs,
    elapsedSeconds: data.elapsedSeconds,
    remainingSeconds,
    currentFlag: raceOver ? "CHEQUERED" : currentFlag,
    leaderLap,
    feedStatus,
    secondsSinceLastData,
    classNames: classNames.sort(),
    cars: carStates,
    battles,
    strategyByClass,
    recentEvents,
    timeline: allEvents,
  };
}
