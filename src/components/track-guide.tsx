"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  TICKET_PERK_LABEL,
  allTicketPerks,
  formatEventDateRange,
  upcomingEvents,
  type TicketPerk,
} from "@/lib/track-guide";
import { Card, CategoryBadge } from "./ui";

function perkHas(ticketPerks: TicketPerk[], perk: TicketPerk): boolean {
  return ticketPerks.includes(perk);
}

export function TrackGuide({ now = new Date() }: { now?: Date }) {
  const events = useMemo(() => upcomingEvents(now), [now]);
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? "");
  const event = events.find((e) => e.id === selectedId) ?? events[0];

  if (!event) {
    return (
      <Card title="Track helper" subtitle="Upcoming ELMS weekends.">
        <p className="text-sm text-muted">No upcoming ELMS rounds in this guide yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title="Upcoming race weekends"
        subtitle="Official ticket shops and a plain-language guide to what each pass actually includes."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {events.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={clsx(
                  "w-full rounded-xl border p-4 text-left",
                  item.id === event.id
                    ? "border-accent bg-surface-raised"
                    : "border-line hover:border-accent/50",
                )}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  {item.status === "this-weekend" ? "This weekend" : "Coming up"} · {formatEventDateRange(item)}
                </p>
                <p className="mt-1 font-semibold">{item.name}</p>
                <p className="text-sm text-muted">
                  {item.circuit}, {item.location}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title={
          <>
            Weekend timetable <CategoryBadge category="FACT" />
          </>
        }
        subtitle={`${event.circuit} · times in ${event.timezone.replace("_", " ")}`}
        actions={
          <a
            href={event.officialPage}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Official race page
          </a>
        }
      >
        <p className="mb-3 text-xs text-muted">{event.timetableNote}</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {event.days.map((day) => (
            <div key={day.date} className="rounded-lg border border-line bg-surface-raised p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">
                {day.weekday} {day.date.slice(8)}/{day.date.slice(5, 7)}
              </p>
              <p className="mt-0.5 text-sm font-semibold">{day.headline}</p>
              <ol className="mt-3 space-y-2">
                {day.items.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="flex gap-3 text-sm">
                    <span className="tabular w-12 shrink-0 font-semibold text-accent">
                      {item.start ?? "TBC"}
                    </span>
                    <span>
                      <span className="font-semibold">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-muted">
                        {item.series}
                        {item.certainty === "TBC" ? " · time not published yet" : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Which ticket do I need?"
        subtitle="ELMS ticket names are reused across circuits but the extras are easy to mix up. Pit walk ≠ grid walk."
        actions={
          <a
            href={event.ticketsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            {event.ticketsLabel}
          </a>
        }
      >
        <p className="mb-3 text-xs text-muted">{event.childrenFree} Confirm the live price on the official shop — early-bird rates expire.</p>
        <ul className="space-y-3">
          {event.tickets.map((ticket) => (
            <li
              key={ticket.id}
              className={clsx(
                "rounded-lg border p-3",
                ticket.recommended ? "border-accent/60 bg-surface-raised" : "border-line",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-semibold">{ticket.name}</h3>
                {ticket.recommended && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    Best first ticket
                  </span>
                )}
                <span className="ml-auto text-sm tabular text-muted">{ticket.fromPrice}</span>
              </div>
              <p className="text-xs uppercase tracking-wide text-muted">{ticket.days}</p>
              <p className="mt-2 text-sm leading-relaxed">{ticket.youGet}</p>
              {ticket.notIncluded && (
                <p className="mt-1 text-xs text-muted">Not included: {ticket.notIncluded}</p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-xs">
            <caption className="mb-2 text-left text-[11px] uppercase tracking-widest text-muted">
              At a glance — what each pass covers
            </caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-2 font-semibold">You get</th>
                {event.tickets.map((ticket) => (
                  <th key={ticket.id} className="px-2 py-2 font-semibold">
                    {ticket.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTicketPerks()
                .filter((perk) => event.tickets.some((t) => perkHas(t.perks, perk)))
                .map((perk) => (
                  <tr key={perk} className="border-b border-line/70">
                    <td className="py-2 pr-2">{TICKET_PERK_LABEL[perk]}</td>
                    {event.tickets.map((ticket) => (
                      <td key={ticket.id} className="px-2 py-2">
                        {perkHas(ticket.perks, perk) ? (
                          <span className="font-semibold" style={{ color: "var(--trend-up)" }}>
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted">No</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="How to spot the cars" subtitle="Best photo source vs what this app shows.">
        <p className="text-sm leading-relaxed">{event.spotterGuideNote}</p>
        <p className="mt-2 text-sm text-muted">
          OpenWEC has no car photos. betterTelem paints map dots from those colour notes so “the
          white Porsche with the pink nose” is #85 without hunting for a number. Always prefer the
          weekend Spotter Guide if a team has resprayed.
        </p>
      </Card>
    </div>
  );
}
