import { describe, expect, it } from "vitest";
import { resolveStreamSource } from "./resolve";

describe("resolveStreamSource", () => {
  it("stays idle off-weekend and names the next round", () => {
    const source = resolveStreamSource(null, new Date("2026-08-25T12:00:00Z"));
    expect(source.mode).toBe("idle");
    if (source.mode === "idle") {
      expect(source.nextEvent?.id).toBe("silverstone-2026");
    }
  });

  it("auto-selects the official live player on a Silverstone race-weekend day", () => {
    const source = resolveStreamSource(null, new Date("2026-09-13T12:00:00Z"));
    expect(source.mode).toBe("official-live");
    if (source.mode === "official-live") {
      expect(source.event.id).toBe("silverstone-2026");
      expect(source.event.name).toMatch(/Silverstone/);
    }
  });

  it("auto-selects Portimão on its Saturday race day", () => {
    const source = resolveStreamSource(null, new Date("2026-10-10T12:00:00Z"));
    expect(source.mode).toBe("official-live");
    if (source.mode === "official-live") {
      expect(source.event.id).toBe("portimao-2026");
    }
  });

  it("lets a pasted video override the official weekend player", () => {
    const source = resolveStreamSource("dQw4w9WgXcQ", new Date("2026-09-13T12:00:00Z"));
    expect(source).toEqual({ mode: "manual", videoId: "dQw4w9WgXcQ" });
  });
});
