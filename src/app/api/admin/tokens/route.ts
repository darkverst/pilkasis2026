import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import type { VoterInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

function serializeVoter(v: {
  id: string;
  token: string;
  role: string;
  name: string | null;
  hasVoted: boolean;
  votedAt: Date | null;
  batch: string | null;
  createdAt: Date;
}): VoterInfo {
  return {
    id: v.id,
    token: v.token,
    role: v.role === "teacher" ? "teacher" : "student",
    name: v.name,
    hasVoted: v.hasVoted,
    votedAt: v.votedAt ? v.votedAt.toISOString() : null,
    batch: v.batch,
    createdAt: v.createdAt.toISOString(),
  };
}

// GET /api/admin/tokens?role=student|teacher&batch=XXX&unvoted=true&q=search
export async function GET(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const role = req.nextUrl.searchParams.get("role");
    const batch = req.nextUrl.searchParams.get("batch");
    const unvoted = req.nextUrl.searchParams.get("unvoted");
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const where: {
      role?: string;
      batch?: string;
      hasVoted?: boolean;
      OR?: { name?: { contains: string }; token?: { contains: string } }[];
    } = {};
    if (role === "student" || role === "teacher") where.role = role;
    if (batch && batch.trim()) where.batch = batch.trim();
    if (unvoted === "true") where.hasVoted = false;
    // `q` powers a token/name lookup so the committee can find one voter
    // without scanning the full list.
    if (q) where.OR = [{ token: { contains: q } }, { name: { contains: q } }];

    const voters = await db.voter.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(voters.map(serializeVoter));
  } catch (err) {
    console.error("[GET /api/admin/tokens] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
