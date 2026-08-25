"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import type { LiveCarState, RaceSnapshot } from "@/lib/race/types";
import { formatGap, formatLapTime, formatRate } from "@/lib/race/format";
import { Card, ClassBadge, ClassFilterChip, InfoTip, TrendArrow, classColor } from "./ui";
import { LiveryChip, TeamCrest, identityFor } from "./livery";

/**
 * Beginner-friendly timing tower. Class position first, gaps explained in
 * words, strategy in plain language. Rows expand for deeper timing data.
 */

const CLASS_FILTERS = ["All classes", "LMP2", "LMP2 Pro/Am", "LMP3", "LMGT3"] as const;

function gapText(car: LiveCarState): string {
  if (car.retired) return "Retired";
  if (car.classPosition === 1) return "Leader";
  if (car.lapsBehindClassLeader > 0) {
    return `${car.lapsBehindClassLeader} lap${car.lapsBehindClassLeader > 1 ? "s" : ""} behind`;
  }
  if (car.gapToClassLeaderSeconds != null) {
    return `${formatGap(car.gapToClassLeaderSeconds)} behind leader`;
  }
  return "—";
}

function trendText(car: LiveCarState): string | null {
  if (car.classPosition === 1 || car.retired) return null;
  if (car.gapTrend === "CATCHING" && car.catchRateSecondsPerLap != null) {
    return `Catching ~${formatRate(car.catchRateSecondsPerLap)}`;
  }
  if (car.gapTrend === "LOSING" && car.catchRateSecondsPerLap != null) {
    return `Losing ~${formatRate(car.catchRateSecondsPerLap)}`;
  }
  if (car.gapTrend === "STABLE") return "Gap stable";
  return null;
}

const PIT_STATUS_STYLE: Record<string, string> = {
  JUST_PITTED: "text-lmp2",
  PIT_WINDOW_SOON: "text-flag-yellow",
  OWES_STOP: "text-flag-sc",
  LONG_STINT: "text-flag-sc",
};

