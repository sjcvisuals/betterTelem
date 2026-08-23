import type {
  BattlePair,
  Car,
  Lap,
  RaceControlPeriod,
  RaceData,
  RaceEvent,
} from "@/lib/race/types";
import { formatGap } from "@/lib/race/format";
import { classOrderAtLap, elapsedAtLap } from "./standings";

/**
 * The "What just happened?" engine. Scans race history and produces
 * human-readable event cards, each labeled FACT / TREND / ESTIMATE:
 * - FACT: directly observed in timing data (pit stop, flag period, lead change)
 * - TREND: derived from several laps of data (car catching another)
 * - ESTIMATE: a projection that may not happen (pit-cycle outcomes)
 */

interface EventBuildContext {
  data: RaceData;
  carsByNumber: Record<string, Car>;
  classCarNumbers: Record<string, string[]>;
}

function ordinal(position: number): string {
  return `P${position}`;
}

function carLabel(context: EventBuildContext, carNumber: string): string {
  return `#${carNumber}`;
}

function teamOf(context: EventBuildContext, carNumber: string): string {
  return context.carsByNumber[carNumber]?.team ?? "";
}

function classOf(context: EventBuildContext, carNumber: string): string | null {
  return context.carsByNumber[carNumber]?.className ?? null;
}

/** Leader's elapsed time when completing `lap` — used to timestamp lap-indexed events. */
function lapToSeconds(context: EventBuildContext, lap: number): number {
  let best: number | null = null;
  for (const laps of Object.values(context.data.lapsByCar)) {
    const elapsed = elapsedAtLap(laps, lap);
    if (elapsed != null && (best == null || elapsed < best)) best = elapsed;
  }
  return best ?? 0;
}

function buildPitStopEvents(context: EventBuildContext): RaceEvent[] {
  const events: RaceEvent[] = [];
  const { data, classCarNumbers } = context;

  for (const [carNumber, laps] of Object.entries(data.lapsByCar)) {
    const className = classOf(context, carNumber);
    const classCars = className ? (classCarNumbers[className] ?? []) : [];

    for (let i = 0; i < laps.length; i += 1) {
      const lap = laps[i];
      if (!lap.endedInPit || lap.elapsedSeconds == null) continue;

      const orderBefore = classOrderAtLap(data.lapsByCar, classCars, Math.max(1, lap.lapNumber - 1));
      const positionBefore = orderBefore.indexOf(carNumber) + 1;
      const orderAfter = classOrderAtLap(data.lapsByCar, classCars, lap.lapNumber + 1);
      const positionAfter = orderAfter.indexOf(carNumber) + 1;

      const fromText = positionBefore > 0 ? ` from ${ordinal(positionBefore)} in ${className}` : "";
      const rejoinText =
        positionAfter > 0 && positionAfter !== positionBefore
          ? ` It rejoined ${ordinal(positionAfter)} but is now on a newer stint than the cars ahead.`
          : "";

      events.push({
        id: `pit-${carNumber}-${lap.lapNumber}`,
        kind: "PIT_STOP",
        category: "FACT",
        atSeconds: lap.elapsedSeconds,
        lap: lap.lapNumber,
        carNumbers: [carNumber],
        className,
        title: `${carLabel(context, carNumber)} pitted${fromText}`,
        detail:
          `${teamOf(context, carNumber)} came in at the end of lap ${lap.lapNumber}` +
          `${lap.flag === "FCY" || lap.flag === "SC" ? " during a caution period, when less time is lost to the field" : ""}.` +
          rejoinText,
      });

      // Driver change detection: different driver on the out-lap.
      const next = laps[i + 1];
      if (next && next.driverName && lap.driverName && next.driverName !== lap.driverName) {
        events.push({
          id: `driver-${carNumber}-${next.lapNumber}`,
          kind: "DRIVER_CHANGE",
          category: "FACT",
          atSeconds: next.elapsedSeconds ?? lap.elapsedSeconds,
          lap: next.lapNumber,
          carNumbers: [carNumber],
          className,
          title: `${carLabel(context, carNumber)} driver change: ${next.driverName} in`,
          detail: `${lap.driverName} handed over to ${next.driverName}. In endurance racing every driver must complete a minimum drive time.`,
        });
      }
    }
  }
  return events;
}

