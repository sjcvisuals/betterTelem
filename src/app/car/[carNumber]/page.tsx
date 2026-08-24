"use client";

import Link from "next/link";
import { use } from "react";
import { GapChart, LapTimeChart, PositionChart } from "@/components/car-charts";
import { DemoControls } from "@/components/demo-controls";
import { EventCard } from "@/components/event-feed";
import { ProvenanceFooter } from "@/components/provenance-footer";
import { useCarDetail, useSnapshot } from "@/components/race-provider";
import { Card, ClassBadge } from "@/components/ui";
import { LiveryChip, TeamCrest, identityFor } from "@/components/livery";
import { formatGap, formatLapTime } from "@/lib/race/format";

export default function CarPage({ params }: { params: Promise<{ carNumber: string }> }) {
  const { carNumber } = use(params);
  const snapshotQuery = useSnapshot();
  const { data, error, isLoading } = useCarDetail(carNumber);

  return (
    <div className="space-y-4">
      <DemoControls scenarios={snapshotQuery.data?.demoScenarios ?? null} />
      <Link href="/live" className="inline-block text-sm text-muted hover:text-foreground">
        ← Back to live dashboard
      </Link>

      {isLoading && (
        <div className="animate-pulse rounded-xl border border-line bg-surface p-6 text-sm text-muted" role="status">
          Loading car data…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm" role="alert">
          {error.message}
        </div>
      )}

      {data && data.state && (
        <>
          <header className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-4">
              <TeamCrest
                identity={identityFor(data.state.carNumber, data.state.team)}
                size={56}
                title={`${data.state.team} crest`}
              />
              <LiveryChip carNumber={data.state.carNumber} team={data.state.team} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold sm:text-2xl">{data.state.team}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <ClassBadge className={data.state.className} />
                  {data.state.vehicle && <span>{data.state.vehicle}</span>}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {data.state.drivers.map((d) => `${d.firstName} ${d.lastName}`).join(" • ")}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="tabular text-3xl font-black">
                  {data.state.retired
                    ? "OUT"
                    : data.state.classPosition != null
                      ? `P${data.state.classPosition}`
                      : "—"}
                </p>
                <p className="text-xs uppercase tracking-widest text-muted">
                  {data.state.className}
                  {data.state.overallPosition != null && !data.state.retired && (
                    <> • P{data.state.overallPosition} overall</>
                  )}
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-surface-raised p-3 text-sm leading-relaxed">
              {data.detail.summary}
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Last lap" value={formatLapTime(data.state.lastLapSeconds)} mono />
            <Stat label="Recent pace" value={formatLapTime(data.state.recentPaceSeconds)} mono />
            <Stat label="Best lap" value={formatLapTime(data.state.bestLapSeconds)} mono />
            <Stat
              label="Gap to class leader"
              value={
                data.state.classPosition === 1
                  ? "Leader"
                  : data.state.lapsBehindClassLeader > 0
                    ? `${data.state.lapsBehindClassLeader} laps`
                    : formatGap(data.state.gapToClassLeaderSeconds)
              }
              mono
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Lap times" subtitle="Green-flag running (pit in-laps excluded, yellow dots = out-laps after a stop).">
              <LapTimeChart detail={data.detail} />
            </Card>
            <Card title="Gap to class leader" subtitle="Lower is closer to the front of the class.">
              <GapChart detail={data.detail} />
            </Card>
            <Card title="Class position history">
              <PositionChart detail={data.detail} />
            </Card>
            <Card title="Stints & pit stops" subtitle="Average pace uses representative green-flag laps in each stint.">
              <ol className="space-y-1.5">
                {data.detail.stints.map((stint) => (
                  <li
                    key={stint.stintNumber}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm"
                  >
                    <span className="font-bold">S{stint.stintNumber}</span>
                    <span className="min-w-0">
                      <span className="block truncate">
                        Laps {stint.startLap}–{stint.endLap}
                        {stint.inProgress && (
                          <span className="ml-1.5 text-xs font-semibold text-flag-green">
                            IN PROGRESS
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted">{stint.driverName ?? "—"}</span>
                    </span>
                    <span className="tabular text-right text-xs text-muted">
                      {stint.lapCount} laps
                      {stint.averagePaceSeconds != null && (
                        <> • avg {formatLapTime(stint.averagePaceSeconds)}</>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <Card title="Events involving this car">
            {data.detail.events.length === 0 ? (
              <p className="text-sm text-muted">No notable events yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {[...data.detail.events].reverse().map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <ProvenanceFooter />
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${mono ? "tabular" : ""}`}>{value}</p>
    </div>
  );
}
