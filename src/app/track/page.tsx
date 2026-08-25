import { TrackGuide } from "@/components/track-guide";
import { ProvenanceFooter } from "@/components/provenance-footer";
import { parseGuideDate } from "@/lib/track-guide";

export default async function TrackHelperPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { asOf } = await searchParams;
  const now = parseGuideDate(asOf);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-spotlight/30 bg-gradient-to-r from-spotlight/15 to-transparent px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-spotlight">
          At the circuit
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Track helper</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          For people at an ELMS race weekend: what is on track today, when it starts, and which
          ticket actually includes the pit walk vs the grid walk.
        </p>
      </header>
      <TrackGuide now={now} />
      <ProvenanceFooter />
    </div>
  );
}
