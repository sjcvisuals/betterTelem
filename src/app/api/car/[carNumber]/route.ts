import { NextRequest, NextResponse } from "next/server";
import { buildCarDetail } from "@/lib/analytics/car-detail";
import { BadRequestError, resolveRace } from "@/lib/api/resolve";
import { OpenWecError } from "@/lib/openwec/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ carNumber: string }> },
) {
  const { carNumber } = await params;
  try {
    const { data, snapshot } = await resolveRace(request.nextUrl.searchParams);
    const detail = buildCarDetail(data, snapshot, carNumber);
    if (!detail) {
      return NextResponse.json(
        { error: `Car #${carNumber} is not in this session.` },
        { status: 404 },
      );
    }
    const state = snapshot.cars.find((c) => c.carNumber === carNumber) ?? null;
    return NextResponse.json(
      { detail, state, session: snapshot.session, dataSource: snapshot.dataSource },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof OpenWecError) {
      return NextResponse.json({ error: error.message, kind: error.kind }, { status: 502 });
    }
    throw error;
  }
}
