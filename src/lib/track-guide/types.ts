export type TicketPerk =
  | "paddock"
  | "grandstands"
  | "fanZone"
  | "pitWalk"
  | "mainStraightWalk"
  | "autograph"
  | "gridWalk"
  | "vipView";

export interface TicketType {
  id: string;
  name: string;
  /** From-price as published; confirm on the shop. */
  fromPrice: string;
  days: string;
  /** Plain-language: what this ticket actually lets you do. */
  youGet: string;
  /** The thing people usually mix up with a cheaper ticket. */
  notIncluded?: string;
  perks: TicketPerk[];
  recommended?: boolean;
}

export interface ScheduleItem {
  /** Local track time, 24h "HH:MM". Null when the organiser has not published a time yet. */
  start: string | null;
  series: string;
  title: string;
  /** FACT = taken from the official ELMS/circuit page; TBC = support series / unpublished. */
  certainty: "FACT" | "TBC";
}

export interface ScheduleDay {
  date: string;
  weekday: string;
  headline: string;
  items: ScheduleItem[];
}

export interface TrackEvent {
  id: string;
  name: string;
  circuit: string;
  location: string;
  timezone: string;
  /** Inclusive local dates YYYY-MM-DD. */
  startDate: string;
  endDate: string;
  raceDate: string;
  status: "upcoming" | "this-weekend" | "past";
  officialPage: string;
  ticketsUrl: string;
  ticketsLabel: string;
  timetableNote: string;
  spotterGuideNote: string;
  childrenFree: string;
  days: ScheduleDay[];
  tickets: TicketType[];
}
