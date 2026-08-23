"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRaceControls } from "./race-provider";

/** Picks a real ELMS session (public OpenWEC navigation data) for live mode. */

interface EventsResponse {
  seasons?: number[];
  events?: { id: number; name: string; round: number | null }[];
}

interface EventDetailResponse {
  event: {
    id: number;
    name: string;
    sessions: {
      id: number;
      name: string;
      sessionType: string;
      sessionAt: string | null;
      lapCount: number | null;
    }[];
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function LiveSessionPicker() {
  const controls = useRaceControls();
  const [year, setYear] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);

  const seasons = useQuery({
    queryKey: ["elms-seasons"],
    queryFn: () => fetchJson<EventsResponse>("/api/elms/events"),
    staleTime: 3600_000,
  });

  const events = useQuery({
    queryKey: ["elms-events", year],
    queryFn: () => fetchJson<EventsResponse>(`/api/elms/events?year=${year}`),
    enabled: year != null,
    staleTime: 3600_000,
  });

  const eventDetail = useQuery({
    queryKey: ["elms-event", eventId],
    queryFn: () => fetchJson<EventDetailResponse>(`/api/elms/events/${eventId}`),
    enabled: eventId != null,
    staleTime: 300_000,
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        Season
        <select
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-foreground"
          value={year ?? ""}
          onChange={(event) => {
            setYear(event.target.value ? Number(event.target.value) : null);
            setEventId(null);
            controls.setLiveSelection({ eventId: null, sessionId: null });
          }}
        >
          <option value="">Select…</option>
          {(seasons.data?.seasons ?? []).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Event
        <select
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-foreground"
          value={eventId ?? ""}
          disabled={year == null || events.isLoading}
          onChange={(event) => {
            setEventId(event.target.value ? Number(event.target.value) : null);
            controls.setLiveSelection({ eventId: null, sessionId: null });
          }}
        >
          <option value="">Select…</option>
          {(events.data?.events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.round != null ? `R${e.round} — ` : ""}
              {e.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Session
        <select
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-foreground"
          value={controls.liveSelection.sessionId ?? ""}
          disabled={eventId == null || eventDetail.isLoading}
          onChange={(event) =>
            controls.setLiveSelection({
              eventId,
              sessionId: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">Select…</option>
          {(eventDetail.data?.event.sessions ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.lapCount != null && s.lapCount > 0 ? ` (${s.lapCount} laps recorded)` : ""}
            </option>
          ))}
        </select>
      </label>

      {(seasons.error || events.error || eventDetail.error) && (
        <p className="text-xs text-flag-red" role="alert">
          {(seasons.error ?? events.error ?? eventDetail.error)?.message}
        </p>
      )}
      <p className="basis-full text-[11px] leading-relaxed text-muted">
        Live mode shows a real OpenWEC session. Without a configured{" "}
        <code className="tabular">OPENWEC_API_KEY</code>, only the public entry list and
        classification are available — lap-by-lap analytics need a key.
      </p>
    </div>
  );
}
