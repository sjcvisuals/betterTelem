import { TrackGuide } from "@/components/track-guide";
import { ProvenanceFooter } from "@/components/provenance-footer";

export default function TrackHelperPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Track helper</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          For people at an ELMS race weekend: what is on track today, when it starts, and which
          ticket actually includes the pit walk vs the grid walk.
        </p>
      </header>
      <TrackGuide />
      <ProvenanceFooter />
    </div>
  );
}