function buildClassLeadChangeEvents(context: EventBuildContext): RaceEvent[] {
  const events: RaceEvent[] = [];
  const { data, classCarNumbers } = context;

  for (const [className, carNumbers] of Object.entries(classCarNumbers)) {
    let maxLap = 0;
    for (const car of carNumbers) {
      const laps = data.lapsByCar[car] ?? [];
      if (laps.length > 0) maxLap = Math.max(maxLap, laps[laps.length - 1].lapNumber);
    }
    let previousLeader: string | null = null;
    for (let lap = 1; lap <= maxLap; lap += 1) {
      const order = classOrderAtLap(data.lapsByCar, carNumbers, lap);
      const leader = order[0] ?? null;
      if (leader && previousLeader && leader !== previousLeader) {
        const previousLaps = data.lapsByCar[previousLeader] ?? [];
        const pittedRecently = previousLaps.some(
          (l) => l.endedInPit && l.lapNumber >= lap - 1 && l.lapNumber <= lap,
        );
        events.push({
          id: `classlead-${className}-${lap}`,
          kind: "CLASS_LEAD_CHANGE",
          category: "FACT",
          atSeconds: lapToSeconds(context, lap),
          lap,
          carNumbers: [leader, previousLeader],
          className,
          title: `${carLabel(context, leader)} leads ${className}`,
          detail: pittedRecently
            ? `${carLabel(context, previousLeader)} pitted, handing the ${className} lead to ${carLabel(context, leader)} (${teamOf(context, leader)}). ${carLabel(context, previousLeader)} has banked its stop, so this may reverse when ${carLabel(context, leader)} pits.`
            : `${carLabel(context, leader)} (${teamOf(context, leader)}) took the ${className} lead from ${carLabel(context, previousLeader)} on track.`,
        });
      }
      if (leader) previousLeader = leader;
    }
  }
  return events;
}

function buildPositionSwingEvents(context: EventBuildContext): RaceEvent[] {
  const events: RaceEvent[] = [];
  const { data, classCarNumbers } = context;
  const SWING = 3;

  for (const [className, carNumbers] of Object.entries(classCarNumbers)) {
    let maxLap = 0;
    for (const car of carNumbers) {
      const laps = data.lapsByCar[car] ?? [];
      if (laps.length > 0) maxLap = Math.max(maxLap, laps[laps.length - 1].lapNumber);
    }
    for (let lap = 3; lap <= maxLap; lap += 1) {
      const before = classOrderAtLap(data.lapsByCar, carNumbers, lap - 1);
      const after = classOrderAtLap(data.lapsByCar, carNumbers, lap);
      for (const carNumber of carNumbers) {
        const positionBefore = before.indexOf(carNumber) + 1;
        const positionAfter = after.indexOf(carNumber) + 1;
        if (positionBefore <= 0 || positionAfter <= 0) continue;
        const gained = positionBefore - positionAfter;
        if (gained < SWING) continue;
        const laps = data.lapsByCar[carNumber] ?? [];
        const hasPittedRecently = laps.some(
          (l) => l.endedInPit && l.lapNumber >= lap - 2 && l.lapNumber <= lap,
        );
        // Count how many cars that were ahead pitted on this lap.
        const pittedAhead = before
          .slice(0, positionBefore - 1)
          .filter((other) =>
            (data.lapsByCar[other] ?? []).some((l) => l.endedInPit && l.lapNumber === lap - 1),
          ).length;
        events.push({
          id: `swing-${carNumber}-${lap}`,
          kind: "POSITION_SWING",
          category: "FACT",
          atSeconds: lapToSeconds(context, lap),
          lap,
          carNumbers: [carNumber],
          className,
          title: `${carLabel(context, carNumber)} up to ${ordinal(positionAfter)} in ${className} (from ${ordinal(positionBefore)})`,
          detail:
            pittedAhead > 0
              ? `${pittedAhead} car${pittedAhead > 1 ? "s" : ""} ahead entered the pits. ${hasPittedRecently ? "" : `${carLabel(context, carNumber)} has not yet made its own expected stop, so this position is partly on borrowed time.`}`
              : `${carLabel(context, carNumber)} gained ${gained} places in ${className} on lap ${lap}.`,
        });
      }
    }
  }
  return events;
}

