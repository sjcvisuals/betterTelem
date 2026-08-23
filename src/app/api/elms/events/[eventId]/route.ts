import { NextRequest, NextResponse } from "next/server";
import { getEventDetail, OpenWecError } from "@/lib/openwec/client";

export const dynamic = "force-dynamic";

/** Event detail with sessions (public OpenWEC data), for the live-mode picker. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const id = Number(eventId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  }
  try {
    const event = await getEventDetail(id);
    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        series: event.series,
        season: event.season,
        sessions: event.sessions.map((s) => ({
          id: s.id,
          name: s.name,
          sessionType: s.session_type,
          sessionAt: s.session_at,
          lapCount: s.lap_count ?? null,
        })),
      },
    });
  } catch (error) {
    if (error instanceof OpenWecError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
