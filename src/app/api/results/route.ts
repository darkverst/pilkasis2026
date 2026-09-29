import { NextResponse } from "next/server";
import { computeResults } from "@/lib/results";

export const dynamic = "force-dynamic";

// GET /api/results → live ElectionResults snapshot.
export async function GET() {
  try {
    const results = await computeResults();
    return NextResponse.json(results);
  } catch (err) {
    console.error("[GET /api/results] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
