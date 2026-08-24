import { describe, expect, it } from "vitest";
import {
  groupLapsByCar,
  normalizeFlag,
  parseElapsed,
  parseSessionStartMs,
} from "./normalize";
import type { Lap } from "@/lib/race/types";

describe("normalizeFlag", () => {
  it("maps common OpenWEC flag strings", () => {
    expect(normalizeFlag("GF")).toBe("GREEN");
    expect(normalizeFlag("green")).toBe("GREEN");
    expect(normalizeFlag("FCY")).toBe("FCY");
    expect(normalizeFlag("FULL COURSE YELLOW")).toBe("FCY");
    expect(normalizeFlag("SC")).toBe("SC");
    expect(normalizeFlag("Safety Car")).toBe("SC");
    expect(normalizeFlag("RED")).toBe("RED");
    expect(normalizeFlag("CHK")).toBe("CHEQUERED");
    expect(normalizeFlag("YF")).toBe("YELLOW");
    expect(normalizeFlag(null)).toBe("UNKNOWN");
    expect(normalizeFlag("???")).toBe("UNKNOWN");
  });
});

describe("parseElapsed", () => {
  it("parses h:mm:ss.fff, mm:ss.fff and plain seconds", () => {
    expect(parseElapsed("1:23:45.678")).toBeCloseTo(5025.678, 3);
    expect(parseElapsed("23:45.678")).toBeCloseTo(1425.678, 3);
    expect(parseElapsed("95.5")).toBeCloseTo(95.5, 3);
  });

  it("rejects garbage", () => {
    expect(parseElapsed("")).toBeNull();
    expect(parseElapsed(null)).toBeNull();
    expect(parseElapsed("abc")).toBeNull();
    expect(parseElapsed("1:aa:00")).toBeNull();
  });
});

describe("parseSessionStartMs", () => {
  it("parses OpenWEC's space-separated timestamps with bare +00 offsets", () => {
    // Real format from GET /sessions: "2025-08-24 13:00:00+00"
    expect(parseSessionStartMs("2025-08-24 13:00:00+00")).toBe(
      Date.parse("2025-08-24T13:00:00Z"),
    );
    expect(parseSessionStartMs("2025-08-24T13:00:00+02:00")).toBe(
      Date.parse("2025-08-24T13:00:00+02:00"),
    );
  });

  it("returns null for missing or invalid input", () => {
    expect(parseSessionStartMs(null)).toBeNull();
    expect(parseSessionStartMs("")).toBeNull();
    expect(parseSessionStartMs("not a date")).toBeNull();
  });
});

describe("groupLapsByCar", () => {
  function lap(carNumber: string, lapNumber: number, time: number | null, elapsed: number | null): Lap {
    return {
      carNumber,
      lapNumber,
      lapTimeSeconds: time,
      flag: "GREEN",
      endedInPit: false,
      pitTimeSeconds: null,
      driverName: null,
      elapsedSeconds: elapsed,
    };
  }

  it("groups, sorts and derives missing elapsed from lap times", () => {
    const grouped = groupLapsByCar([
      lap("7", 2, 101, null), // elapsed derivable: 100 + 101
      lap("7", 1, 100, null),
      lap("8", 1, 90, 90),
    ]);
    expect(Object.keys(grouped).sort()).toEqual(["7", "8"]);
    expect(grouped["7"].map((l) => l.lapNumber)).toEqual([1, 2]);
    expect(grouped["7"][0].elapsedSeconds).toBeCloseTo(100, 5);
    expect(grouped["7"][1].elapsedSeconds).toBeCloseTo(201, 5);
  });

  it("resynchronizes on explicit elapsed after a missing lap time", () => {
    const grouped = groupLapsByCar([
      lap("7", 1, 100, null),
      lap("7", 2, null, null), // unknown time: chain broken
      lap("7", 3, 100, 320), // explicit elapsed resyncs
      lap("7", 4, 100, null), // derived from 320
    ]);
    expect(grouped["7"][1].elapsedSeconds).toBeNull();
    expect(grouped["7"][3].elapsedSeconds).toBeCloseTo(420, 5);
  });
});
