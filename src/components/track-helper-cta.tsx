import Link from "next/link";
import {
  broadcastEventFor,
  formatEventDateRange,
  upcomingEvents,
  type TrackEvent,
} from "@/lib/track-guide";

function featuredEvent(now: Date): TrackEvent | undefined {
  return broadcastEventFor(now) ?? upcomingEvents(now)[0];
}

/** Big in-page invitation to the weekend helper — tickets, timetable, pit vs grid walk. */
export function TrackHelperBanner({ now = new Date() }: { now?: Date }) {
  const event = featuredEvent(now);
  const thisWeekend = event?.status === "this-weekend";

  return (
    <Link
      href="/track"
      className="flex flex-col gap-3 rounded-xl border-2 border-accent bg-accent/10 p-4 no-underline transition-colors hover:bg-accent/15 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
          {thisWeekend ? "At the circuit this weekend" : "Going to a race?"}
        </p>
        <p className="mt-1 text-base font-bold text-foreground">
          Track helper — tickets, timetable, pit walk vs grid walk
        </p>
        {event && (
          <p className="mt-0.5 text-sm text-muted">
            {thisWeekend ? "This weekend: " : "Next up: "}
            {event.name} · {formatEventDateRange(event)}
          </p>
        )}
      </div>
      <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-background">
        Open Track helper →
      </span>
    </Link>
  );
}