function buildRaceControlEvents(context: EventBuildContext): RaceEvent[] {
  const events: RaceEvent[] = [];
  for (const period of context.data.raceControl) {
    const startSeconds = lapToSeconds(context, period.startLap);
    const endSeconds = lapToSeconds(context, period.endLap + 1);
    const isFcy = period.flag === "FCY";
    const isSc = period.flag === "SC";
    const startKind = isFcy ? "FCY_START" : isSc ? "SC_START" : "RED_FLAG";
    const label = isFcy ? "Full Course Yellow" : isSc ? "Safety Car" : period.flag;

    events.push({
      id: `${startKind}-${period.startLap}`,
      kind: startKind,
      category: "FACT",
      atSeconds: startSeconds,
      lap: period.startLap,
      carNumbers: [],
      className: null,
      title: `${label.toUpperCase()}${period.label && period.label !== period.flag ? ` — ${period.label}` : ""}`,
      detail: isFcy
        ? "The whole field must slow to a fixed speed limit. Gaps in seconds are frozen — and a pit stop costs less time relative to the field, so expect cars to pit now."
        : isSc
          ? "The field bunches up behind the safety car. Gaps built over hours can disappear, and pit stops cost less relative to the field."
          : "The session is suspended.",
    });

    // Only add the green-flag event if the period has actually ended.
    const leaderLatest = Math.max(
      0,
      ...Object.values(context.data.lapsByCar).map((laps) =>
        laps.length > 0 ? laps[laps.length - 1].lapNumber : 0,
      ),
    );
    if (period.endLap < leaderLatest) {
      events.push({
        id: `green-${period.endLap}`,
        kind: "GREEN_FLAG",
        category: "FACT",
        atSeconds: endSeconds,
        lap: period.endLap + 1,
        carNumbers: [],
        className: null,
        title: "GREEN FLAG — racing resumes",
        detail: `The ${label.toLowerCase()} period lasted ${period.endLap - period.startLap + 1} laps. Watch for cars on fresher tyres attacking immediately.`,
      });
    }
  }
  return events;
}

function buildRetirementEvents(context: EventBuildContext): RaceEvent[] {
  const events: RaceEvent[] = [];
  for (const [carNumber, info] of Object.entries(context.data.retired)) {
    events.push({
      id: `retire-${carNumber}`,
      kind: "RETIREMENT",
      category: "FACT",
      atSeconds: lapToSeconds(context, info.lap),
      lap: info.lap,
      carNumbers: [carNumber],
      className: classOf(context, carNumber),
      title: `${carLabel(context, carNumber)} retired`,
      detail: `${teamOf(context, carNumber)} is out of the race${info.reason ? ` (${info.reason})` : ""}.`,
    });
  }
  return events;
}

function buildRaceStartEvent(context: EventBuildContext): RaceEvent[] {
  const anyLap = Object.values(context.data.lapsByCar).some((laps) => laps.length > 0);
  if (!anyLap) return [];
  return [
    {
      id: "race-start",
      kind: "RACE_START",
      category: "FACT",
      atSeconds: 0,
      lap: 1,
      carNumbers: [],
      className: null,
      title: "RACE START",
      detail: `${context.data.session.eventName} is underway.`,
    },
  ];
}

/** TREND cards from current battles — only well-supported catches. */
export function buildBattleEvents(
  battles: BattlePair[],
  nowSeconds: number,
): RaceEvent[] {
  const events: RaceEvent[] = [];
  for (const battle of battles) {
    if (
      battle.previousGapSeconds == null ||
      battle.gapLapsAgo == null ||
      battle.catchRateSecondsPerLap == null ||
      battle.catchRateSecondsPerLap < 0.15
    ) {
      continue;
    }
    const gained = battle.previousGapSeconds - battle.gapSeconds;
    if (gained < 1.5) continue;
    events.push({
      id: `battle-${battle.chasingCar}-${battle.aheadCar}-${Math.round(battle.gapSeconds * 10)}`,
      kind: "BATTLE",
      category: "TREND",
      atSeconds: nowSeconds,
      lap: null,
      carNumbers: [battle.chasingCar, battle.aheadCar],
      className: battle.className,
      title: `#${battle.chasingCar} is hunting down #${battle.aheadCar}`,
      detail: `The gap has come down from ${formatGap(battle.previousGapSeconds)} to ${formatGap(battle.gapSeconds)} over the last ${battle.gapLapsAgo} laps${battle.lapsToCatch != null ? `. At this rate they meet in ~${battle.lapsToCatch} laps` : ""}.`,
    });
  }
  return events;
}

export function buildRaceEvents(data: RaceData, cars: Car[]): RaceEvent[] {
  const carsByNumber: Record<string, Car> = {};
  const classCarNumbers: Record<string, string[]> = {};
  for (const car of cars) {
    carsByNumber[car.carNumber] = car;
    (classCarNumbers[car.className] ??= []).push(car.carNumber);
  }
  const context: EventBuildContext = { data, carsByNumber, classCarNumbers };

  const events = [
    ...buildRaceStartEvent(context),
    ...buildPitStopEvents(context),
    ...buildClassLeadChangeEvents(context),
    ...buildPositionSwingEvents(context),
    ...buildRaceControlEvents(context),
    ...buildRetirementEvents(context),
  ];
  events.sort((a, b) => a.atSeconds - b.atSeconds);
  return events;
}
