"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RaceSnapshot } from "@/lib/race/types";

/**
 * Client-side race state: DEMO vs LIVE mode, the demo replay clock and the
 * live session selection. The demo clock lives on the client so the server
 * stays stateless: every poll asks for a snapshot at a specific race time.
 */

export const DEMO_DEFAULT_T = 5400;
export const DEMO_DEFAULT_SPEED = 15;
const DEMO_POLL_MS = 5000;
const LIVE_POLL_MS = 15000;

export interface DemoScenarioInfo {
  id: string;
  label: string;
  description: string;
  t: number;
  stale?: boolean;
}

interface DemoClock {
  anchorT: number;
  anchorMs: number;
  speed: number;
  paused: boolean;
  stale: boolean;
  /** Changes whenever the clock jumps, forcing an immediate refetch. */
  jumpKey: number;
}

export interface LiveSelection {
  eventId: number | null;
  sessionId: number | null;
}

interface RaceControls {
  mode: "DEMO" | "LIVE";
  setMode: (mode: "DEMO" | "LIVE") => void;
  demoClock: DemoClock;
  demoTimeNow: () => number;
  jumpToScenario: (scenario: DemoScenarioInfo) => void;
  setSpeed: (speed: number) => void;
  togglePause: () => void;
  liveSelection: LiveSelection;
  setLiveSelection: (selection: LiveSelection) => void;
}

const RaceControlsContext = createContext<RaceControls | null>(null);

export function useRaceControls(): RaceControls {
  const value = useContext(RaceControlsContext);
  if (!value) throw new Error("useRaceControls must be used inside RaceProvider");
  return value;
}

function computeDemoT(clock: DemoClock): number {
  if (clock.paused || clock.stale) return clock.anchorT;
  const wallSeconds = (Date.now() - clock.anchorMs) / 1000;
  return Math.min(clock.anchorT + wallSeconds * clock.speed, 4 * 3600 + 300);
}

export function RaceProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            staleTime: 2000,
          },
        },
      }),
  );

  const [mode, setMode] = useState<"DEMO" | "LIVE">("DEMO");
  const [demoClock, setDemoClock] = useState<DemoClock>(() => ({
    anchorT: DEMO_DEFAULT_T,
    anchorMs: Date.now(),
    speed: DEMO_DEFAULT_SPEED,
    paused: false,
    stale: false,
    jumpKey: 0,
  }));
  const [liveSelection, setLiveSelection] = useState<LiveSelection>({
    eventId: null,
    sessionId: null,
  });

  const demoTimeNow = useCallback(() => computeDemoT(demoClock), [demoClock]);

  const jumpToScenario = useCallback((scenario: DemoScenarioInfo) => {
    setDemoClock((previous) => ({
      ...previous,
      anchorT: scenario.t,
      anchorMs: Date.now(),
      stale: scenario.stale ?? false,
      paused: false,
      jumpKey: previous.jumpKey + 1,
    }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setDemoClock((previous) => ({
      ...previous,
      anchorT: computeDemoT(previous),
      anchorMs: Date.now(),
      speed,
      jumpKey: previous.jumpKey + 1,
    }));
  }, []);

  const togglePause = useCallback(() => {
    setDemoClock((previous) => ({
      ...previous,
      anchorT: computeDemoT(previous),
      anchorMs: Date.now(),
      paused: !previous.paused,
      jumpKey: previous.jumpKey + 1,
    }));
  }, []);

  const value = useMemo<RaceControls>(
    () => ({
      mode,
      setMode,
      demoClock,
      demoTimeNow,
      jumpToScenario,
      setSpeed,
      togglePause,
      liveSelection,
      setLiveSelection,
    }),
    [mode, demoClock, demoTimeNow, jumpToScenario, setSpeed, togglePause, liveSelection],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RaceControlsContext.Provider value={value}>{children}</RaceControlsContext.Provider>
    </QueryClientProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
/* ------------------------------------------------------------------ */

export interface SnapshotResponse {
  snapshot: RaceSnapshot;
  limitations: string[];
  demoScenarios: DemoScenarioInfo[] | null;
}

function buildParams(controls: RaceControls): URLSearchParams {
  const params = new URLSearchParams();
  if (controls.mode === "DEMO") {
    params.set("mode", "demo");
    params.set("t", String(Math.round(controls.demoTimeNow())));
    if (controls.demoClock.stale) params.set("stale", "1");
  } else {
    params.set("mode", "live");
    if (controls.liveSelection.eventId != null) {
      params.set("event", String(controls.liveSelection.eventId));
    }
    if (controls.liveSelection.sessionId != null) {
      params.set("session", String(controls.liveSelection.sessionId));
    }
  }
  return params;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function useSnapshot() {
  const controls = useRaceControls();
  const enabled =
    controls.mode === "DEMO" ||
    (controls.liveSelection.eventId != null && controls.liveSelection.sessionId != null);

  return useQuery<SnapshotResponse, Error>({
    queryKey: [
      "snapshot",
      controls.mode,
      controls.mode === "DEMO" ? controls.demoClock.jumpKey : controls.liveSelection,
    ],
    queryFn: () => fetchJson<SnapshotResponse>(`/api/snapshot?${buildParams(controls)}`),
    enabled,
    refetchInterval:
      controls.mode === "DEMO"
        ? controls.demoClock.paused || controls.demoClock.stale
          ? false
          : DEMO_POLL_MS
        : LIVE_POLL_MS,
    placeholderData: (previous) => previous,
  });
}

export interface CarDetailResponse {
  detail: {
    carNumber: string;
    lapChart: {
      lapNumber: number;
      lapTimeSeconds: number | null;
      flag: string;
      endedInPit: boolean;
      driverName: string | null;
    }[];
    gapToClassLeader: { lapNumber: number; gapSeconds: number }[];
    positionHistory: { lapNumber: number; classPosition: number }[];
    stints: {
      stintNumber: number;
      startLap: number;
      endLap: number;
      lapCount: number;
      driverName: string | null;
      averagePaceSeconds: number | null;
      inProgress: boolean;
    }[];
    events: RaceSnapshot["timeline"];
    summary: string;
  };
  state: RaceSnapshot["cars"][number] | null;
  session: RaceSnapshot["session"];
  dataSource: "DEMO" | "LIVE";
}

export function useCarDetail(carNumber: string) {
  const controls = useRaceControls();
  const enabled =
    controls.mode === "DEMO" ||
    (controls.liveSelection.eventId != null && controls.liveSelection.sessionId != null);

  return useQuery<CarDetailResponse, Error>({
    queryKey: [
      "car",
      carNumber,
      controls.mode,
      controls.mode === "DEMO" ? controls.demoClock.jumpKey : controls.liveSelection,
    ],
    queryFn: () =>
      fetchJson<CarDetailResponse>(
        `/api/car/${encodeURIComponent(carNumber)}?${buildParams(controls)}`,
      ),
    enabled,
    refetchInterval:
      controls.mode === "DEMO"
        ? controls.demoClock.paused || controls.demoClock.stale
          ? false
          : DEMO_POLL_MS
        : LIVE_POLL_MS,
    placeholderData: (previous) => previous,
  });
}
