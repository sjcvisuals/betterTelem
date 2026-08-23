import { NextRequest, NextResponse } from "next/server";
import { BadRequestError, resolveRace } from "@/lib/api/resolve";
import { OpenWecError } from "@/lib/openwec/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { snapshot, limitations, demoScenarios } = await resolveRace(
      request.nextUrl.searchParams,
    );
    return NextResponse.json(
      { snapshot, limitations, demoScenarios },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof OpenWecError) {
      return NextResponse.json(
        { error: error.message, kind: error.kind },
        { status: 502 },
      );
    }
    throw error;
  }
}
