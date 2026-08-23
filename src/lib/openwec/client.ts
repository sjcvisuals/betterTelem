import "server-only";
import { z } from "zod";
import {
  EventDetailSchema,
  EventListSchema,
  PaginatedLapsSchema,
  RaceControlListSchema,
  ResultListSchema,
  SeasonListSchema,
  SeriesListSchema,
  SessionListSchema,
  StintListSchema,
  type LapOut,
} from "./schemas";

/**
 * Server-side OpenWEC client. The API key never leaves the server.
 * See docs/openwec-api.md for endpoint documentation.
 */

const DEFAULT_BASE_URL = "https://api.openwec.com/api/v1";

export class OpenWecError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly kind: "AUTH" | "HTTP" | "NETWORK" | "VALIDATION",
  ) {
    super(message);
    this.name = "OpenWecError";
  }
}

function baseUrl(): string {
  return process.env.OPENWEC_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENWEC_API_KEY);
}

interface FetchOptions {
  protected?: boolean;
  searchParams?: Record<string, string | number | undefined>;
  /** Next.js fetch cache revalidation window in seconds. */
  revalidateSeconds?: number;
}

async function openwecFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options: FetchOptions = {},
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {};
  if (options.protected) {
    const key = process.env.OPENWEC_API_KEY;
    if (!key) {
      throw new OpenWecError(
        "OPENWEC_API_KEY is not configured; protected OpenWEC endpoints are unavailable.",
        null,
        "AUTH",
      );
    }
    headers["X-API-Key"] = key;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      next: { revalidate: options.revalidateSeconds ?? 15 },
    });
  } catch (error) {
    throw new OpenWecError(
      `Network error calling OpenWEC ${path}: ${error instanceof Error ? error.message : String(error)}`,
      null,
      "NETWORK",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new OpenWecError(
      `OpenWEC rejected the API key for ${path} (HTTP ${response.status}).`,
      response.status,
      "AUTH",
    );
  }
  if (!response.ok) {
    throw new OpenWecError(
      `OpenWEC ${path} returned HTTP ${response.status}.`,
      response.status,
      "HTTP",
    );
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new OpenWecError(
      `OpenWEC ${path} response failed validation: ${parsed.error.message}`,
      response.status,
      "VALIDATION",
    );
  }
  return parsed.data;
}

/* Public endpoints */

export function listSeries() {
  return openwecFetch("/series", SeriesListSchema, { revalidateSeconds: 3600 });
}

export function listSeasons(seriesKey: string) {
  return openwecFetch(`/series/${encodeURIComponent(seriesKey)}/seasons`, SeasonListSchema, {
    revalidateSeconds: 3600,
  });
}

export function listEvents(seriesKey: string, year: number) {
  return openwecFetch(
    `/series/${encodeURIComponent(seriesKey)}/seasons/${year}/events`,
    EventListSchema,
    { revalidateSeconds: 3600 },
  );
}

export function listSessions(seriesKey: string, year: number, eventId: number) {
  return openwecFetch(
    `/series/${encodeURIComponent(seriesKey)}/seasons/${year}/events/${eventId}/sessions`,
    SessionListSchema,
    { revalidateSeconds: 300 },
  );
}

export function getEventDetail(eventId: number) {
  return openwecFetch(`/events/${eventId}`, EventDetailSchema, {
    revalidateSeconds: 300,
  });
}

export function getResults(sessionId: number) {
  return openwecFetch(`/sessions/${sessionId}/results`, ResultListSchema, {
    revalidateSeconds: 30,
  });
}

/* Protected endpoints (X-API-Key) */

export async function getAllLaps(sessionId: number): Promise<LapOut[]> {
  const pageSize = 500;
  const laps: LapOut[] = [];
  let page = 1;
  for (;;) {
    const batch = await openwecFetch(`/sessions/${sessionId}/laps`, PaginatedLapsSchema, {
      protected: true,
      searchParams: { page, page_size: pageSize },
      revalidateSeconds: 15,
    });
    laps.push(...batch.results);
    if (laps.length >= batch.total || batch.results.length === 0) break;
    page += 1;
    // Hard safety cap: a 4h ELMS race is < 10k laps total.
    if (page > 40) break;
  }
  return laps;
}

export function getStints(sessionId: number, carClass?: string) {
  return openwecFetch(`/sessions/${sessionId}/stints`, StintListSchema, {
    protected: true,
    searchParams: { car_class: carClass },
    revalidateSeconds: 15,
  });
}

export function getRaceControl(sessionId: number) {
  return openwecFetch(`/sessions/${sessionId}/race-control`, RaceControlListSchema, {
    protected: true,
    revalidateSeconds: 15,
  });
}
