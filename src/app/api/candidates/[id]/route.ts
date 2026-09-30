import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

// GET /api/candidates/[id] → single candidate (404 if not found).
export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const candidate = await db.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return NextResponse.json(
        { error: "Calon tidak ditemukan" },
        { status: 404 },
      );
    }
    return NextResponse.json(serialize(candidate));
  } catch (err) {
    console.error("[GET /api/candidates/[id]] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
