/**
 * Simplified liveries for spotting cars on the broadcast.
 *
 * Colour notes follow the Racing Sports Cars "Car Appearance" table
 * (Le Mans 2025 Test, same numbers/teams where they overlap ELMS) plus
 * well-known ELMS-only schemes. Official weekend photos live in the ELMS
 * Spotter Guide PDF on each race page. These palettes are not licensed artwork.
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
  /** Short spotting phrase, e.g. "green/yellow prototype". */
  look: string;
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
  /** True when this came from the documented palette rather than a generated fallback. */
  documented: boolean;
}
