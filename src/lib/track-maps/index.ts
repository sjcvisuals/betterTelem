/**
 * Track outline registry. Each outline is a stylized (not surveyed) SVG
 * path of the circuit: the path starts at the start/finish line and runs
 * in race direction, so "fraction of lap completed" maps directly to
 * a distance along the path via getPointAtLength.
 *
 * Outlines are added per circuit as ELMS visits them; circuits without an
 * outline degrade gracefully in the UI.
 */

export interface TrackOutline {
  id: string;
  displayName: string;
  viewBox: string;
  /** Closed SVG path starting at start/finish, in race direction. */
  path: string;
  /** Where to draw pit-lane dots (stylized pit area). */
  pitPoint: { x: number; y: number };
  /** Label anchor for the start/finish marker. */
  startFinishAngleDeg: number;
  /** Notable corner labels to help viewers orient themselves. */
  landmarks: { label: string; x: number; y: number }[];
}

const SPA: TrackOutline = {
  id: "spa",
  displayName: "Circuit de Spa-Francorchamps (stylized)",
  viewBox: "0 0 900 660",
  path: [
    "M 185 150",
    "L 340 88",
    "C 370 76, 392 84, 388 104",
    "C 385 118, 370 126, 352 120",
    "L 240 200",
    "C 222 212, 208 224, 216 240",
    "C 224 254, 240 260, 258 256",
    "L 720 140",
    "C 748 133, 768 140, 766 158",
    "C 764 170, 752 176, 742 180",
    "C 762 200, 782 240, 792 280",
    "C 800 312, 796 334, 774 340",
    "C 752 346, 728 340, 706 352",
    "C 660 376, 612 396, 576 424",
    "C 548 446, 548 470, 566 482",
    "C 590 498, 622 502, 646 518",
    "C 668 532, 690 542, 700 556",
    "C 706 572, 692 586, 668 584",
    "L 420 566",
    "C 330 556, 268 512, 232 452",
    "C 204 402, 190 348, 184 300",
    "L 180 230",
    "C 178 214, 170 208, 176 196",
    "C 182 186, 176 178, 178 168",
    "L 185 150",
    "Z",
  ].join(" "),
  pitPoint: { x: 248, y: 148 },
  startFinishAngleDeg: -22,
  landmarks: [
    { label: "La Source", x: 420, y: 78 },
    { label: "Eau Rouge", x: 148, y: 248 },
    { label: "Kemmel", x: 490, y: 172 },
    { label: "Les Combes", x: 802, y: 148 },
    { label: "Rivage", x: 828, y: 342 },
    { label: "Pouhon", x: 500, y: 452 },
    { label: "Stavelot", x: 738, y: 588 },
    { label: "Blanchimont", x: 128, y: 400 },
  ],
};

const OUTLINES: TrackOutline[] = [SPA];

/**
 * Finds the outline for a circuit / event name, e.g. "Spa-Francorchamps"
 * (demo) or "SPA FRANCORCHAMPS" (OpenWEC event name).
 */
export function trackOutlineFor(circuitName: string | null | undefined): TrackOutline | null {
  if (!circuitName) return null;
  const normalized = circuitName.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.includes("spa")) return SPA;
  return OUTLINES.find((o) => normalized.includes(o.id)) ?? null;
}
