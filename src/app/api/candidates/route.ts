import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

function serialize(c: {
  id: string;
  name: string;
  class: string;
  photo: string;
  vision: string;
  mission: string;
  order: number;
  color: string;
  isPair: boolean;
  partnerName: string;
  partnerClass: string;
  partnerPhoto: string;
}): Candidate {
  return {
    id: c.id,
    name: c.name,
    class: c.class,
    photo: c.photo,
    vision: c.vision,
    mission: c.mission,
    order: c.order,
    color: c.color,
    isPair: c.isPair,
    partnerName: c.partnerName,
    partnerClass: c.partnerClass,
    partnerPhoto: c.partnerPhoto,
  };
}

// GET /api/candidates → list of candidates ordered by `order` asc, then `name` asc.
export async function GET() {
  try {
    const candidates = await db.candidate.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(candidates.map(serialize));
  } catch (err) {
    console.error("[GET /api/candidates] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
