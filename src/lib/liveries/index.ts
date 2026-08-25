import type { Livery, ResolvedIdentity, TeamIdentity } from "./types";

/**
 * Colour notes keyed to the 2025 Spa ELMS entry list.
 * Primary source: Racing Sports Cars Car Appearance table for Le Mans 2025
 * Test (https://www.racingsportscars.com/entry/appearance/Le_Mans-2025-06-01.html)
 * — same team/number pairs where they overlap. ELMS-only cars use the same
 * RSC colour language from paddock photos / well-known team identities.
 * Official photos each weekend: ELMS Spotter Guide PDF on the race page.
 */

const L = {
  yellowGreen: {
    base: "#F0C800",
    accent: "#2F9B32",
    pattern: "split-h",
    number: "#111",
    look: "yellow and green prototype",
  },
  greenYellow: {
    base: "#2F9B32",
    accent: "#F0C800",
    pattern: "split-h",
    number: "#fff",
    look: "green and yellow prototype",
  },
  panis: {
    base: "#E6B800",
    accent: "#6B1C2A",
    tertiary: "#111111",
    pattern: "tri",
    number: "#fff",
    look: "gold / maroon / black prototype",
  },
  nielsen: {
    base: "#003DA5",
    accent: "#E31C23",
    pattern: "stripe",
    number: "#fff",
    look: "blue with a red stripe",
  },
  idecOrange: {
    base: "#FF5A00",
    accent: "#111111",
    pattern: "split-h",
    number: "#fff",
    look: "orange and black prototype",
  },
  idecRed: {
    base: "#C8102E",
    accent: "#1A1A1A",
    pattern: "split-h",
    number: "#fff",
    look: "red and black prototype",
  },
  clx: {
    base: "#F4F6F8",
    accent: "#003DA5",
    tertiary: "#C8102E",
    pattern: "tri",
    number: "#111",
    look: "white with blue and red",
  },
  pureRx: {
    base: "#C5CCD3",
    accent: "#2A2E35",
    tertiary: "#4AA3D9",
    pattern: "tri",
    number: "#111",
    look: "silver / grey / black with light blue",
  },
  vector: {
    base: "#111111",
    accent: "#00A651",
    pattern: "stripe",
    number: "#fff",
    look: "black with a green stripe",
  },
  ironLynxP2: {
    base: "#FFD100",
    accent: "#111111",
    pattern: "split-h",
    number: "#111",
    look: "yellow and black prototype",
  },
  duqueine: {
    base: "#0055A4",
    accent: "#F4F6F8",
    tertiary: "#C8102E",
    pattern: "tri",
    number: "#fff",
    look: "blue / white / red prototype",
  },
  aprDark: {
    base: "#0D1117",
    accent: "#1E4E9C",
    pattern: "split-h",
    number: "#fff",
    look: "black and blue prototype",
  },
  aprCrowd: {
    base: "#5B2A86",
    accent: "#C8102E",
    tertiary: "#F05A1A",
    pattern: "tri",
    number: "#fff",
    look: "purple / red / orange prototype",
  },
  united: {
    base: "#0A1F44",
    accent: "#C8102E",
    tertiary: "#F4F6F8",
    pattern: "tri",
    number: "#fff",
    look: "dark blue / red / white prototype",
  },
  unitedPapaya: {
    base: "#FF6A00",
    accent: "#111111",
    pattern: "split-h",
    number: "#fff",
    look: "papaya-orange McLaren",
  },
  aoTf: {
    base: "#5B2A86",
    accent: "#F05A1A",
    tertiary: "#E6B800",
    pattern: "tri",
    number: "#fff",
    look: "violet with orange and yellow",
  },
  afCorseP2: {
    base: "#C9A227",
    accent: "#111111",
    tertiary: "#C8102E",
    pattern: "tri",
    number: "#111",
    look: "gold / black / red prototype",
  },
  tds: {
    base: "#C4D600",
    accent: "#111111",
    tertiary: "#1E4E9C",
    pattern: "tri",
    number: "#111",
    look: "lime green / black / blue prototype",
  },
  protonP2: {
    base: "#F4F6F8",
    accent: "#8A8F98",
    tertiary: "#F05A1A",
    pattern: "tri",
    number: "#111",
    look: "white / grey / orange prototype",
  },
  dkr: {
    base: "#FF6B00",
    accent: "#4A4F57",
    pattern: "split-h",
    number: "#fff",
    look: "orange and grey",
  },
  virage: {
    base: "#F4F6F8",
    accent: "#C8102E",
    pattern: "stripe",
    number: "#111",
    look: "white with a red stripe",
  },
  rlr: {
    base: "#111111",
    accent: "#F4F6F8",
    tertiary: "#C8102E",
    pattern: "tri",
    number: "#fff",
    look: "black / white / red prototype",
  },
  euroint: {
    base: "#C8102E",
    accent: "#F4F6F8",
    pattern: "split-h",
    number: "#fff",
    look: "red and white Ligier",
  },
  mRacing: {
    base: "#111111",
    accent: "#E6B800",
    pattern: "stripe",
    number: "#fff",
    look: "black with a gold stripe",
  },
  ultimate: {
    base: "#C8102E",
    accent: "#F4F6F8",
    pattern: "nose",
    number: "#fff",
    look: "red with a white nose",
  },
  rinaldi: {
    base: "#F0C800",
    accent: "#111111",
    pattern: "split-v",
    number: "#111",
    look: "yellow and black (split down the middle)",
  },
  lemanGreen: {
    base: "#1B4D2E",
    accent: "#111111",
    tertiary: "#E6B800",
    pattern: "tri",
    number: "#fff",
    look: "dark green Aston with yellow",
  },
  ironLynxGt: {
    base: "#C5CCD3",
    accent: "#111111",
    tertiary: "#C8102E",
    pattern: "tri",
    number: "#111",
    look: "silver AMG with black and red",
  },
  kesselLime: {
    base: "#B8D432",
    accent: "#111111",
    pattern: "split-h",
    number: "#111",
    look: "lime-green Ferrari",
  },
  kesselRed: {
    base: "#C8102E",
    accent: "#E6B800",
    pattern: "stripe",
    number: "#fff",
    look: "red Ferrari with a gold stripe",
  },
  ironDames: {
    base: "#F7F4F0",
    accent: "#E6007A",
    pattern: "nose",
    number: "#111",
    look: "white Porsche with a pink nose",
  },
  richardMille: {
    base: "#F4F6F8",
    accent: "#003DA5",
    tertiary: "#C8102E",
    pattern: "tri",
    number: "#111",
    look: "white / blue / red Ferrari",
  },
  afCorseRed: {
    base: "#CC1E1E",
    accent: "#E6B800",
    tertiary: "#111111",
    pattern: "tri",
    number: "#fff",
    look: "rosso-red Ferrari with yellow and black",
  },
  grRacing: {
    base: "#003DA5",
    accent: "#F4F6F8",
    pattern: "split-h",
    number: "#fff",
    look: "blue and white Ferrari",
  },
  tfSport: {
    base: "#F7D117",
    accent: "#111111",
    pattern: "split-h",
    number: "#111",
    look: "Corvette yellow and black",
  },
  spiritOfRace: {
    base: "#C8102E",
    accent: "#F4F6F8",
    pattern: "stripe",
    number: "#fff",
    look: "red Ferrari with a white stripe",
  },
  jmw: {
    base: "#C8102E",
    accent: "#F4F6F8",
    tertiary: "#003DA5",
    pattern: "tri",
    number: "#fff",
    look: "red / white / blue Ferrari",
  },
  protonGt: {
    base: "#F4F6F8",
    accent: "#C8102E",
    pattern: "stripe",
    number: "#111",
    look: "white Porsche with a red stripe",
  },
} as const satisfies Record<string, Livery>;

