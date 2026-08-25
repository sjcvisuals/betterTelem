import { broadcastEventFor, upcomingEvents, type TrackEvent } from "@/lib/track-guide";

export type ResolvedStream =
  | { mode: "manual"; videoId: string }
  | { mode: "official-live"; event: TrackEvent }
  | { mode: "idle"; nextEvent: TrackEvent | undefined };

/**
 * Manual paste always wins. Otherwise the official ELMS channel live player
 * appears on calendar race-weekend days (circuit timezone), not from demo time.
 */
export function resolveStreamSource(storedVideoId: string | null, now: Date): ResolvedStream {
  if (storedVideoId) return { mode: "manual", videoId: storedVideoId };
  const event = broadcastEventFor(now);
  if (event) return { mode: "official-live", event };
  return { mode: "idle", nextEvent: upcomingEvents(now)[0] };
}
