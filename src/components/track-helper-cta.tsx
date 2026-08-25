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
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl rounded-br-[2.25rem] border border-spotlight/45 bg-gradient-to-r from-spotlight/22 via-spotlight/8 to-transparent p-4 no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:from-spotlight/28 sm:flex-row sm:items-center sm:justify-between"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rotate-12 rounded-[2rem] bg-spotlight/25"
      />
      <div className="relative min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-spotlight">
          {thisWeekend ? "At the circuit this weekend" : "Going to a race?"}
        </p>
        <p className="mt-1 text-lg font-black tracking-tight text-foreground">
          Track helper — tickets, timetable, pit walk vs grid walk
        </p>
        {event && (
          <p className="mt-0.5 text-sm text-muted">
            {thisWeekend ? "This weekend: " : "Next up: "}
            {event.name} · {formatEventDateRange(event)}
          </p>
        )}
      </div>
      <span className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-spotlight px-5 py-2.5 text-sm font-black text-spotlight-ink shadow-[0_8px_20px_rgba(255,200,87,0.28)] group-hover:brightness-110">
        Open Track helper →
      </span>
    </Link>
  );
}
