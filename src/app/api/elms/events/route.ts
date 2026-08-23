import { NextRequest, NextResponse } from "next/server";
import { listEvents, listSeasons, OpenWecError } from "@/lib/openwec/client";

export const dynamic = "force-dynamic";

/** Lists ELMS events for a season (public OpenWEC data), for the live-mode picker. */
export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  try {
    if (!yearParam) {
      const seasons = await listSeasons("ELMS");
      return NextResponse.json({
        seasons: seasons
          .map((s) => s.year)
          .sort((a, b) => b - a)
          .slice(0, 8),
      });
    }
    const year = Number(yearParam);
    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "Invalid year." }, { status: 400 });
    }
    const events = await listEvents("ELMS", year);
    return NextResponse.json({
      events: events.map((e) => ({ id: e.id, name: e.name, round: e.round })),
    });
  } catch (error) {
    if (error instanceof OpenWecError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
