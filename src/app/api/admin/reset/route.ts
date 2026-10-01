import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { parseJsonBody } from "@/lib/http";
import { notifyAdminChange } from "@/lib/socket-notify";

export const dynamic = "force-dynamic";

interface ResetBody {
  confirm?: unknown;
  scope?: unknown;
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isScope(v: unknown): v is "votes" | "all" {
  return v === "votes" || v === "all";
}

// POST /api/admin/reset  body: { confirm: boolean, scope: "votes" | "all" }
// Dangerous — wipes votes (and optionally voters + candidates). Settings preserved.
export async function POST(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const parsed = await parseJsonBody<ResetBody>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    if (!isBoolean(body.confirm) || body.confirm !== true) {
      return NextResponse.json(
        { error: "Konfirmasi reset wajib diisi dengan nilai true" },
        { status: 400 },
      );
    }

    if (!isScope(body.scope)) {
      return NextResponse.json(
        { error: "scope harus berupa 'votes' atau 'all'" },
        { status: 400 },
      );
    }

    if (body.scope === "votes") {
      // Clear the cast votes and re-arm the voters. Voter rows are preserved,
      // but hasVoted/usedToken must be cleared too — otherwise every token stays
      // permanently locked out and nobody can vote after a reset.
      await db.vote.deleteMany({});
      await db.voter.updateMany({
        data: { hasVoted: false, usedToken: false, votedAt: null },
      });
    } else {
      // "all" — order matters because of FK relations: votes → voters → candidates.
      // Settings row is intentionally preserved.
      await db.vote.deleteMany({});
      await db.voter.deleteMany({});
      await db.candidate.deleteMany({});
    }

    await notifyAdminChange();

    return NextResponse.json({ success: true, scope: body.scope });
  } catch (err) {
    console.error("[POST /api/admin/reset] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
