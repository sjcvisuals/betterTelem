"use client";

import type { ReactNode } from "react";
import type { RaceSnapshot } from "@/lib/race/types";
import { DemoControls } from "./demo-controls";
import { ProvenanceFooter } from "./provenance-footer";
import { RaceHeader } from "./race-header";
import { useRaceControls, useSnapshot } from "./race-provider";

/**
 * Shared page frame: demo/live controls, race header, loading and error
 * states. Children render the page-specific content from the snapshot.
 */
export function DashboardShell({
  children,
}: {
  children: (snapshot: RaceSnapshot) => ReactNode;
}) {
  const controls = useRaceControls();
  const { data, error, isLoading, isError, refetch } = useSnapshot();

  return (
    <div className="space-y-4">
      <DemoControls scenarios={data?.demoScenarios ?? null} />

      {controls.mode === "LIVE" &&
        (controls.liveSelection.sessionId == null ||
          controls.liveSelection.eventId == null) && (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
            Select an ELMS season, event and session to follow live timing — or switch
            back to DEMO mode for the simulated race.
          </div>
        )}

      {isLoading && (
        <div
          className="animate-pulse rounded-xl border border-line bg-surface p-6 text-sm text-muted"
          role="status"
        >
          Loading race data…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm" role="alert">
          <p className="font-semibold">Could not load race data</p>
          <p className="mt-1 text-muted">{error?.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface"
          >
            Retry
          </button>
        </div>
      )}

      {data?.limitations && data.limitations.length > 0 && (
        <div className="rounded-xl border border-flag-yellow/40 bg-flag-yellow/10 p-3 text-sm">
          {data.limitations.map((limitation) => (
            <p key={limitation}>{limitation}</p>
          ))}
        </div>
      )}

      {data && (
        <>
          <RaceHeader snapshot={data.snapshot} />
          {children(data.snapshot)}
        </>
      )}

      <ProvenanceFooter />
    </div>
  );
}
