import "server-only";
import { buildSnapshot } from "@/lib/analytics/snapshot";
import { demoRaceAt, demoScenarios, DEMO_RACE_DURATION_SECONDS } from "@/lib/demo/simulate";
import { loadLiveRaceData } from "@/lib/live/provider";
import { getEventDetail } from "@/lib/openwec/client";
import type { RaceData, RaceSnapshot } from "@/lib/race/types";

/**
 * Shared request-resolution for the snapshot and car-detail routes:
 * turns query params into (RaceData, RaceSnapshot).
 */

export interface ResolvedRace {
  data: RaceData;
  snapshot: RaceSnapshot;
  limitations: string[];
  demoScenarios: ReturnType<typeof demoScenarios> | null;
}

export class BadRequestError extends Error {}

export async function resolveRace(searchParams: URLSearchParams): Promise<ResolvedRace> {
  const mode = searchParams.get("mode") === "live" ? "LIVE" : "DEMO";

  if (mode === "DEMO") {
    const tParam = searchParams.get("t");
    const t = tParam != null ? Number(tParam) : 5400;
    if (!Number.isFinite(t) || t < 0 || t > DEMO_RACE_DURATION_SECONDS + 600) {
      throw new BadRequestError("Invalid demo time parameter 't'.");
    }
    const stale = searchParams.get("stale") === "1";
    const data = demoRaceAt(t);
    const snapshot = buildSnapshot(data, {
      dataSource: "DEMO",
      forceStaleSeconds: stale ? 240 : null,
    });
    return { data, snapshot, limitations: [], demoScenarios: demoScenarios() };
  }

  const sessionId = Number(searchParams.get("session"));
  const eventId = Number(searchParams.get("event"));
  if (!Number.isFinite(sessionId) || sessionId <= 0) {
    throw new BadRequestError("Live mode requires a 'session' id.");
  }
  if (!Number.isFinite(eventId) || eventId <= 0) {
    throw new BadRequestError("Live mode requires an 'event' id.");
  }

  const event = await getEventDetail(eventId);
  const sessionMeta = event.sessions.find((s) => s.id === sessionId);
  if (!sessionMeta) {
    throw new BadRequestError(`Session ${sessionId} does not belong to event ${eventId}.`);
  }

  const { data, limitations } = await loadLiveRaceData(sessionId, {
    eventName: event.name,
    sessionName: sessionMeta.name,
    sessionType: sessionMeta.session_type,
    sessionAt: sessionMeta.session_at,
    seriesName: event.series,
  });
  const snapshot = buildSnapshot(data, { dataSource: "LIVE" });
  return { data, snapshot, limitations, demoScenarios: null };
}
