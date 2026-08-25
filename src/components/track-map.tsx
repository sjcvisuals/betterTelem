"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { LiveCarState, RaceSnapshot } from "@/lib/race/types";
import { estimateLapProgress } from "@/lib/analytics/track-position";
import { trackOutlineFor } from "@/lib/track-maps";
import { Card, CategoryBadge, ClassBadge, InfoTip, classColor } from "./ui";
import { useRaceControls } from "./race-provider";
import { LiveryChip, LiveryMapDot, TeamCrest, identityFor } from "./livery";

/**
 * Estimated live track map. OpenWEC has no GPS feed, so each car's dot is
 * placed by time-since-last-crossing / recent pace — clearly labeled an
 * estimate. Dots animate smoothly between data refreshes using the same
 * clock that drives polling.
 */

const FRAME_MS = 66; // ~15fps is plenty for dots and cheap to render

interface DotState {
  car: LiveCarState;
  x: number;
  y: number;
  inPit: boolean;
  overdue: boolean;
}

export function TrackMap({ snapshot }: { snapshot: RaceSnapshot }) {
  const controls = useRaceControls();
  const outline = useMemo(
    () => trackOutlineFor(snapshot.session.circuit),
    [snapshot.session.circuit],
  );
  const [classFilter, setClassFilter] = useState<string>("All");
  const [selectedCar, setSelectedCar] = useState<string | null>(null);

  const pathRef = useRef<SVGPathElement | null>(null);
  const [dots, setDots] = useState<DotState[]>([]);
  const snapshotRef = useRef<RaceSnapshot | null>(null);
  const receivedAtRef = useRef(0);

  useEffect(() => {
    snapshotRef.current = snapshot;
    receivedAtRef.current = Date.now();
  }, [snapshot]);

  const isDemo = snapshot.dataSource === "DEMO";
  const frozen =
    snapshot.feedStatus !== "LIVE" ||
    (isDemo && (controls.demoClock.paused || controls.demoClock.stale));
  const demoTimeNow = controls.demoTimeNow;
  const demoSpeed = controls.demoClock.speed;

  useEffect(() => {
    if (!outline) return;
    let raf = 0;
    let lastFrame = 0;

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      if (time - lastFrame < FRAME_MS) return;
      lastFrame = time;

      const path = pathRef.current;
      const current = snapshotRef.current;
      if (!path || !current) return;
      const total = path.getTotalLength();

      const raceTime = frozen
        ? current.elapsedSeconds
        : isDemo
          ? demoTimeNow()
          : current.elapsedSeconds + (Date.now() - receivedAtRef.current) / 1000;

      const next: DotState[] = [];
      for (const car of current.cars) {
        if (car.retired) continue;
        const progress = estimateLapProgress({
          raceTimeSeconds: raceTime,
          lastCrossingSeconds: car.lastCrossingElapsedSeconds,
          paceSeconds: car.recentPaceSeconds ?? car.lastLapSeconds,
          inPit: car.stintLapCount === 0,
          retired: car.retired,
        });
        if (progress.inPit) {
          next.push({ car, x: 0, y: 0, inPit: true, overdue: false });
          continue;
        }
        if (progress.fraction == null) continue;
        const at = progress.fraction * total;
        const point = path.getPointAtLength(at);
        next.push({
          car,
          x: point.x,
          y: point.y,
          inPit: false,
          overdue: progress.overdue,
        });
      }
      setDots(next);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [outline, frozen, isDemo, demoTimeNow, demoSpeed]);

  if (!outline) {
    return (
      <Card title="Track map" subtitle="Estimated car positions.">
        <p className="text-sm text-muted">
          No outline available yet for “{snapshot.session.circuit}”. Outlines are added
          per circuit — timing, strategy and battles above are unaffected.
        </p>
      </Card>
    );
  }

  const visibleDots = dots.filter(
    (d) => classFilter === "All" || d.car.className === classFilter,
  );
  const pitDots = visibleDots.filter((d) => d.inPit);
  const runningDots = visibleDots.filter((d) => !d.inPit);
  const selected = selectedCar
    ? snapshot.cars.find((c) => c.carNumber === selectedCar)
    : null;

  return (
    <Card
      title={
        <>
          Track map <CategoryBadge category="ESTIMATE" />
        </>
      }
      subtitle={
        <>
          Positions estimated from timing, not GPS. Circles are painted in
          simplified team colours so you can match them to the broadcast.{" "}
          <InfoTip label="How track positions and liveries work">
            OpenWEC provides no GPS, logos or car photos. Each marker is placed by
            the time since the car last crossed the line divided by its recent pace.
            Circles use a simplified 2025 ELMS colour palette — not official
            artwork — so “the pink Porsche” or “the yellow-green prototype” is
            easier to spot than hunting for a number. Timing-tower chips and crests
            use the same palette.
          </InfoTip>
        </>
      }
      actions={
        <div role="tablist" aria-label="Track map class filter" className="flex flex-wrap gap-1">
          {["All", ...snapshot.classNames].map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={classFilter === option}
              type="button"
              onClick={() => setClassFilter(option)}
              className={clsx(
                "rounded-lg px-2 py-1 text-xs font-semibold",
                classFilter === option
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      }
    >
      <svg
        viewBox={outline.viewBox}
        role="img"
        aria-label={`Estimated car positions on ${outline.displayName}`}
        className="w-full"
      >
        {/* Track surface */}
        <path
          d={outline.path}
          fill="none"
          stroke="var(--surface-raised)"
          strokeWidth={26}
          strokeLinejoin="round"
        />
        <path
          ref={pathRef}
          d={outline.path}
          fill="none"
          stroke="var(--border)"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* Start/finish marker */}
        <g transform={`translate(185 150) rotate(${outline.startFinishAngleDeg})`}>
          <rect x={-3} y={-16} width={6} height={32} fill="var(--foreground)" opacity={0.9} />
        </g>

        {/* Landmarks */}
        {outline.landmarks.map((mark) => (
          <text
            key={mark.label}
            x={mark.x}
            y={mark.y}
            fontSize={17}
            fill="var(--muted)"
            textAnchor="middle"
            opacity={0.75}
          >
            {mark.label}
          </text>
        ))}

        {/* Pit box */}
        <g>
          <rect
            x={outline.pitPoint.x - 36}
            y={outline.pitPoint.y - 16}
            width={72 + Math.max(0, pitDots.length - 2) * 28}
            height={32}
            rx={8}
            fill="var(--surface-raised)"
            stroke="var(--border)"
          />
          <text
            x={outline.pitPoint.x - 22}
            y={outline.pitPoint.y - 20}
            fontSize={14}
            fill="var(--muted)"
          >
            PIT
          </text>
          {pitDots.map((dot, index) => (
            <CarDot
              key={dot.car.carNumber}
              dot={dot}
              x={outline.pitPoint.x - 18 + index * 28}
              y={outline.pitPoint.y}
              selected={selectedCar === dot.car.carNumber}
              onSelect={setSelectedCar}
            />
          ))}
        </g>

        {/* Running cars */}
        {runningDots.map((dot) => (
            <CarDot
              key={dot.car.carNumber}
              dot={dot}
              x={dot.x}
              y={dot.y}
              selected={selectedCar === dot.car.carNumber}
              onSelect={setSelectedCar}
            />
        ))}
      </svg>

      {selected && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm">
          <TeamCrest
            identity={identityFor(selected.carNumber, selected.team)}
            size={32}
            title={`${selected.team} crest`}
          />
          <LiveryChip carNumber={selected.carNumber} team={selected.team} size="md" />
          <span className="tabular font-bold" style={{ color: classColor(selected.className) }}>
            #{selected.carNumber}
          </span>
          <span className="font-semibold">{selected.team}</span>
          <ClassBadge className={selected.className} compact />
          <span className="text-muted">
            {selected.classPosition != null ? `P${selected.classPosition} in class` : ""}
            {selected.currentDriver ? ` • ${selected.currentDriver}` : ""}
            {selected.stintLapCount != null && selected.stintLapCount > 0
              ? ` • ${selected.stintLapCount} laps into stint`
              : selected.stintLapCount === 0
                ? " • in the pits"
                : ""}
          </span>
          <button
            type="button"
            onClick={() => setSelectedCar(null)}
            className="ml-auto text-xs text-muted hover:text-foreground"
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      )}
    </Card>
  );
}

function CarDot({
  dot,
  x,
  y,
  selected,
  onSelect,
}: {
  dot: DotState;
  x: number;
  y: number;
  selected: boolean;
  onSelect: (carNumber: string | null) => void;
}) {
  const identity = identityFor(dot.car.carNumber, dot.car.team);
  return (
    <g
      transform={`translate(${x} ${y})`}
      onClick={() => onSelect(selected ? null : dot.car.carNumber)}
      className="cursor-pointer"
      role="button"
      aria-label={`Car ${dot.car.carNumber}, ${dot.car.team}`}
      opacity={dot.inPit ? 0.7 : dot.overdue ? 0.7 : 1}
    >
      <circle r={22} fill="transparent" stroke="none" />
      <LiveryMapDot
        identity={identity}
        className={dot.car.className}
        selected={selected}
      />
    </g>
  );
}
