/**
 * Simplified liveries for spotting cars on the broadcast.
 *
 * OpenWEC does not provide logos or car photos. These palettes are
 * approximations of publicly documented 2025 ELMS team colours (not official
 * artwork) so a viewer can match "the yellow-and-green prototype" to #43
 * without hunting for a number.
 */

export type LiveryPattern = "solid" | "split-h" | "split-v" | "stripe" | "tri" | "nose";

export interface Livery {
  /** Primary body colour. */
  base: string;
  /** Second colour (stripe, split, or nose). */
  accent: string;
  /** Optional third band for tri-colour schemes. */
  tertiary?: string;
  pattern: LiveryPattern;
  /** Number colour chosen for contrast against the livery. */
  number: string;
}

export interface TeamIdentity {
  /** Short crest letters, e.g. "IEC". */
  initials: string;
  crestBg: string;
  crestFg: string;
  /** Used when a car has no per-number override. */
  defaultLivery: Livery;
}

export interface ResolvedIdentity {
  carNumber: string;
  team: string;
  initials: string;
  crestBg: string;
  crestFg: string;
  livery: Livery;
  /** True when this came from the 2025 palette rather than a generated fallback. */
  documented: boolean;
}