function CarRow({
  car,
  aheadCar,
  showClassBadge,
}: {
  car: LiveCarState;
  aheadCar: LiveCarState | null;
  showClassBadge: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const trend = trendText(car);

  return (
    <li
      className={clsx(
        "rounded-md border-l-[3px]",
        car.retired ? "opacity-45" : "hover:bg-white/[0.03]",
        car.classPosition === 1 && !car.retired && "bg-surface-raised/80",
      )}
      style={{ borderLeftColor: classColor(car.className) }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`Car ${car.carNumber} ${car.team}, ${
          car.classPosition != null ? `P${car.classPosition} in ${car.className}` : car.className
        }. ${gapText(car)}. Press to ${expanded ? "collapse" : "expand"} details.`}
        className="grid w-full grid-cols-[2.4rem_minmax(3.6rem,auto)_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2 py-2 text-left sm:grid-cols-[2.6rem_minmax(4.2rem,auto)_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
      >
        {/* Class position */}
        <span className="flex flex-col items-center">
          <span className="tabular text-lg font-bold leading-none">
            {car.retired ? "—" : car.classPosition != null ? `P${car.classPosition}` : "—"}
          </span>
          {car.overallPosition != null && !car.retired && (
            <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">
              {`overall ${car.overallPosition}`}
            </span>
          )}
        </span>

        {/* Livery chip + number */}
        <span className="flex items-center justify-center">
          <LiveryChip carNumber={car.carNumber} team={car.team} />
        </span>

        {/* Team / driver / class */}
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <TeamCrest
              identity={identityFor(car.carNumber, car.team)}
              size={20}
              title={`${car.team} crest`}
            />
            <span className="truncate text-sm font-semibold">{car.team}</span>
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
            {showClassBadge && <ClassBadge className={car.className} compact />}
            <span className="truncate">{car.currentDriver ?? "—"}</span>
          </span>
        </span>

        {/* Race story: gap + trend + stint (hidden on very small screens) */}
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="text-sm">
            {gapText(car)}
            {trend && (
              <span className="ml-2 text-xs text-muted">
                <TrendArrow trend={car.gapTrend} /> {trend}
              </span>
            )}
          </span>
          <span className="mt-0.5 text-xs text-muted">
            {car.stintLapCount != null && !car.retired && (
              <>
                {car.stintLapCount === 0
                  ? "In / leaving pits"
                  : `${car.stintLapCount} laps into stint`}
              </>
            )}
            {car.strategyLabel && (
              <span
                className={clsx(
                  "ml-2 font-semibold uppercase tracking-wide",
                  PIT_STATUS_STYLE[car.pitStatus] ?? "text-muted",
                )}
              >
                {car.strategyLabel}
              </span>
            )}
          </span>
        </span>

        {/* Expand chevron */}
        <span aria-hidden className="text-muted">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {/* Mobile summary line */}
      <div className="px-2 pb-1 text-xs text-muted sm:hidden">
        {gapText(car)}
        {trend ? ` • ${trend}` : ""}
        {car.strategyLabel ? ` • ${car.strategyLabel}` : ""}
      </div>

      {expanded && (
        <div className="mx-2 mb-2 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-surface-raised p-3 text-sm sm:grid-cols-4">
          <Detail label="Gap to car ahead">
            {car.classPosition === 1
              ? "—"
              : car.lapsBehindAheadInClass > 0
                ? `${car.lapsBehindAheadInClass} lap${car.lapsBehindAheadInClass > 1 ? "s" : ""}`
                : car.gapToAheadInClassSeconds != null
                  ? `${formatGap(car.gapToAheadInClassSeconds)}${aheadCar ? ` behind #${aheadCar.carNumber}` : ""}`
                  : "—"}
          </Detail>
          <Detail label="Last lap">
            <span className="tabular">{formatLapTime(car.lastLapSeconds)}</span>
          </Detail>
          <Detail
            label={
              <>
                Recent pace{" "}
                <InfoTip label="How recent pace is calculated">
                  Average of the last {Math.min(5, car.representativeLapCount) || 5}{" "}
                  representative laps: green-flag laps only, excluding pit in/out laps,
                  caution laps and obvious outliers.
                </InfoTip>
              </>
            }
          >
            <span className="tabular">{formatLapTime(car.recentPaceSeconds)}</span>
          </Detail>
          <Detail label="Best lap">
            <span className="tabular">{formatLapTime(car.bestLapSeconds)}</span>
          </Detail>
          <Detail label="Pit stops">{car.pitStopCount}</Detail>
          <Detail label="Last pit">
            {car.lastPitLap != null ? `Lap ${car.lastPitLap}` : "None yet"}
          </Detail>
          <Detail label="Laps completed">{car.lapsCompleted}</Detail>
          <Detail
            label={
              <>
                Effective position{" "}
                <InfoTip label="What effective position means">
                  An <strong>estimate</strong> of the running order once every car has
                  made the pit stops it still owes — it corrects for cars that look
                  ahead only because they have not pitted yet.
                </InfoTip>
              </>
            }
          >
            {car.effectivePosition ? (
              <span>
                ~P{car.effectivePosition.position} after pit cycle{" "}
                <span className="text-xs text-muted">
                  (estimate, {car.effectivePosition.confidence.toLowerCase()} confidence)
                </span>
              </span>
            ) : (
              "—"
            )}
          </Detail>
          <div className="col-span-2 sm:col-span-4">
            <Link
              href={`/car/${car.carNumber}`}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Full car details →
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

function Detail({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export function TimingTower({
  snapshot,
  fixedClass,
}: {
  snapshot: RaceSnapshot;
  fixedClass?: string;
}) {
  const [filter, setFilter] = useState<string>(fixedClass ?? "All classes");
  const activeFilter = fixedClass ?? filter;

  const classesToShow =
    activeFilter === "All classes" ? snapshot.classNames : [activeFilter];

  return (
    <Card
      tone="live"
      title="Timing tower"
      subtitle="Positions are within class — that is what each car is racing for."
      actions={
        !fixedClass && (
          <div
            role="tablist"
            aria-label="Filter by class"
            className="flex flex-wrap gap-1"
          >
            {CLASS_FILTERS.filter(
              (c) => c === "All classes" || snapshot.classNames.includes(c),
            ).map((option) => (
              <ClassFilterChip
                key={option}
                label={option}
                selected={activeFilter === option}
                onClick={() => setFilter(option)}
                classNameForColor={option}
              />
            ))}
          </div>
        )
      }
    >
      <div className="space-y-5">
        {classesToShow.map((className) => {
          const cars = snapshot.cars
            .filter((c) => c.className === className)
            .sort((a, b) => {
              if (a.retired !== b.retired) return a.retired ? 1 : -1;
              return (a.classPosition ?? 99) - (b.classPosition ?? 99);
            });
          return (
            <div key={className}>
              <div className="mb-1.5 flex items-center gap-2">
                <Link
                  href={`/class/${encodeURIComponent(className)}`}
                  title={`Open the ${className} class view`}
                >
                  <ClassBadge className={className} />
                </Link>
                <span className="text-xs text-muted">{cars.filter((c) => !c.retired).length} running</span>
              </div>
              <ul className="space-y-0.5">
                {cars.map((car) => {
                  const ahead =
                    car.classPosition != null && car.classPosition > 1
                      ? (cars.find((c) => c.classPosition === car.classPosition! - 1) ?? null)
                      : null;
                  return (
                    <CarRow
                      key={car.carNumber}
                      car={car}
                      aheadCar={ahead}
                      showClassBadge={activeFilter === "All classes"}
                    />
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
