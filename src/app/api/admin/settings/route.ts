import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { notifyAdminChange } from "@/lib/socket-notify";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

interface UpdateSettingsBody {
  schoolName?: unknown;
  schoolLogo?: unknown;
  electionTitle?: unknown;
  electionDescription?: unknown;
  isActive?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  totalVoters?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isISODateString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  // Accept ISO 8601 strings; we'll let `new Date()` validate on parse.
  const parsed = new Date(v);
  return !Number.isNaN(parsed.getTime());
}

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

// PUT /api/admin/settings  body: partial settings fields
// Upserts the single Settings row (id="default") with provided fields.
export async function PUT(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const body = (await req.json()) as UpdateSettingsBody;

    const data: Record<string, unknown> = {};
    if (isString(body.schoolName)) data.schoolName = body.schoolName;
    if (isString(body.schoolLogo)) data.schoolLogo = body.schoolLogo;
    if (isString(body.electionTitle)) data.electionTitle = body.electionTitle;
    if (isString(body.electionDescription)) data.electionDescription = body.electionDescription;
    if (isBoolean(body.isActive)) data.isActive = body.isActive;
    if (isNumber(body.totalVoters)) data.totalVoters = Math.floor(body.totalVoters);

    if (body.startTime === null) {
      data.startTime = null;
    } else if (isISODateString(body.startTime)) {
      data.startTime = new Date(body.startTime);
    }
    if (body.endTime === null) {
      data.endTime = null;
    } else if (isISODateString(body.endTime)) {
      data.endTime = new Date(body.endTime);
    }

    // Upsert the single Settings row (id="default"). If it doesn't exist yet,
    // create it with the provided fields plus schema defaults; otherwise update.
    const existing = await db.settings.findUnique({ where: { id: "default" } });
    let settings;
    if (!existing) {
      settings = await db.settings.create({
        data: { id: "default", ...(data as Record<string, never>) },
      });
    } else {
      settings = await db.settings.update({
        where: { id: "default" },
        data: data as Record<string, never>,
      });
    }

    await notifyAdminChange();

    return NextResponse.json(serialize(settings));
  } catch (err) {
    console.error("[PUT /api/admin/settings] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
