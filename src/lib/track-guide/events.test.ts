import { describe, expect, it } from "vitest";
import {
  broadcastEventFor,
  eventStatus,
  formatEventDateRange,
  parseGuideDate,
  upcomingEvents,
  TRACK_EVENTS,
  TICKET_PERK_LABEL,
} from "./events";

describe("track guide events", () => {
  it("treats Silverstone as upcoming and Portimão as later when today is 25 Aug 2026", () => {
    const now = new Date("2026-08-25T12:00:00Z");
    const upcoming = upcomingEvents(now);
    expect(upcoming.map((e) => e.id)).toEqual(["silverstone-2026", "portimao-2026"]);
    expect(eventStatus(TRACK_EVENTS[0], now)).toBe("upcoming");
    expect(broadcastEventFor(now)).toBeUndefined();
  });

  it("marks Silverstone as this-weekend during 11–13 Sep 2026", () => {
    expect(eventStatus(TRACK_EVENTS[0], new Date("2026-09-12T12:00:00Z"))).toBe("this-weekend");
    expect(eventStatus(TRACK_EVENTS[0], new Date("2026-09-14T12:00:00Z"))).toBe("past");
    expect(broadcastEventFor(new Date("2026-09-11T12:00:00Z"))?.id).toBe("silverstone-2026");
  });

  it("uses the circuit timezone so Friday morning in the UK is still this-weekend", () => {
    // 00:30 BST on Friday 11 Sep = 23:30 UTC on Thursday 10 Sep.
    const fridayMorningUk = new Date("2026-09-10T23:30:00Z");
    expect(eventStatus(TRACK_EVENTS[0], fridayMorningUk)).toBe("this-weekend");
    expect(broadcastEventFor(fridayMorningUk)?.id).toBe("silverstone-2026");
  });

  it("formats weekend ranges from the ISO strings", () => {
    expect(formatEventDateRange(TRACK_EVENTS[0])).toBe("11 Sep – 13 Sep 2026");
  });

  it("parses asOf preview dates and rejects junk", () => {
    expect(parseGuideDate("2026-09-13")?.toISOString()).toBe("2026-09-13T12:00:00.000Z");
    expect(parseGuideDate("nope")).toBeUndefined();
    expect(parseGuideDate(null)).toBeUndefined();
  });

  it("explains pit walk vs grid walk so ticket types are not confused", () => {
    const silverstone = TRACK_EVENTS[0];
    const sat = silverstone.tickets.find((t) => t.id === "sat");
    const platinum = silverstone.tickets.find((t) => t.id === "platinum");
    expect(sat?.perks).toContain("pitWalk");
    expect(sat?.perks).not.toContain("gridWalk");
    expect(platinum?.perks).toContain("gridWalk");
    expect(sat?.youGet.toLowerCase()).toMatch(/pit walk/);
    expect(platinum?.youGet.toLowerCase()).toMatch(/grid/);
    expect(TICKET_PERK_LABEL.gridWalk).toMatch(/before the start/i);
  });

  it("lists a confirmed Sunday race time for Silverstone", () => {
    const sunday = TRACK_EVENTS[0].days.find((d) => d.weekday === "Sunday");
    const race = sunday?.items.find((i) => i.title.includes("4 Hours"));
    expect(race?.start).toBe("12:00");
    expect(race?.certainty).toBe("FACT");
  });

  it("notes that Portimão races on Saturday not Sunday", () => {
    const portimao = TRACK_EVENTS[1];
    expect(portimao.raceDate).toBe("2026-10-10");
    expect(portimao.days.at(-1)?.weekday).toBe("Saturday");
  });
});
