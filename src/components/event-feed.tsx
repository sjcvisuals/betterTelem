"use client";

import type { EventCategory, RaceEvent, RaceSnapshot } from "@/lib/race/types";
import { formatClock } from "@/lib/race/format";
import { Card, CategoryBadge, ClassBadge } from "./ui";

/** The "What just happened?" feed: recent events as explanation cards. */

const KIND_ICON: Record<string, string> = {
  PIT_STOP: "⛽",
  DRIVER_CHANGE: "🔁",
  LEAD_CHANGE: "🏁",
  CLASS_LEAD_CHANGE: "🏁",
  POSITION_SWING: "↕",
  FCY_START: "🟡",
  FCY_END: "🟢",
  SC_START: "🚨",
  SC_END: "🟢",
  GREEN_FLAG: "🟢",
  RED_FLAG: "🔴",
  RETIREMENT: "✖",
  BATTLE: "⚔",
  RACE_START: "🏁",
};

const CATEGORY_RAIL: Record<EventCategory, string> = {
  FACT: "var(--class-lmp2)",
  TREND: "var(--trend-up)",
  ESTIMATE: "var(--flag-yellow)",
};

export function EventCard({ event }: { event: RaceEvent }) {
  return (
    <article
      className="rounded-md border border-line bg-surface-raised p-3"
      style={{ boxShadow: `inset 3px 0 0 ${CATEGORY_RAIL[event.category]}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug">
          <span aria-hidden className="mr-1.5">
            {KIND_ICON[event.kind] ?? "•"}
          </span>
          {event.title}
        </p>
        <CategoryBadge category={event.category} />
      </div>
      {event.detail && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{event.detail}</p>
      )}
      <p className="mt-2 flex items-center gap-2 text-[11px] text-muted">
        <span className="tabular">{formatClock(event.atSeconds)}</span>
        {event.lap != null && <span>Lap {event.lap}</span>}
        {event.className && <ClassBadge className={event.className} compact />}
      </p>
    </article>
  );
}

export function EventFeed({ snapshot }: { snapshot: RaceSnapshot }) {
  return (
    <Card
      title="What just happened?"
      subtitle="Recent race events, explained. FACT = observed, TREND = from several laps, ESTIMATE = projection."
    >
      {snapshot.recentEvents.length === 0 ? (
        <p className="text-sm text-muted">Nothing notable in the last few minutes.</p>
      ) : (
        <div className="space-y-2" aria-live="polite">
          {snapshot.recentEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </Card>
  );
}
