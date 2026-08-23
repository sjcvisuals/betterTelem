import type { LiveCarState, RaceData, RaceEvent, RaceSnapshot } from "@/lib/race/types";
import { formatGap, formatRate } from "@/lib/race/format";
import { recentPace } from "./pace";
import { classOrderAtLap, elapsedAtLap } from "./standings";
import { buildStints } from "./stint-analysis";

/** Chart-oriented detail payload for /car/[carNumber]. */

export interface CarLapPoint {
  lapNumber: number;
  lapTimeSeconds: number | null;
  flag: string;
  endedInPit: boolean;
  driverName: string | null;
}

export interface CarGapPoint {
  lapNumber: number;
  gapSeconds: number;
}

export interface CarPositionPoint {
  lapNumber: number;
  classPosition: number;
}

export interface CarStintView {
  stintNumber: number;
  startLap: number;
  endLap: number;
  lapCount: number;
  driverName: string | null;
  averagePaceSeconds: number | null;
  inProgress: boolean;
}

export interface CarDetail {
  carNumber: string;
  lapChart: CarLapPoint[];
  gapToClassLeader: CarGapPoint[];
  positionHistory: CarPositionPoint[];
  stints: CarStintView[];
  events: RaceEvent[];
  summary: string;
}

export function buildCarDetail(
  data: RaceData,
  snapshot: RaceSnapshot,
  carNumber: string,
): CarDetail | null {
  const car = data.cars.find((c) => c.carNumber === carNumber);
  if (!car) return null;
  const laps = data.lapsByCar[carNumber] ?? [];
  const state = snapshot.cars.find((c) => c.carNumber === carNumber) ?? null;

  const classCars = data.cars
    .filter((c) => c.className === car.className)
    .map((c) => c.carNumber);

  /* Current class leader used as the gap reference. */
  const leaderNumber =
    snapshot.cars.find((c) => c.className === car.className && c.classPosition === 1)
      ?.carNumber ?? null;
  const leaderLaps = leaderNumber ? (data.lapsByCar[leaderNumber] ?? []) : [];

  const lapChart: CarLapPoint[] = laps.map((lap) => ({
    lapNumber: lap.lapNumber,
    lapTimeSeconds: lap.lapTimeSeconds,
    flag: lap.flag,
    endedInPit: lap.endedInPit,
    driverName: lap.driverName,
  }));

  const gapToClassLeader: CarGapPoint[] = [];
  const positionHistory: CarPositionPoint[] = [];
  const lastLapNumber = laps.length > 0 ? laps[laps.length - 1].lapNumber : 0;
  for (let lap = 1; lap <= lastLapNumber; lap += 1) {
    const own = elapsedAtLap(laps, lap);
    const leader = leaderNumber && leaderNumber !== carNumber ? elapsedAtLap(leaderLaps, lap) : own;
    if (own != null && leader != null) {
      gapToClassLeader.push({
        lapNumber: lap,
        gapSeconds: Math.max(0, Math.round((own - leader) * 100) / 100),
      });
    }
    const order = classOrderAtLap(data.lapsByCar, classCars, lap);
    const position = order.indexOf(carNumber) + 1;
    if (position > 0) positionHistory.push({ lapNumber: lap, classPosition: position });
  }

  const stints: CarStintView[] = buildStints(laps).map((stint) => {
    const stintLaps = laps.filter(
      (l) =>
        l.lapNumber >= stint.startLap &&
        l.lapNumber <= stint.endLap &&
        !l.endedInPit &&
        l.flag === "GREEN" &&
        l.lapTimeSeconds != null,
    );
    // Skip the out-lap for the average.
    const usable = stintLaps.filter((l) => l.lapNumber > stint.startLap);
    const average =
      usable.length >= 2
        ? usable.reduce((s, l) => s + (l.lapTimeSeconds as number), 0) / usable.length
        : null;
    return {
      stintNumber: stint.stintNumber,
      startLap: stint.startLap,
      endLap: stint.endLap,
      lapCount: stint.lapCount,
      driverName: stint.driverName,
      averagePaceSeconds: average != null ? Math.round(average * 1000) / 1000 : null,
      inProgress: stint.inProgress,
    };
  });

  const events = snapshot.timeline.filter((e) => e.carNumbers.includes(carNumber));

  return {
    carNumber,
    lapChart,
    gapToClassLeader,
    positionHistory,
    stints,
    events,
    summary: buildSummary(data, snapshot, state, carNumber),
  };
}

function buildSummary(
  data: RaceData,
  snapshot: RaceSnapshot,
  state: LiveCarState | null,
  carNumber: string,
): string {
  if (!state) return `#${carNumber} is not in this session.`;
  if (state.retired) {
    return `#${carNumber} (${state.team}) has retired from the race.`;
  }
  const parts: string[] = [];
  parts.push(
    `#${carNumber} is currently P${state.classPosition ?? "?"} in ${state.className}.`,
  );

  if (state.classPosition === 1) {
    parts.push(`It leads the class after ${state.lapsCompleted} laps.`);
  } else if (state.gapToAheadInClassSeconds != null) {
    parts.push(
      `It is ${formatGap(state.gapToAheadInClassSeconds)} behind the car ahead in class.`,
    );
  } else if (state.lapsBehindAheadInClass > 0) {
    parts.push(
      `It is ${state.lapsBehindAheadInClass} lap${state.lapsBehindAheadInClass > 1 ? "s" : ""} behind the car ahead in class.`,
    );
  }

  /* Pace vs the car ahead over recent representative laps. */
  const aheadState = snapshot.cars.find(
    (c) => c.className === state.className && c.classPosition === (state.classPosition ?? 0) - 1,
  );
  if (aheadState) {
    const ownPace = recentPace(data.lapsByCar[carNumber] ?? []);
    const aheadPace = recentPace(data.lapsByCar[aheadState.carNumber] ?? []);
    if (
      ownPace.averageSeconds != null &&
      aheadPace.averageSeconds != null &&
      ownPace.lapCount >= 3 &&
      aheadPace.lapCount >= 3
    ) {
      const delta = aheadPace.averageSeconds - ownPace.averageSeconds;
      if (Math.abs(delta) >= 0.15) {
        parts.push(
          `It has been approximately ${formatRate(delta)} ${delta > 0 ? "faster" : "slower"} than #${aheadState.carNumber} over the last ${ownPace.lapCount} representative laps.`,
        );
      }
    }
    if (state.stintLapCount != null && aheadState.stintLapCount != null) {
      const diff = state.stintLapCount - aheadState.stintLapCount;
      if (Math.abs(diff) >= 3) {
        parts.push(
          `Its current stint is ${Math.abs(diff)} laps ${diff > 0 ? "older" : "newer"} than the car ahead.`,
        );
      }
    }
  }

  if (state.effectivePosition?.differsFromCurrent) {
    parts.push(
      `After the pit cycle it projects to roughly P${state.effectivePosition.position} in class (estimate).`,
    );
  }
  return parts.join(" ");
}
