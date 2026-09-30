import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getElectionStatus, type ElectionStatus } from "@/lib/election-status";

export const dynamic = "force-dynamic";

interface StatusResponse {
  valid: boolean;
  hasVoted: boolean;
  role: "student" | "teacher";
  voterName: string | null;
  votedAt: string | null;
  election: ElectionStatus;
}

// GET /api/vote/status?token=XXX
// A token is "valid" if it exists in the DB.
// Returns whether the voter has already cast a vote, when, and the current
// election status (so the UI can show whether voting is currently allowed).
export async function GET(req: NextRequest) {
  try {
    const election = await getElectionStatus();

    const token = req.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      const body: StatusResponse = {
        valid: false,
        hasVoted: false,
        role: "student",
        voterName: null,
        votedAt: null,
        election,
      };
      return NextResponse.json(body);
    }

    const voter = await db.voter.findUnique({ where: { token } });

    if (!voter) {
      const body: StatusResponse = {
        valid: false,
        hasVoted: false,
        role: "student",
        voterName: null,
        votedAt: null,
        election,
      };
      return NextResponse.json(body);
    }

    const body: StatusResponse = {
      valid: true,
      hasVoted: voter.hasVoted,
      role: voter.role === "teacher" ? "teacher" : "student",
      voterName: voter.name ?? null,
      votedAt: voter.votedAt ? voter.votedAt.toISOString() : null,
      election,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[GET /api/vote/status] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
