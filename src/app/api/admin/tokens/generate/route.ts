import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { parseJsonBody } from "@/lib/http";
import { generateBatch } from "@/lib/auth";
import { notifyAdminChange } from "@/lib/socket-notify";

export const dynamic = "force-dynamic";

interface GenerateBody {
  count?: unknown;
  role?: unknown;
  batch?: unknown;
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isRole(v: unknown): v is "student" | "teacher" {
  return v === "student" || v === "teacher";
}

// POST /api/admin/tokens/generate  body: { count, role, batch? }
// Generates `count` one-time-use tokens and persists matching Voter rows.
export async function POST(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const parsed = await parseJsonBody<GenerateBody>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    let count = isNumber(body.count) ? Math.floor(body.count) : 0;
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return NextResponse.json(
        { error: "count harus berupa bilangan bulat antara 1 dan 500" },
        { status: 400 },
      );
    }

    const role: "student" | "teacher" = isRole(body.role) ? body.role : "student";
    const batch = isString(body.batch) && body.batch.trim() ? body.batch.trim() : null;

    const tokens = generateBatch(count);

    await db.voter.createMany({
      data: tokens.map((token) => ({
        token,
        role,
        batch,
      })),
    });

    await notifyAdminChange();

    return NextResponse.json({ tokens, count: tokens.length });
  } catch (err) {
    console.error("[POST /api/admin/tokens/generate] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
