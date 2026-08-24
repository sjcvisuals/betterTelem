import type { Livery, ResolvedIdentity, TeamIdentity } from "./types";

/**
 * 2025 ELMS colour notes, keyed to the Spa round entry list.
 * Sources: Racing Sports Cars Le Mans 2025 appearance table (same teams /
 * numbers where they overlap) plus well-known ELMS team identities.
 * These are simplified palettes, not licensed artwork.
 */

const L = {
  yellowGreen: { base: "#E8C21A", accent: "#2F7A32", pattern: "split-h", number: "#111" },
  greenYellow: { base: "#2F7A32", accent: "#E8C21A", pattern: "split-h", number: "#fff" },
  panis: { base: "#E3B505", accent: "#6B1C2A", tertiary: "#1A1A1A", pattern: "tri", number: "#fff" },
  nielsen: { base: "#1B4F9C", accent: "#C41E3A", pattern: "stripe", number: "#fff" },
  idecOrange: { base: "#F05A1A", accent: "#111111", pattern: "split-h", number: "#fff" },
  idecRed: { base: "#C41E3A", accent: "#1A1A1A", pattern: "split-h", number: "#fff" },
  clx: { base: "#F4F6F8", accent: "#1A4B8C", tertiary: "#C41E3A", pattern: "tri", number: "#111" },
  pureRx: { base: "#C5CCD3", accent: "#2A2E35", tertiary: "#4AA3D9", pattern: "tri", number: "#111" },
  vector: { base: "#121512", accent: "#3D8B4A", pattern: "stripe", number: "#fff" },
  ironLynxP2: { base: "#E3B505", accent: "#111111", pattern: "split-h", number: "#111" },
  duqueine: { base: "#1B3A8C", accent: "#F4F6F8", tertiary: "#C41E3A", pattern: "tri", number: "#fff" },
  aprDark: { base: "#12151C", accent: "#2A6BB5", pattern: "split-h", number: "#fff" },
  aprCrowd: { base: "#2A1B6E", accent: "#C41E3A", tertiary: "#F05A1A", pattern: "tri", number: "#fff" },
  united: { base: "#14213D", accent: "#C41E3A", tertiary: "#F4F6F8", pattern: "tri", number: "#fff" },
  unitedPapaya: { base: "#FF6A00", accent: "#111111", pattern: "split-h", number: "#fff" },
  aoTf: { base: "#5B2A86", accent: "#F05A1A", tertiary: "#E3B505", pattern: "tri", number: "#fff" },
  afCorseP2: { base: "#C9A227", accent: "#111111", tertiary: "#C41E3A", pattern: "tri", number: "#111" },
  tds: { base: "#8FDB3A", accent: "#111111", tertiary: "#2A6BB5", pattern: "tri", number: "#111" },
  protonP2: { base: "#F4F6F8", accent: "#8A8F98", tertiary: "#F05A1A", pattern: "tri", number: "#111" },
  dkr: { base: "#F05A1A", accent: "#4A4F57", pattern: "split-h", number: "#fff" },
  virage: { base: "#F4F6F8", accent: "#C41E3A", pattern: "stripe", number: "#111" },
  rlr: { base: "#111111", accent: "#F4F6F8", tertiary: "#C41E3A", pattern: "tri", number: "#fff" },
  euroint: { base: "#C41E3A", accent: "#F4F6F8", pattern: "split-h", number: "#fff" },
  mRacing: { base: "#111111", accent: "#E3B505", pattern: "stripe", number: "#fff" },
  ultimate: { base: "#C41E3A", accent: "#F4F6F8", pattern: "nose", number: "#fff" },
  rinaldi: { base: "#E3B505", accent: "#111111", pattern: "split-v", number: "#111" },
  lemanGreen: { base: "#1B4D2E", accent: "#111111", tertiary: "#E3B505", pattern: "tri", number: "#fff" },
  ironLynxGt: { base: "#C5CCD3", accent: "#111111", tertiary: "#C41E3A", pattern: "tri", number: "#111" },
  kesselLime: { base: "#8FDB3A", accent: "#111111", pattern: "split-h", number: "#111" },
  kesselRed: { base: "#C41E3A", accent: "#E3B505", pattern: "stripe", number: "#fff" },
  ironDames: { base: "#F4F6F8", accent: "#E85A9B", pattern: "nose", number: "#111" },
  richardMille: { base: "#F4F6F8", accent: "#1B3A8C", tertiary: "#C41E3A", pattern: "tri", number: "#111" },
  afCorseRed: { base: "#C41E3A", accent: "#E3B505", tertiary: "#111111", pattern: "tri", number: "#fff" },
  grRacing: { base: "#1B3A8C", accent: "#F4F6F8", pattern: "split-h", number: "#fff" },
  tfSport: { base: "#E3B505", accent: "#111111", pattern: "split-h", number: "#111" },
  spiritOfRace: { base: "#C41E3A", accent: "#F4F6F8", pattern: "stripe", number: "#fff" },
  jmw: { base: "#C41E3A", accent: "#F4F6F8", tertiary: "#1B3A8C", pattern: "tri", number: "#fff" },
  protonGt: { base: "#F4F6F8", accent: "#C41E3A", pattern: "stripe", number: "#111" },
} as const satisfies Record<string, Livery>;