const TEAMS: Record<string, TeamIdentity> = {
  "inter europol competition": {
    initials: "IEC",
    crestBg: "#F0C800",
    crestFg: "#16351A",
    defaultLivery: L.yellowGreen,
  },
  "vds panis racing": {
    initials: "VDS",
    crestBg: "#6B1C2A",
    crestFg: "#E6B800",
    defaultLivery: L.panis,
  },
  "nielsen racing": {
    initials: "NR",
    crestBg: "#003DA5",
    crestFg: "#fff",
    defaultLivery: L.nielsen,
  },
  "idec sport": {
    initials: "IDEC",
    crestBg: "#FF5A00",
    crestFg: "#fff",
    defaultLivery: L.idecOrange,
  },
  "clx motorsport": {
    initials: "CLX",
    crestBg: "#003DA5",
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
    crestBg: "#111111",
    crestFg: "#00A651",
    defaultLivery: L.vector,
  },
  "iron lynx - proton": {
    initials: "ILP",
    crestBg: "#111111",
    crestFg: "#FFD100",
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
    crestBg: "#0055A4",
    crestFg: "#fff",
    defaultLivery: L.duqueine,
  },
  "algarve pro racing": {
    initials: "APR",
    crestBg: "#0D1117",
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
    crestBg: "#CC1E1E",
    crestFg: "#fff",
    defaultLivery: L.afCorseRed,
  },
  "tds racing": {
    initials: "TDS",
    crestBg: "#C4D600",
    crestFg: "#111",
    defaultLivery: L.tds,
  },
  "proton competition": {
    initials: "PR",
    crestBg: "#F4F6F8",
    crestFg: "#C8102E",
    defaultLivery: L.protonGt,
  },
  "dkr engineering": {
    initials: "DKR",
    crestBg: "#FF6B00",
    crestFg: "#fff",
    defaultLivery: L.dkr,
  },
  "team virage": {
    initials: "VIR",
    crestBg: "#C8102E",
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
    crestBg: "#C8102E",
    crestFg: "#fff",
    defaultLivery: L.euroint,
  },
  "m racing": {
    initials: "MR",
    crestBg: "#111111",
    crestFg: "#E6B800",
    defaultLivery: L.mRacing,
  },
  ultimate: {
    initials: "ULT",
    crestBg: "#C8102E",
    crestFg: "#fff",
    defaultLivery: L.ultimate,
  },
  "wtm by rinaldi racing": {
    initials: "WTM",
    crestBg: "#F0C800",
    crestFg: "#111",
    defaultLivery: L.rinaldi,
  },
  "racing spirit of leman": {
    initials: "RSL",
    crestBg: "#1B4D2E",
    crestFg: "#E6B800",
    defaultLivery: L.lemanGreen,
  },
  "kessel racing": {
    initials: "KES",
    crestBg: "#C8102E",
    crestFg: "#E6B800",
    defaultLivery: L.kesselRed,
  },
  "iron dames": {
    initials: "ID",
    crestBg: "#E6007A",
    crestFg: "#fff",
    defaultLivery: L.ironDames,
  },
  "richard mille af corse": {
    initials: "RM",
    crestBg: "#003DA5",
    crestFg: "#fff",
    defaultLivery: L.richardMille,
  },
  "gr racing": {
    initials: "GR",
    crestBg: "#003DA5",
    crestFg: "#fff",
    defaultLivery: L.grRacing,
  },
  "tf sport": {
    initials: "TF",
    crestBg: "#F7D117",
    crestFg: "#111",
    defaultLivery: L.tfSport,
  },
  "spirit of race": {
    initials: "SoR",
    crestBg: "#C8102E",
    crestFg: "#fff",
    defaultLivery: L.spiritOfRace,
  },
  "jmw motorsport": {
    initials: "JMW",
    crestBg: "#003DA5",
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

/** Stable fallback colours when a team isn't in the documented palette. */
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
    look: "undocumented team — generated colours",
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
