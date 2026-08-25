export function ProvenanceFooter() {
  return (
    <footer className="mt-10 border-t border-white/8 pt-5 text-xs leading-relaxed text-muted">
      <p className="font-semibold uppercase tracking-widest text-foreground">
        About this data
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>
          Timing data comes from{" "}
          <a
            href="https://openwec.com"
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            OpenWEC
          </a>
          . Positions, lap times, pit stops and flag periods are taken directly from that
          feed (or, in demo mode, from a simulated race clearly labeled as demo data).
        </li>
        <li>
          Recent pace, gap trends, pit windows, &ldquo;effective position&rdquo; and the
          projected order after pit cycles are <strong>calculated by this app</strong> and
          labeled TREND or ESTIMATE. They are interpretations, not official timing.
        </li>
        <li>
          Team crests and car colours on the map are <strong>simplified palettes</strong>{" "}
          from the Racing Sports Cars appearance table (and well-known ELMS schemes) —
          not official logos or photographs. The best photo reference is the ELMS
          Spotter Guide PDF on each official race page. They exist so a casual viewer
          can match “the white Porsche with the pink nose” to a car without hunting
          for a number.
        </li>
        <li>
          betterTelem is an independent project. It is not an official European Le Mans
          Series or FIA WEC timing product and is not affiliated with the series
          organisers.
        </li>
      </ul>
    </footer>
  );
}
