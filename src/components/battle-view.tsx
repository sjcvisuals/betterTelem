"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { BattlePair, RaceSnapshot } from "@/lib/race/types";
import { formatGap, formatLapTime, formatRate } from "@/lib/race/format";
import { Card, CategoryBadge, ClassBadge, classColor } from "./ui";
import { LiveryChip, TeamCrest, identityFor } from "./livery";

/**
 * Battle view: compares two cars fighting for position. The headline card
 * shows the most interesting battle; others are selectable.
 */

function BattleDetail({ battle, snapshot }: { battle: BattlePair; snapshot: RaceSnapshot }) {
  const ahead = snapshot.cars.find((c) => c.carNumber === battle.aheadCar);
  const chasing = snapshot.cars.find((c) => c.carNumber === battle.chasingCar);
  if (!ahead || !chasing) return null;

  const paceDelta =
    ahead.recentPaceSeconds != null && chasing.recentPaceSeconds != null
      ? ahead.recentPaceSeconds - chasing.recentPaceSeconds
      : null;
  const gained =
    battle.previousGapSeconds != null ? battle.previousGapSeconds - battle.gapSeconds : null;

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {[ahead, chasing].map((car, index) => (
          <div
            key={car.carNumber}
            className={clsx("min-w-0", index === 0 ? "text-left" : "order-3 text-right")}
          >
            <div className={clsx("flex items-center gap-2", index === 1 && "justify-end")}>
              {index === 0 && (
                <TeamCrest identity={identityFor(car.carNumber, car.team)} size={28} />
              )}
              <div>
                <LiveryChip carNumber={car.carNumber} team={car.team} size="md" />
                <p
                  className="tabular text-lg font-bold"
                  style={{ color: classColor(car.className) }}
                >
                  #{car.carNumber}
                </p>
              </div>
              {index === 1 && (
                <TeamCrest identity={identityFor(car.carNumber, car.team)} size={28} />
              )}
            </div>
            <p className="truncate text-sm font-semibold">{car.team}</p>
            <p className="text-xs text-muted">
              P{car.classPosition} {car.className} • {car.currentDriver ?? "—"}
            </p>
          </div>
        ))}
        <div className="order-2 rounded-2xl bg-black/45 px-3 py-3 text-center ring-1 ring-white/10">
          <p className="tabular text-3xl font-black tracking-tight sm:text-4xl">{formatGap(battle.gapSeconds)}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-trend-up">gap</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-3 text-sm sm:grid-cols-3">
        <BattleStat label={`#${ahead.carNumber} recent pace`}>
          <span className="tabular">{formatLapTime(ahead.recentPaceSeconds)}</span>
        </BattleStat>
        <BattleStat label={`#${chasing.carNumber} recent pace`}>
          <span className="tabular">{formatLapTime(chasing.recentPaceSeconds)}</span>
        </BattleStat>
        <BattleStat label="Pace difference">
          {paceDelta != null && Math.abs(paceDelta) >= 0.05 ? (
            <span style={{ color: paceDelta > 0 ? "var(--trend-up)" : "var(--trend-down)" }}>
              #{paceDelta > 0 ? chasing.carNumber : ahead.carNumber} faster by{" "}
              {formatRate(paceDelta)}
            </span>
          ) : (
            "Evenly matched"
          )}
        </BattleStat>
        <BattleStat label={`#${ahead.carNumber} stint`}>
          {ahead.stintLapCount != null ? `${ahead.stintLapCount} laps` : "—"}
          {ahead.lastPitLap != null && (
            <span className="text-xs text-muted"> (pitted lap {ahead.lastPitLap})</span>
          )}
        </BattleStat>
        <BattleStat label={`#${chasing.carNumber} stint`}>
          {chasing.stintLapCount != null ? `${chasing.stintLapCount} laps` : "—"}
          {chasing.lastPitLap != null && (
            <span className="text-xs text-muted"> (pitted lap {chasing.lastPitLap})</span>
          )}
        </BattleStat>
        <BattleStat label="Projection">
          {battle.lapsToCatch != null ? (
            <span>
              <CategoryBadge category="ESTIMATE" /> battle in ~{battle.lapsToCatch} laps
            </span>
          ) : battle.catchRateSecondsPerLap != null && battle.catchRateSecondsPerLap > 0.1 ? (
            "Closing, too early to call"
          ) : (
            "No catch expected at current pace"
          )}
        </BattleStat>
      </dl>

      {gained != null && Math.abs(gained) >= 0.8 && battle.gapLapsAgo != null && (
        <p className="mt-3 rounded-lg bg-surface-raised p-2.5 text-sm">
          <CategoryBadge category="TREND" />{" "}
          <span className="ml-1">
            #{battle.chasingCar} has {gained > 0 ? "gained" : "lost"}{" "}
            {formatGap(Math.abs(gained))} over the last {battle.gapLapsAgo} representative
            laps.
          </span>
        </p>
      )}
    </div>
  );
}

function BattleStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export function BattleView({
  snapshot,
  className,
}: {
  snapshot: RaceSnapshot;
  className?: string;
}) {
  const battles = useMemo(
    () =>
      (className
        ? snapshot.battles.filter((b) => b.className === className)
        : snapshot.battles
      ).slice(0, 6),
    [snapshot.battles, className],
  );
  const [selected, setSelected] = useState(0);
  const battle = battles[Math.min(selected, Math.max(0, battles.length - 1))];

  return (
    <Card
      tone="battle"
      title="Battle to watch"
      subtitle="Cars fighting for the same class position."
    >
      {battle ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <ClassBadge className={battle.className} compact />
          </div>
          <BattleDetail battle={battle} snapshot={snapshot} />
          {battles.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3">
              {battles.map((candidate, index) => (
                <button
                  key={`${candidate.chasingCar}-${candidate.aheadCar}`}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-pressed={index === selected}
                  className={clsx(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold",
                    index === selected
                      ? "border-trend-up/50 bg-trend-up/15 text-foreground"
                      : "border-line text-muted hover:text-foreground",
                  )}
                >
                  #{candidate.chasingCar} vs #{candidate.aheadCar}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">
          No close battles right now — gaps across the field are large or still forming.
        </p>
      )}
    </Card>
  );
}
