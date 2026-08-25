import type { TicketPerk, TrackEvent } from "./types";

/**
 * 2026 ELMS remaining race weekends.
 * Session times: official ELMS race pages (track timezone).
 * Ticket "you get" summaries: official ELMS ticket news + circuit ticket pages.
 * Support-series clock times are often unpublished until the weekend PDF.
 */

const ALL_PERKS: TicketPerk[] = [
  "paddock",
  "grandstands",
  "fanZone",
  "pitWalk",
  "mainStraightWalk",
  "autograph",
  "gridWalk",
  "vipView",
];

export const TICKET_PERK_LABEL: Record<TicketPerk, string> = {
  paddock: "Paddock (walk among the trucks)",
  grandstands: "Grandstands",
  fanZone: "Fan zone",
  pitWalk: "Pit walk (pit lane, cars in garages)",
  mainStraightWalk: "Main-straight walk (on the track)",
  autograph: "Driver autograph session",
  gridWalk: "Grid walk (on the grid just before the start)",
  vipView: "VIP / tower viewing",
};

export function allTicketPerks(): TicketPerk[] {
  return ALL_PERKS;
}

export const TRACK_EVENTS: TrackEvent[] = [
  {
    id: "silverstone-2026",
    name: "Goodyear 4 Hours of Silverstone",
    circuit: "Silverstone Circuit",
    location: "Silverstone, United Kingdom",
    timezone: "Europe/London",
    startDate: "2026-09-11",
    endDate: "2026-09-13",
    raceDate: "2026-09-13",
    status: "upcoming",
    officialPage: "https://www.europeanlemansseries.com/en/race/goodyear-4-hours-of-silverstone-2026",
    ticketsUrl: "https://www.silverstone.co.uk/events/european-le-mans-series",
    ticketsLabel: "Buy on Silverstone’s official shop",
    timetableNote:
      "ELMS session times are from the official race page (UK time). Michelin Le Mans Cup, Ligier European Series and Eurocup-3 also run this weekend — their exact start times land in the circuit timetable PDF closer to the event.",
    spotterGuideNote:
      "The ELMS race page publishes a Spotter Guide PDF under Practical information. That is the best photo of how each car looks this weekend. In-app colours follow the Racing Sports Cars appearance table (same numbers/teams where they overlap).",
    childrenFree: "Children under 16 go free with a paying adult.",
    days: [
      {
        date: "2026-09-11",
        weekday: "Friday",
        headline: "Practice day",
        items: [
          { start: "10:55", series: "ELMS", title: "Free Practice 1", certainty: "FACT" },
          {
            start: null,
            series: "Le Mans Cup",
            title: "Practice sessions",
            certainty: "TBC",
          },
          {
            start: null,
            series: "Ligier European Series",
            title: "Practice sessions",
            certainty: "TBC",
          },
          {
            start: null,
            series: "Eurocup-3",
            title: "Support sessions",
            certainty: "TBC",
          },
          {
            start: "16:15",
            series: "ELMS",
            title: "Bronze driver collective test",
            certainty: "FACT",
          },
          {
            start: "18:50",
            series: "Charity",
            title: "ELMS Charity Run (one lap of Silverstone)",
            certainty: "FACT",
          },
        ],
      },
      {
        date: "2026-09-12",
        weekday: "Saturday",
        headline: "Qualifying day — pit walk & main-straight walk",
        items: [
          { start: "09:55", series: "ELMS", title: "Free Practice 2", certainty: "FACT" },
          {
            start: null,
            series: "Le Mans Cup",
            title: "Qualifying + race",
            certainty: "TBC",
          },
          {
            start: null,
            series: "Ligier European Series",
            title: "Qualifying + races",
            certainty: "TBC",
          },
          { start: "14:55", series: "ELMS", title: "Qualifying — LMGT3", certainty: "FACT" },
          { start: "15:20", series: "ELMS", title: "Qualifying — LMP3", certainty: "FACT" },
          { start: "15:45", series: "ELMS", title: "Qualifying — LMP2 Pro/Am", certainty: "FACT" },
          { start: "16:10", series: "ELMS", title: "Qualifying — LMP2", certainty: "FACT" },
        ],
      },
      {
        date: "2026-09-13",
        weekday: "Sunday",
        headline: "Race day",
        items: [
          {
            start: null,
            series: "Eurocup-3",
            title: "Support races",
            certainty: "TBC",
          },
          { start: "12:00", series: "ELMS", title: "Goodyear 4 Hours of Silverstone", certainty: "FACT" },
        ],
      },
    ],
    tickets: [
      {
        id: "fri",
        name: "Friday ticket",
        fromPrice: "£20 advance / £25 on the day",
        days: "Friday only",
        youGet:
          "Grandstands, paddock and fan zone for practice day. You watch ELMS FP1, the bronze test, and Friday support races. You do not get the pit walk — that is Saturday.",
        notIncluded: "Pit walk, main-straight walk, autographs, grid walk",
        perks: ["paddock", "grandstands", "fanZone"],
      },
      {
        id: "sat",
        name: "Saturday ticket",
        fromPrice: "£27 advance / £32 on the day",
        days: "Saturday only",
        youGet:
          "Grandstands, paddock and fan zone for qualifying day, plus the pit walk and main-straight walk (you stand in the pit lane and on the start/finish straight while the cars are in the garages). This is the ticket people buy when they want to see the cars up close without staying all weekend.",
        notIncluded: "Race day, autograph session, grid walk (those need Weekend / Platinum)",
        perks: ["paddock", "grandstands", "fanZone", "pitWalk", "mainStraightWalk"],
      },
      {
        id: "sun",
        name: "Sunday ticket",
        fromPrice: "£30 advance / £35 on the day",
        days: "Sunday only",
        youGet:
          "Grandstands, paddock and fan zone for race day — the 4-hour ELMS race at noon. No pit walk (that already happened Saturday).",
        notIncluded: "Pit walk, main-straight walk, autographs, grid walk",
        perks: ["paddock", "grandstands", "fanZone"],
      },
      {
        id: "weekend",
        name: "Weekend ticket",
        fromPrice: "£45 advance / £50 on the day",
        days: "Friday–Sunday",
        youGet:
          "All three days: practice, qualifying and the race, plus Saturday’s pit walk and main-straight walk. Best value if you are staying more than one day.",
        notIncluded: "Autograph session and grid walk — add Platinum",
        perks: ["paddock", "grandstands", "fanZone", "pitWalk", "mainStraightWalk"],
        recommended: true,
      },
      {
        id: "platinum",
        name: "Weekend + Platinum",
        fromPrice: "Weekend + £10",
        days: "Friday–Sunday",
        youGet:
          "Everything in the weekend ticket, plus the extras people usually mean by “VIP-lite”: driver autograph session, Sunday pit walk, and the grid walk — you walk the starting grid minutes before the 4-hour race, next to the cars and drivers. This is the one if you want photos on the grid.",
        perks: [
          "paddock",
          "grandstands",
          "fanZone",
          "pitWalk",
          "mainStraightWalk",
          "autograph",
          "gridWalk",
        ],
      },
    ],
  },
  {
    id: "portimao-2026",
    name: "4 Hours of Portimão",
    circuit: "Autódromo Internacional do Algarve",
    location: "Portimão, Portugal",
    timezone: "Europe/Lisbon",
    startDate: "2026-10-08",
    endDate: "2026-10-10",
    raceDate: "2026-10-10",
    status: "upcoming",
    officialPage: "https://www.europeanlemansseries.com/en/race/4-hours-of-portimao-2026",
    ticketsUrl: "https://webook.com/en/page/european-le-mans-series-2026",
    ticketsLabel: "Buy on the official Portimão ticket page",
    timetableNote:
      "Race day is Saturday 10 October (unusual — most ELMS races are Sunday). Exact ELMS clock times are still TBC on the official race page. Michelin Le Mans Cup and Ligier European Series support this weekend.",
    spotterGuideNote:
      "When published, the Spotter Guide PDF on the ELMS Portimão race page is the photo reference for liveries that weekend.",
    childrenFree: "Accompanied children under 16 go free.",
    days: [
      {
        date: "2026-10-08",
        weekday: "Thursday",
        headline: "First practice (times TBC)",
        items: [
          { start: null, series: "ELMS", title: "Free Practice 1", certainty: "TBC" },
          { start: null, series: "ELMS", title: "Bronze driver collective test", certainty: "TBC" },
          { start: null, series: "Le Mans Cup", title: "Practice", certainty: "TBC" },
          { start: null, series: "Ligier European Series", title: "Practice", certainty: "TBC" },
        ],
      },
      {
        date: "2026-10-09",
        weekday: "Friday",
        headline: "Qualifying day — pit walk & main-straight walk",
        items: [
          { start: null, series: "ELMS", title: "Free Practice 2", certainty: "TBC" },
          { start: null, series: "ELMS", title: "Qualifying — LMGT3 / LMP3 / LMP2 Pro/Am / LMP2", certainty: "TBC" },
          { start: null, series: "Le Mans Cup", title: "Qualifying + race", certainty: "TBC" },
          { start: null, series: "Ligier European Series", title: "Qualifying + races", certainty: "TBC" },
        ],
      },
      {
        date: "2026-10-10",
        weekday: "Saturday",
        headline: "Race day (Saturday, not Sunday)",
        items: [
          { start: null, series: "ELMS", title: "4 Hours of Portimão", certainty: "TBC" },
        ],
      },
    ],
    tickets: [
      {
        id: "sat",
        name: "Saturday race-day ticket",
        fromPrice: "€8",
        days: "Saturday only",
        youGet:
          "Grandstands and paddock for race day. Cheapest way in — you see the 4-hour race, not Friday qualifying or the pit walk.",
        notIncluded: "Friday, pit walk, autographs, grid walk, VIP tower",
        perks: ["paddock", "grandstands"],
      },
      {
        id: "discovery",
        name: "Discovery (Fri + Sat)",
        fromPrice: "€10",
        days: "Friday + Saturday",
        youGet:
          "Grandstands and paddock both days, plus Friday’s pit walk and main-straight walk. This is the “I want to see the cars in the lane and still watch the race” ticket. Only €2 more than race day alone.",
        notIncluded: "Autograph session, grid walk, VIP tower",
        perks: ["paddock", "grandstands", "pitWalk", "mainStraightWalk"],
        recommended: true,
      },
      {
        id: "premium",
        name: "Premium",
        fromPrice: "€25",
        days: "Friday + Saturday",
        youGet:
          "Everything in Discovery, plus the driver autograph session. Buy this if you want a signature and a photo with a driver — not if you only want to walk the pits (Discovery already includes that).",
        notIncluded: "Grid walk, VIP tower",
        perks: ["paddock", "grandstands", "pitWalk", "mainStraightWalk", "autograph"],
      },
      {
        id: "platinum",
        name: "Platinum",
        fromPrice: "€30",
        days: "Friday + Saturday",
        youGet:
          "Everything in Premium, plus the grid walk just before the start. The extra €5 vs Premium is specifically for standing on the grid with the cars and drivers in the minutes before the race.",
        notIncluded: "VIP tower",
        perks: ["paddock", "grandstands", "pitWalk", "mainStraightWalk", "autograph", "gridWalk"],
      },
      {
        id: "vip",
        name: "VIP Tower",
        fromPrice: "€75",
        days: "Friday + Saturday",
        youGet:
          "A two-day Platinum pass plus access to the VIP Tower — one of the best views at the Algarve circuit. This is the sit-down hospitality-style option.",
        perks: [
          "paddock",
          "grandstands",
          "pitWalk",
          "mainStraightWalk",
          "autograph",
          "gridWalk",
          "vipView",
        ],
      },
    ],
  },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Format YYYY-MM-DD from the ISO string itself so timezones cannot shift the day. */
export function formatIsoDay(iso: string, withYear = false): string {
  const [year, month, day] = iso.split("-");
  const label = `${Number(day)} ${MONTHS[Number(month) - 1]}`;
  return withYear ? `${label} ${year}` : label;
}

export function formatEventDateRange(event: Pick<TrackEvent, "startDate" | "endDate">): string {
  return `${formatIsoDay(event.startDate)} – ${formatIsoDay(event.endDate, true)}`;
}

/**
 * Optional `?asOf=YYYY-MM-DD` preview clock. Noon UTC keeps the civil date stable
 * in European circuit timezones.
 */
export function parseGuideDate(isoDate: string | null | undefined): Date | undefined {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return undefined;
  const parsed = new Date(`${isoDate}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function dateStampInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function eventStatus(event: TrackEvent, now = new Date()): TrackEvent["status"] {
  const today = dateStampInTimeZone(now, event.timezone);
  if (today > event.endDate) return "past";
  if (today >= event.startDate && today <= event.endDate) return "this-weekend";
  return "upcoming";
}

export function eventsWithStatus(now = new Date()): TrackEvent[] {
  return TRACK_EVENTS.map((event) => ({ ...event, status: eventStatus(event, now) }));
}

export function upcomingEvents(now = new Date()): TrackEvent[] {
  return eventsWithStatus(now).filter((e) => e.status !== "past");
}

export function eventById(id: string, now = new Date()): TrackEvent | undefined {
  return eventsWithStatus(now).find((e) => e.id === id);
}

/** The ELMS round whose local dates include today — used to auto-load the YouTube stream. */
export function broadcastEventFor(now = new Date()): TrackEvent | undefined {
  return eventsWithStatus(now).find((event) => event.status === "this-weekend");
}
