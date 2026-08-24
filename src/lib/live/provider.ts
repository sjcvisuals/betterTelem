import "server-only";
import {
  getAllLaps,
  getRaceControl,
  getResults,
  getStints,
  hasApiKey,
  OpenWecError,
} from "@/lib/openwec/client";
import {
  groupLapsByCar,
  normalizeCar,
  normalizeLap,
  normalizeRaceControl,
  parseSessionStartMs,
} from "@/lib/openwec/normalize";
import type { RaceData, SessionInfo } from "@/lib/race/types";

/**
 * Live-mode data provider: assembles internal RaceData from OpenWEC for a
 * given session. Degrades gracefully:
 * - with an API key: full laps + race-control data
 * - without: entry list + classification only (public endpoints), and the
 *   response flags which capabilities are missing.
 */

const ELMS_RACE_DURATION_SECONDS = 4 * 3600;

export interface LiveDataResult {
  data: RaceData;
  limitations: string[];
}

export async function loadLiveRaceData(
  sessionId: number,
  sessionMeta: {
    eventName: string;
    sessionName: string;
    sessionType: string;
    sessionAt: string | null;
    seriesName: string;
  },
): Promise<LiveDataResult> {
  const limitations: string[] = [];

  const results = await getResults(sessionId);
  const cars = results.map(normalizeCar);

  const session: SessionInfo = {
    id: String(sessionId),
    seriesName: sessionMeta.seriesName,
    eventName: sessionMeta.eventName,
    circuit: sessionMeta.eventName,
    sessionName: sessionMeta.sessionName,
    sessionType: sessionMeta.sessionType,
    startTimeUtc: sessionMeta.sessionAt,
    scheduledDurationSeconds:
      sessionMeta.sessionType === "Race" ? ELMS_RACE_DURATION_SECONDS : null,
  };

  let lapsByCar: RaceData["lapsByCar"] = {};
  let raceControl: RaceData["raceControl"] = [];

  if (!hasApiKey()) {
    limitations.push(
      "OPENWEC_API_KEY is not configured — lap-by-lap timing, stints and race control are unavailable. Showing entry list and classification only.",
    );
  } else {
    try {
      const [laps, rc] = await Promise.all([getAllLaps(sessionId), getRaceControl(sessionId)]);
      lapsByCar = groupLapsByCar(laps.map(normalizeLap));
      raceControl = rc
        .map(normalizeRaceControl)
        .filter((p): p is NonNullable<typeof p> => p != null);
      // Stints endpoint exists but stints are reconstructed from laps locally,
      // keeping one code path with demo mode. Request it once to surface auth
      // problems early (result unused deliberately).
      await getStints(sessionId).catch(() => undefined);
    } catch (error) {
      if (error instanceof OpenWecError && error.kind === "AUTH") {
        limitations.push(
          "OpenWEC rejected the API key (it may still be pending approval). Showing entry list and classification only.",
        );
      } else {
        throw error;
      }
    }
  }

  let elapsedSeconds = 0;
  for (const laps of Object.values(lapsByCar)) {
    const last = laps[laps.length - 1];
    if (last?.elapsedSeconds != null) {
      elapsedSeconds = Math.max(elapsedSeconds, last.elapsedSeconds);
    }
  }
  if (elapsedSeconds === 0 && sessionMeta.sessionAt) {
    const startMs = parseSessionStartMs(sessionMeta.sessionAt);
    if (startMs != null) {
      elapsedSeconds = Math.max(0, Math.min((Date.now() - startMs) / 1000, ELMS_RACE_DURATION_SECONDS));
    }
  }

  return {
    data: {
      session,
      cars,
      lapsByCar,
      raceControl,
      elapsedSeconds,
      retired: {},
    },
    limitations,
  };
}
