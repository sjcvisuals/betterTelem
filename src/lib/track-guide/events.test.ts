import { describe, expect, it } from "vitest";
import { eventStatus, upcomingEvents, TRACK_EVENTS, TICKET_PERK_LABEL } from "./events";

describe("track guide events", () => {
  it("treats Silverstone as upcoming and Portimão as later when today is 25 Aug 2026", () => {
    const now = new Date("2026-08-25T12:00:00Z");
    const upcoming = upcomingEvents(now);
    expect(upcoming.map((e) => e.id)).toEqual(["silverstone-2026", "portimao-2026"]);
    expect(eventStatus(TRACK_EVENTS[0], now)).toBe("upcoming");
  });

  it("marks Silverstone as this-weekend during 11–13 Sep 2026", () => {
    expect(eventStatus(TRACK_EVENTS[0], new Date("2026-09-12T12:00:00Z"))).toBe("this-weekend");
    expect(eventStatus(TRACK_EVENTS[0], new Date("2026-09-14T12:00:00Z"))).toBe("past");
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
