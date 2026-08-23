/**
 * Internal domain types. Everything downstream of the normalization layer
 * (analytics, snapshot building, UI) works exclusively with these types,
 * never with raw OpenWEC responses.
 */

export type TrackFlag =
  | "GREEN"
  | "YELLOW"
  | "FCY"
  | "SC"
  | "RED"
  | "CHEQUERED"
  | "UNKNOWN";

export interface Driver {
  slot: number;
  firstName: string;
  lastName: string;
}

export interface Car {
  carNumber: string;
  team: string;
  vehicle: string | null;
  className: string;
  drivers: Driver[];
}

export interface Lap {
  carNumber: string;
  lapNumber: number;
  lapTimeSeconds: number | null;
  flag: TrackFlag;
  /** Lap ended in the pit lane (pit in-lap). */
  endedInPit: boolean;
  pitTimeSeconds: number | null;
  driverName: string | null;
  /** Cumulative race time at the moment this lap was completed. */
  elapsedSeconds: number | null;
}

export interface RaceControlPeriod {
  flag: Exclude<TrackFlag, "GREEN" | "UNKNOWN">;
  label: string;
  startLap: number;
  endLap: number;
}

export interface SessionInfo {
  id: string;
  seriesName: string;
  eventName: string;
  circuit: string;
  sessionName: string;
  sessionType: string;
  startTimeUtc: string | null;
  /** Scheduled length in seconds (ELMS races are 4 hours). Null if unknown. */
  scheduledDurationSeconds: number | null;
}

/** Everything the analytics engine needs about one race, up to "now". */
export interface RaceData {
  session: SessionInfo;
  cars: Car[];
  /** Laps per car, ordered by lapNumber ascending. Only completed laps. */
  lapsByCar: Record<string, Lap[]>;
  raceControl: RaceControlPeriod[];
  /** Race time elapsed, in seconds, at the moment of this data cut. */
  elapsedSeconds: number;
  /** Cars that have retired (status from timing where known). */
  retired: Record<string, { lap: number; reason: string | null }>;
}

/* ------------------------------------------------------------------ */
/* Derived snapshot types (analytics output, consumed by the UI)       */
/* ------------------------------------------------------------------ */

export type PitStatus =
  | "JUST_PITTED"
  | "PIT_WINDOW_SOON"
  | "OWES_STOP"
  | "LONG_STINT"
  | "SHORT_STINT"
  | "NORMAL";

export type GapTrend = "CATCHING" | "STABLE" | "LOSING";

export interface EffectivePositionEstimate {
  /** Estimated class position once every car has made its owed stops. */
  position: number;
  /** True when the estimate differs from the current class position. */
  differsFromCurrent: boolean;
  confidence: "LOW" | "MEDIUM";
  reason: string;
}

export interface LiveCarState {
  carNumber: string;
  team: string;
  vehicle: string | null;
  className: string;
  drivers: Driver[];
  currentDriver: string | null;

  overallPosition: number | null;
  classPosition: number | null;
  lapsCompleted: number;
  retired: boolean;

  /** Seconds behind the class leader; null for the leader or lapped cars. */
  gapToClassLeaderSeconds: number | null;
  /** Whole laps behind the class leader, when not on the lead lap of the class. */
  lapsBehindClassLeader: number;
  /** Seconds behind the car ahead in class; null for the class leader. */
  gapToAheadInClassSeconds: number | null;
  lapsBehindAheadInClass: number;

  lastLapSeconds: number | null;
  bestLapSeconds: number | null;
  /** Rolling representative pace (see analytics/pace.ts). */
  recentPaceSeconds: number | null;
  representativeLapCount: number;

  /** Trend vs the car ahead in class, from representative laps. */
  gapTrend: GapTrend | null;
  /** Positive = gaining on the car ahead (s/lap). */
  catchRateSecondsPerLap: number | null;

  stintLapCount: number | null;
  stintNumber: number;
  lastPitLap: number | null;
  pitStopCount: number;
  pitStatus: PitStatus;
  /** Plain-language strategy label shown in the tower. */
  strategyLabel: string | null;

  effectivePosition: EffectivePositionEstimate | null;
}

export type EventCategory = "FACT" | "TREND" | "ESTIMATE";

export type RaceEventKind =
  | "RACE_START"
  | "PIT_STOP"
  | "DRIVER_CHANGE"
  | "LEAD_CHANGE"
  | "CLASS_LEAD_CHANGE"
  | "POSITION_SWING"
  | "FCY_START"
  | "FCY_END"
  | "SC_START"
  | "SC_END"
  | "RED_FLAG"
  | "GREEN_FLAG"
  | "RETIREMENT"
  | "BATTLE";

export interface RaceEvent {
  id: string;
  kind: RaceEventKind;
  category: EventCategory;
  /** Race elapsed seconds when the event happened. */
  atSeconds: number;
  lap: number | null;
  carNumbers: string[];
  className: string | null;
  title: string;
  /** One or two sentences of beginner-friendly explanation. */
  detail: string | null;
}

export interface BattlePair {
  className: string;
  aheadCar: string;
  chasingCar: string;
  gapSeconds: number;
  gapLapsAgo: number | null;
  /** Gap N representative laps ago, for "gained X over last N laps". */
  previousGapSeconds: number | null;
  catchRateSecondsPerLap: number | null;
  /** Estimated laps until the gap closes, when meaningful. */
  lapsToCatch: number | null;
  aheadClassPosition: number;
  chasingClassPosition: number;
}

export interface StrategyCarView {
  carNumber: string;
  classPosition: number | null;
  stintLapCount: number | null;
  typicalStintLaps: number | null;
  lastPitLap: number | null;
  pitStopCount: number;
  pitStatus: PitStatus;
  owesStop: boolean;
  /** 0..1+ fraction of a typical stint completed. */
  stintProgress: number | null;
  projectedClassPosition: number | null;
}

export type FeedStatus = "LIVE" | "STALE" | "ENDED";

export interface RaceSnapshot {
  session: SessionInfo;
  dataSource: "DEMO" | "LIVE";
  /** Wall-clock ms when this snapshot was computed. */
  generatedAtMs: number;
  /** Race time elapsed in seconds. */
  elapsedSeconds: number;
  /** Estimated race time remaining in seconds (null when unknown). */
  remainingSeconds: number | null;
  currentFlag: TrackFlag;
  leaderLap: number | null;
  feedStatus: FeedStatus;
  /** Seconds since the last new timing data arrived. */
  secondsSinceLastData: number | null;

  classNames: string[];
  cars: LiveCarState[];
  battles: BattlePair[];
  strategyByClass: Record<string, StrategyCarView[]>;
  /** Recent events, newest first (the "What just happened?" feed). */
  recentEvents: RaceEvent[];
  /** Full timeline, oldest first. */
  timeline: RaceEvent[];
}
