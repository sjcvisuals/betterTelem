import { describe, expect, it } from "vitest";
import { resolveIdentity } from "./index";

describe("resolveIdentity", () => {
  it("maps documented 2025 cars to distinctive liveries", () => {
    const iec = resolveIdentity("43", "Inter Europol Competition");
    expect(iec.documented).toBe(true);
    expect(iec.initials).toBe("IEC");
    expect(iec.livery.base).toBe("#2F7A32");

    const dames = resolveIdentity("85", "Iron Dames");
    expect(dames.livery.accent).toBe("#E85A9B");
    expect(dames.initials).toBe("ID");

    const panis = resolveIdentity("48", "VDS Panis Racing");
    expect(panis.livery.pattern).toBe("tri");
  });

  it("gives sister cars from the same team different schemes when documented", () => {
    const p2 = resolveIdentity("43", "Inter Europol Competition");
    const sister = resolveIdentity("34", "Inter Europol Competition");
    expect(p2.livery.base).not.toBe(sister.livery.base);
    expect(p2.initials).toBe(sister.initials);
  });

  it("falls back to generated colours for unknown teams without crashing", () => {
    const unknown = resolveIdentity("199", "Brand New Outfit Racing");
    expect(unknown.documented).toBe(false);
    expect(unknown.initials).toBe("BNO");
    expect(unknown.livery.base).toMatch(/^hsl\(/);
    expect(resolveIdentity("199", "Brand New Outfit Racing").livery.base).toBe(unknown.livery.base);
  });
});
