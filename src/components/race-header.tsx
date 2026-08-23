"use client";

import type { RaceSnapshot } from "@/lib/race/types";
import { formatClock } from "@/lib/race/format";
import { FlagBadge } from "./ui";

export function RaceHeader({ snapshot }: { snapshot: RaceSnapshot }) {
  const stale = snapshot.feedStatus === "STALE";
  const ended = snapshot.feedStatus === "ENDED";

  return (
    <header
      className="rounded-xl border border-line bg-surface p-4 sm:p-5"
      aria-label="Race status"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {snapshot.session.seriesName} • {snapshot.session.sessionName}
            {snapshot.dataSource === "DEMO" && (
              <span
                className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent"
                title="Simulated race for development and demonstration"
              >
                DEMO DATA
              </span>
            )}
          </p>
          <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">
            {snapshot.session.eventName}
          </h1>
          <p className="mt-0.5 text-sm text-muted">{snapshot.session.circuit}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <FlagBadge flag={snapshot.currentFlag} large />
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Elapsed
              </p>
              <p className="tabular text-lg font-semibold">
                {formatClock(snapshot.elapsedSeconds)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Remaining
              </p>
              <p className="tabular text-lg font-semibold">
                {ended ? "0:00:00" : formatClock(snapshot.remainingSeconds)}
              </p>
            </div>
            {snapshot.leaderLap != null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Leader lap
                </p>
                <p className="tabular text-lg font-semibold">{snapshot.leaderLap}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs text-muted">
        <span
          className="inline-flex items-center gap-1.5"
          role="status"
          aria-live="polite"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{
              background: stale
                ? "var(--flag-red)"
                : ended
                  ? "var(--muted)"
                  : "var(--flag-green)",
            }}
          />
          {stale
            ? "TIMING FEED STALE — data may be out of date"
            : ended
              ? "Session ended"
              : "Feed live"}
        </span>
        {snapshot.secondsSinceLastData != null && snapshot.secondsSinceLastData > 30 && (
          <span>Last timing data {Math.round(snapshot.secondsSinceLastData)}s ago</span>
        )}
        <span className="ml-auto">
          Updated {new Date(snapshot.generatedAtMs).toLocaleTimeString()}
        </span>
      </div>

      {stale && (
        <div
          className="mt-3 rounded-lg border border-flag-red/40 bg-flag-red/10 px-3 py-2 text-sm"
          role="alert"
        >
          The timing feed has stopped updating. Positions and gaps shown are the last
          known values, not the current state of the race.
        </div>
      )}
    </header>
  );
}
