"use client";

import { Suspense } from "react";
import { BattleView } from "@/components/battle-view";
import { DashboardShell } from "@/components/dashboard-shell";
import { EventFeed } from "@/components/event-feed";
import { StrategyView } from "@/components/strategy-view";
import { StreamEmbed } from "@/components/stream-embed";
import { Timeline } from "@/components/timeline";
import { TimingTower } from "@/components/timing-tower";
import { TrackHelperBanner } from "@/components/track-helper-cta";
import { TrackMap } from "@/components/track-map";
import { useGuideNow } from "@/components/use-guide-now";

function LiveCompanionPanels() {
  const now = useGuideNow();
  return (
    <>
      <TrackHelperBanner now={now} />
      <StreamEmbed now={now} />
    </>
  );
}

export default function LivePage() {
  return (
    <DashboardShell>
      {(snapshot) => (
        <>
          <Suspense
            fallback={
              <>
                <TrackHelperBanner />
                <StreamEmbed />
              </>
            }
          >
            <LiveCompanionPanels />
          </Suspense>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-5">
              <TrackMap snapshot={snapshot} />
              <TimingTower snapshot={snapshot} />
              <Timeline snapshot={snapshot} />
            </div>
            <div className="space-y-5">
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