const TEAMS: Record<string, TeamIdentity> = {
  "inter europol competition": {
    initials: "IEC",
    crestBg: "#E8C21A",
    crestFg: "#16351A",
    defaultLivery: L.yellowGreen,
  },
  "vds panis racing": {
    initials: "VDS",
    crestBg: "#6B1C2A",
    crestFg: "#E3B505",
    defaultLivery: L.panis,
  },
  "nielsen racing": {
    initials: "NR",
    crestBg: "#1B4F9C",
    crestFg: "#fff",
    defaultLivery: L.nielsen,
  },
  "idec sport": {
    initials: "IDEC",
    crestBg: "#F05A1A",
    crestFg: "#fff",
    defaultLivery: L.idecOrange,
  },
  "clx motorsport": {
    initials: "CLX",
    crestBg: "#1A4B8C",
    crestFg: "#fff",
    defaultLivery: L.clx,
  },
  "clx - pure rxcing": {
    initials: "RX",
    crestBg: "#2A2E35",
    crestFg: "#4AA3D9",
    defaultLivery: L.pureRx,
  },
  "vector sport": {
    initials: "VEC",
    crestBg: "#121512",
    crestFg: "#3D8B4A",
    defaultLivery: L.vector,
  },
  "iron lynx - proton": {
    initials: "ILP",
    crestBg: "#111111",
    crestFg: "#E3B505",
    defaultLivery: L.ironLynxP2,
  },
  "iron lynx": {
    initials: "IL",
    crestBg: "#C5CCD3",
    crestFg: "#111",
    defaultLivery: L.ironLynxGt,
  },
  "duqueine team": {
    initials: "DUQ",
    crestBg: "#1B3A8C",
    crestFg: "#fff",
    defaultLivery: L.duqueine,
  },
  "algarve pro racing": {
    initials: "APR",
    crestBg: "#12151C",
    crestFg: "#6AA4E0",
    defaultLivery: L.aprDark,
  },
  "united autosports": {
    initials: "UA",
    crestBg: "#FF6A00",
    crestFg: "#111",
    defaultLivery: L.united,
  },
  "ao by tf": {
    initials: "AO",
    crestBg: "#5B2A86",
    crestFg: "#F05A1A",
    defaultLivery: L.aoTf,
  },
  "af corse": {
    initials: "AF",
    crestBg: "#C41E3A",
    crestFg: "#fff",
    defaultLivery: L.afCorseRed,
  },
  "tds racing": {
    initials: "TDS",
    crestBg: "#8FDB3A",
    crestFg: "#111",
    defaultLivery: L.tds,
  },
  "proton competition": {
    initials: "PR",
    crestBg: "#F4F6F8",
    crestFg: "#C41E3A",
    defaultLivery: L.protonGt,
  },
  "dkr engineering": {
    initials: "DKR",
    crestBg: "#F05A1A",
    crestFg: "#fff",
    defaultLivery: L.dkr,
  },
  "team virage": {
    initials: "VIR",
    crestBg: "#C41E3A",
    crestFg: "#fff",
    defaultLivery: L.virage,
  },
  "rlr m sport": {
    initials: "RLR",
    crestBg: "#111111",
    crestFg: "#fff",
    defaultLivery: L.rlr,
  },
  eurointernational: {
    initials: "EI",
    crestBg: "#C41E3A",
    crestFg: "#fff",
    defaultLivery: L.euroint,
  },
  "m racing": {
    initials: "MR",
    crestBg: "#111111",
    crestFg: "#E3B505",
    defaultLivery: L.mRacing,
  },
  ultimate: {
    initials: "ULT",
    crestBg: "#C41E3A",
    crestFg: "#fff",
    defaultLivery: L.ultimate,
  },
  "wtm by rinaldi racing": {
    initials: "WTM",
    crestBg: "#E3B505",
    crestFg: "#111",
    defaultLivery: L.rinaldi,
  },
  "racing spirit of leman": {
    initials: "RSL",
    crestBg: "#1B4D2E",
    crestFg: "#E3B505",
    defaultLivery: L.lemanGreen,
  },
  "kessel racing": {
    initials: "KES",
    crestBg: "#C41E3A",
    crestFg: "#E3B505",
    defaultLivery: L.kesselRed,
  },
  "iron dames": {
    initials: "ID",
    crestBg: "#E85A9B",
    crestFg: "#fff",
    defaultLivery: L.ironDames,
  },
  "richard mille af corse": {
    initials: "RM",
    crestBg: "#1B3A8C",
    crestFg: "#fff",
    defaultLivery: L.richardMille,
  },
  "gr racing": {
    initials: "GR",
    crestBg: "#1B3A8C",
    crestFg: "#fff",
    defaultLivery: L.grRacing,
  },
  "tf sport": {
    initials: "TF",
    crestBg: "#E3B505",
    crestFg: "#111",
    defaultLivery: L.tfSport,
  },
  "spirit of race": {
    initials: "SoR",
    crestBg: "#C41E3A",
    crestFg: "#fff",
    defaultLivery: L.spiritOfRace,
  },
  "jmw motorsport": {
    initials: "JMW",
    crestBg: "#1B3A8C",
    crestFg: "#fff",
    defaultLivery: L.jmw,
  },
};

