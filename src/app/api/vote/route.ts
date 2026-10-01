import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notifyVoteCast, maskToken } from "@/lib/socket-notify";
import { getElectionStatus } from "@/lib/election-status";
import { parseJsonBody } from "@/lib/http";

export const dynamic = "force-dynamic";

interface VoteRequestBody {
  token?: unknown;
  candidateId?: unknown;
}

interface CandidatePublic {
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
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function serializeCandidate(c: {
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
}): CandidatePublic {
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

// POST /api/vote  body: { token: string, candidateId: string }
// Cast a vote on behalf of a voter identified by their one-time token.
export async function POST(req: Request) {
  try {
    // Election status gate — reject votes if the election is not currently active.
    const status = await getElectionStatus();
    if (!status.canVote) {
      return NextResponse.json(
        { error: status.label },
        { status: 403 },
      );
    }

    const parsed = await parseJsonBody<VoteRequestBody>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const token = isString(body.token) ? body.token.trim() : "";
    const candidateId = isString(body.candidateId) ? body.candidateId.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Token tidak dikenali" },
        { status: 400 },
      );
    }

    const voter = await db.voter.findUnique({ where: { token } });
    if (!voter) {
      return NextResponse.json(
        { error: "Token tidak dikenali" },
        { status: 400 },
      );
    }
    if (voter.hasVoted) {
      return NextResponse.json(
        { error: "Anda sudah menggunakan hak suara Anda" },
        { status: 400 },
      );
    }

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return NextResponse.json(
        { error: "Calon tidak ditemukan" },
        { status: 400 },
      );
    }

    try {
      await db.$transaction([
        db.vote.create({
          data: {
            candidateId: candidate.id,
            voterId: voter.id,
          },
        }),
        db.voter.update({
          where: { id: voter.id },
          data: {
            hasVoted: true,
            votedAt: new Date(),
            usedToken: true,
          },
        }),
      ]);
    } catch (txErr) {
      // Unique constraint on Vote.voterId = concurrent duplicate vote attempt.
      if (txErr instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 = unique constraint violation
        if (txErr.code === "P2002") {
          return NextResponse.json(
            { error: "Anda sudah menggunakan hak suara Anda" },
            { status: 400 },
          );
        }
      }
      throw txErr;
    }

    // Notify socket.io mini-service (best-effort, never fails the request).
    await notifyVoteCast({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidatePhoto: candidate.photo,
      candidateColor: candidate.color,
      voterTokenMasked: maskToken(voter.token),
      voterRole: voter.role,
    });

    return NextResponse.json({
      success: true,
      message: "Suara Anda berhasil tercatat",
      candidate: serializeCandidate(candidate),
    });
  } catch (err) {
    console.error("[POST /api/vote] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
