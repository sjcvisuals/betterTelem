"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { RaceEvent, RaceSnapshot } from "@/lib/race/types";
import { formatClock } from "@/lib/race/format";
import { EventCard } from "./event-feed";
import { Card } from "./ui";

/**
 * Race timeline: significant events along the session. Click a marker to
 * inspect what changed. Pit stops are summarised (there are hundreds).
 */

const MAJOR_KINDS = new Set([
  "RACE_START",
  "FCY_START",
  "SC_START",
  "RED_FLAG",
  "GREEN_FLAG",
  "CLASS_LEAD_CHANGE",
  "RETIREMENT",
  "POSITION_SWING",
]);

const KIND_COLOR: Record<string, string> = {
  FCY_START: "var(--flag-yellow)",
  SC_START: "var(--flag-sc)",
  RED_FLAG: "var(--flag-red)",
  GREEN_FLAG: "var(--flag-green)",
  RACE_START: "var(--flag-green)",
  CLASS_LEAD_CHANGE: "var(--class-lmp2)",
  RETIREMENT: "var(--flag-red)",
  POSITION_SWING: "var(--class-lmp2-proam)",
};

export function Timeline({ snapshot }: { snapshot: RaceSnapshot }) {
  const [selected, setSelected] = useState<RaceEvent | null>(null);
  const [showAll, setShowAll] = useState(false);

  const majorEvents = useMemo(
    () => snapshot.timeline.filter((e) => MAJOR_KINDS.has(e.kind)),
    [snapshot.timeline],
  );
  const listedEvents = useMemo(() => {
    const list = showAll
      ? snapshot.timeline.filter((e) => e.kind !== "BATTLE")
      : majorEvents;
    return [...list].reverse();
  }, [snapshot.timeline, majorEvents, showAll]);

  const total = snapshot.session.scheduledDurationSeconds ?? snapshot.elapsedSeconds;
  const pitCount = snapshot.timeline.filter((e) => e.kind === "PIT_STOP").length;

  return (
    <Card
      title="Race timeline"
      subtitle={`${majorEvents.length} major events • ${pitCount} pit stops so far`}
      actions={
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-foreground"
        >
          {showAll ? "Major events only" : "Show everything"}
        </button>
      }
    >
      {/* Visual strip */}
      <div
        className="relative mb-4 h-8 rounded-lg bg-surface-raised"
        role="img"
        aria-label="Timeline of major race events"
      >
        {/* Elapsed portion */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-l-lg bg-foreground/5"
          style={{ width: `${Math.min(1, snapshot.elapsedSeconds / total) * 100}%` }}
        />
        {majorEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            title={`${formatClock(event.atSeconds)} — ${event.title}`}
            onClick={() => setSelected(event)}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background transition-transform hover:scale-125"
            style={{
              left: `${Math.min(0.99, event.atSeconds / total) * 100}%`,
              background: KIND_COLOR[event.kind] ?? "var(--muted)",
            }}
          />
        ))}
      </div>

      {selected && (
        <div className="mb-3">
          <EventCard event={selected} />
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-1.5 text-xs text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
      )}

      <ol className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {listedEvents.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => setSelected(event)}
              className={clsx(
                "flex w-full items-baseline gap-3 rounded-md px-2 py-1 text-left text-sm hover:bg-surface-raised",
                selected?.id === event.id && "bg-surface-raised",
              )}
            >
              <span className="tabular shrink-0 text-xs text-muted">
                {formatClock(event.atSeconds)}
              </span>
              <span className="min-w-0 truncate">{event.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </Card>
  );
}