/** Per-car overrides where two cars from the same team run different schemes. */
const CARS: Record<string, Livery> = {
  "43": L.greenYellow,
  "34": L.yellowGreen,
  "88": L.yellowGreen,
  "48": L.panis,
  "24": L.nielsen,
  "27": L.nielsen,
  "28": L.idecRed,
  "18": L.idecOrange,
  "47": L.clx,
  "17": L.clx,
  "37": L.pureRx,
  "10": L.vector,
  "9": L.ironLynxP2,
  "30": L.duqueine,
  "25": L.aprDark,
  "20": L.aprCrowd,
  "22": L.united,
  "21": L.united,
  "23": L.unitedPapaya,
  "99": L.aoTf,
  "83": L.afCorseP2,
  "51": L.afCorseRed,
  "50": L.richardMille,
  "29": L.tds,
  "77": L.protonP2,
  "60": L.protonGt,
  "3": L.dkr,
  "4": L.dkr,
  "8": L.virage,
  "15": L.rlr,
  "11": L.euroint,
  "68": L.mRacing,
  "35": L.ultimate,
  "12": L.rinaldi,
  "31": L.lemanGreen,
  "59": L.lemanGreen,
  "63": L.ironLynxGt,
  "57": L.kesselLime,
  "74": L.kesselRed,
  "85": L.ironDames,
  "86": L.grRacing,
  "82": L.tfSport,
  "55": L.spiritOfRace,
  "66": L.jmw,
};

function normalizeTeam(team: string): string {
  return team.trim().toLowerCase().replace(/\s+/g, " ");
}

function initialsFromTeam(team: string): string {
  const words = team
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^(by|the|of|and|team)$/i.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Stable fallback colours when a team isn't in the 2025 palette. */
function generatedLivery(seed: string): Livery {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const hue2 = (hue + 40 + (hash % 80)) % 360;
  return {
    base: `hsl(${hue} 62% 38%)`,
    accent: `hsl(${hue2} 55% 22%)`,
    pattern: "split-h",
    number: "#fff",
  };
}

export function resolveIdentity(carNumber: string, team: string): ResolvedIdentity {
  const teamKey = normalizeTeam(team);
  const knownTeam = TEAMS[teamKey];
  const carLivery = knownTeam ? CARS[carNumber] : undefined;
  const documented = Boolean(knownTeam);
  const livery = carLivery ?? knownTeam?.defaultLivery ?? generatedLivery(`${carNumber}:${teamKey}`);
  return {
    carNumber,
    team,
    initials: knownTeam?.initials ?? initialsFromTeam(team),
    crestBg: knownTeam?.crestBg ?? livery.base,
    crestFg: knownTeam?.crestFg ?? livery.number,
    livery,
    documented,
  };
}
