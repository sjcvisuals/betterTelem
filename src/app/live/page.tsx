"use client";

import { BattleView } from "@/components/battle-view";
import { DashboardShell } from "@/components/dashboard-shell";
import { EventFeed } from "@/components/event-feed";
import { StrategyView } from "@/components/strategy-view";
import { StreamEmbed } from "@/components/stream-embed";
import { Timeline } from "@/components/timeline";
import { TimingTower } from "@/components/timing-tower";
import { TrackMap } from "@/components/track-map";

export default function LivePage() {
  return (
    <DashboardShell>
      {(snapshot) => (
        <>
          <StreamEmbed />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-4">
              <TrackMap snapshot={snapshot} />
              <TimingTower snapshot={snapshot} />
              <Timeline snapshot={snapshot} />
            </div>
            <div className="space-y-4">
              <BattleView snapshot={snapshot} />
              <StrategyView snapshot={snapshot} />
              <EventFeed snapshot={snapshot} />
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
