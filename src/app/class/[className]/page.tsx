"use client";

import Link from "next/link";
import { use } from "react";
import { BattleView } from "@/components/battle-view";
import { DashboardShell } from "@/components/dashboard-shell";
import { EventCard } from "@/components/event-feed";
import { StrategyView } from "@/components/strategy-view";
import { TimingTower } from "@/components/timing-tower";
import { Card } from "@/components/ui";

/**
 * Class-focused second-screen view, e.g. /class/LMP2 or /class/LMGT3.
 * Class names with special characters are URL-encoded (LMP2%20Pro%2FAm).
 */
export default function ClassPage({ params }: { params: Promise<{ className: string }> }) {
  const { className: rawClassName } = use(params);
  const className = decodeURIComponent(rawClassName);

  return (
    <DashboardShell>
      {(snapshot) => {
        if (!snapshot.classNames.includes(className)) {
          return (
            <Card title="Unknown class">
              <p className="text-sm text-muted">
                &ldquo;{className}&rdquo; is not racing in this session. Available:{" "}
                {snapshot.classNames.map((c, i) => (
                  <span key={c}>
                    {i > 0 && ", "}
                    <Link
                      href={`/class/${encodeURIComponent(c)}`}
                      className="text-accent hover:underline"
                    >
                      {c}
                    </Link>
                  </span>
                ))}
              </p>
            </Card>
          );
        }
        const classEvents = snapshot.timeline
          .filter((e) => e.className === className)
          .slice(-10)
          .reverse();
        return (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-4">
              <TimingTower snapshot={snapshot} fixedClass={className} />
            </div>
            <div className="space-y-4">
              <BattleView snapshot={snapshot} className={className} />
              <StrategyView snapshot={snapshot} fixedClass={className} />
              <Card title={`${className} events`}>
                {classEvents.length === 0 ? (
                  <p className="text-sm text-muted">No class events yet.</p>
                ) : (
                  <div className="space-y-2">
                    {classEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
      }}
    </DashboardShell>
  );
}
