"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { RaceSnapshot, StrategyCarView } from "@/lib/race/types";
import { Card, CategoryBadge, ClassBadge, InfoTip, classColor } from "./ui";

/**
 * Pit-cycle / strategy visualization: each car's current stint as a progress
 * bar toward its typical stop, plus the projected class order after stops.
 */

function stintBarLabel(car: StrategyCarView): string {
  if (car.pitStatus === "JUST_PITTED") return "Just pitted";
  if (car.pitStatus === "PIT_WINDOW_SOON") return "Pit expected soon";
  if (car.pitStatus === "LONG_STINT") return "Long stint — extending";
  if (car.owesStop) return "Still owes a stop";
  return "On schedule";
}

function StintBar({ car, highlighted, onSelect }: {
  car: StrategyCarView;
  highlighted: boolean;
  onSelect: () => void;
}) {
  const progress = car.stintProgress != null ? Math.min(car.stintProgress, 1.35) : null;
  const overdue = car.stintProgress != null && car.stintProgress > 1.05;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={highlighted}
        className={clsx(
          "grid w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left",
          highlighted ? "bg-surface-raised" : "hover:bg-surface-raised/60",
        )}
      >
        <span className="tabular text-sm font-bold">
          #{car.carNumber}
          <span className="ml-1 text-[10px] font-normal text-muted">
            {car.classPosition != null ? `P${car.classPosition}` : ""}
          </span>
        </span>
        <span className="relative block h-3.5 overflow-hidden rounded-full bg-surface-raised">
          {progress != null && (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
              style={{
                width: `${Math.min(progress, 1) * 100}%`,
                background: overdue
                  ? "var(--flag-sc)"
                  : car.pitStatus === "PIT_WINDOW_SOON"
                    ? "var(--flag-yellow)"
                    : car.pitStatus === "JUST_PITTED"
                      ? "var(--class-lmp2)"
                      : "color-mix(in srgb, var(--foreground) 45%, transparent)",
              }}
            />
          )}
          {/* Expected-stop marker */}
          <span aria-hidden className="absolute inset-y-0 right-0 w-0.5 bg-line" />
        </span>
        <span className="w-40 truncate text-right text-xs text-muted">
          {car.stintLapCount != null ? `${car.stintLapCount}` : "?"}
          {car.typicalStintLaps != null ? `/${car.typicalStintLaps} laps` : " laps"} •{" "}
          {stintBarLabel(car)}
        </span>
      </button>
    </li>
  );
}

export function StrategyView({
  snapshot,
  fixedClass,
}: {
  snapshot: RaceSnapshot;
  fixedClass?: string;
}) {
  const [selectedClass, setSelectedClass] = useState(fixedClass ?? "LMP2");
  const activeClass = fixedClass ?? selectedClass;
  const [highlightedCar, setHighlightedCar] = useState<string | null>(null);

  const cars = useMemo(
    () => snapshot.strategyByClass[activeClass] ?? [],
    [snapshot.strategyByClass, activeClass],
  );
  const projected = useMemo(
    () =>
      [...cars]
        .filter((c) => c.projectedClassPosition != null)
        .sort((a, b) => (a.projectedClassPosition ?? 99) - (b.projectedClassPosition ?? 99))
        .slice(0, 6),
    [cars],
  );

  return (
    <Card
      title="Strategy — pit cycle"
      subtitle={
        <>
          Each bar is a car&apos;s current stint vs its usual stint length.{" "}
          <InfoTip label="How the pit cycle view works">
            The bar fills as a stint gets older. The marker at the end is the car&apos;s
            typical stop point (median of its completed stints). Orange bars are past
            their usual window; blue bars just stopped. Cars on very different fill
            levels are on different pit sequences.
          </InfoTip>
        </>
      }
      actions={
        !fixedClass && (
          <div role="tablist" aria-label="Strategy class" className="flex flex-wrap gap-1">
            {snapshot.classNames.map((option) => (
              <button
                key={option}
                role="tab"
                aria-selected={activeClass === option}
                type="button"
                onClick={() => {
                  setSelectedClass(option);
                  setHighlightedCar(null);
                }}
                className={clsx(
                  "rounded-lg px-2 py-1 text-xs font-semibold",
                  activeClass === option
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )
      }
    >
      <div className="mb-2">
        <ClassBadge className={activeClass} />
      </div>

      {cars.length === 0 ? (
        <p className="text-sm text-muted">No stint data yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {cars.map((car) => (
            <StintBar
              key={car.carNumber}
              car={car}
              highlighted={highlightedCar === car.carNumber}
              onSelect={() =>
                setHighlightedCar((current) => (current === car.carNumber ? null : car.carNumber))
              }
            />
          ))}
        </ul>
      )}

      {highlightedCar && (
        <HighlightPanel snapshot={snapshot} carNumber={highlightedCar} />
      )}

      {projected.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Projected order after pit cycle <CategoryBadge category="ESTIMATE" />
          </p>
          <ol className="flex flex-wrap gap-2">
            {projected.map((car) => (
              <li
                key={car.carNumber}
                className="rounded-lg border border-line px-2.5 py-1 text-sm"
              >
                <span className="text-muted">~P{car.projectedClassPosition}</span>{" "}
                <span
                  className="tabular font-bold"
                  style={{ color: classColor(activeClass) }}
                >
                  #{car.carNumber}
                </span>
                {car.projectedClassPosition !== car.classPosition && car.classPosition != null && (
                  <span className="ml-1 text-xs text-muted">(now P{car.classPosition})</span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Calculated by this app from stint history, typical stint lengths and measured
            pit-stop time loss. It is an estimate, not timing data.
          </p>
        </div>
      )}
    </Card>
  );
}

function HighlightPanel({ snapshot, carNumber }: { snapshot: RaceSnapshot; carNumber: string }) {
  const car = snapshot.cars.find((c) => c.carNumber === carNumber);
  if (!car) return null;
  const rivals = snapshot.cars.filter(
    (c) =>
      c.className === car.className &&
      !c.retired &&
      c.carNumber !== carNumber &&
      c.classPosition != null &&
      car.classPosition != null &&
      Math.abs(c.classPosition - car.classPosition) <= 1,
  );
  return (
    <div className="mt-3 rounded-lg border border-line bg-surface-raised p-3 text-sm">
      <p className="font-semibold">
        #{car.carNumber} {car.team} — direct competitors
      </p>
      {rivals.length > 0 ? (
        <ul className="mt-1.5 space-y-1 text-muted">
          {rivals.map((rival) => (
            <li key={rival.carNumber}>
              P{rival.classPosition} #{rival.carNumber} {rival.team}
              {rival.stintLapCount != null && car.stintLapCount != null && (
                <>
                  {" — stint "}
                  {rival.stintLapCount === car.stintLapCount
                    ? "same age (same strategy)"
                    : rival.stintLapCount > car.stintLapCount
                      ? `${rival.stintLapCount - car.stintLapCount} laps older (likely stops first)`
                      : `${car.stintLapCount - rival.stintLapCount} laps newer (off-sequence)`}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-muted">No direct rivals nearby.</p>
      )}
    </div>
  );
}
