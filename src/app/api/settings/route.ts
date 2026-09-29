import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

function serialize(s: {
  schoolName: string;
  schoolLogo: string;
  electionTitle: string;
  electionDescription: string;
  isActive: boolean;
  startTime: Date | null;
  endTime: Date | null;
  totalVoters: number;
}): Settings {
  return {
    schoolName: s.schoolName,
    schoolLogo: s.schoolLogo,
    electionTitle: s.electionTitle,
    electionDescription: s.electionDescription,
    isActive: s.isActive,
    startTime: s.startTime ? s.startTime.toISOString() : null,
    endTime: s.endTime ? s.endTime.toISOString() : null,
    totalVoters: s.totalVoters,
  };
}

// GET /api/settings → return the single Settings row (id="default").
// If the row does not exist yet, create it with schema defaults first.
export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await db.settings.create({ data: { id: "default" } });
    }
    return NextResponse.json(serialize(settings));
  } catch (err) {
    console.error("[GET /api/settings] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
