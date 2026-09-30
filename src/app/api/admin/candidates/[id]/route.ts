import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { notifyAdminChange } from "@/lib/socket-notify";
import type { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdateCandidateBody {
  name?: unknown;
  class?: unknown;
  photo?: unknown;
  vision?: unknown;
  mission?: unknown;
  color?: unknown;
  order?: unknown;
  isPair?: unknown;
  partnerName?: unknown;
  partnerClass?: unknown;
  partnerPhoto?: unknown;
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

// PUT /api/admin/candidates/[id]  body: partial candidate fields
export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const { id } = await ctx.params;
    const body = (await req.json()) as UpdateCandidateBody;

    const data: Record<string, unknown> = {};
    if (isString(body.name)) data.name = body.name.trim();
    if (isString(body.class)) data.class = body.class.trim();
    if (isString(body.photo)) data.photo = body.photo;
    if (isString(body.vision)) data.vision = body.vision;
    if (isString(body.mission)) data.mission = body.mission;
    if (isString(body.color)) data.color = body.color;
    if (isNumber(body.order)) data.order = Math.floor(body.order);
    if (isBoolean(body.isPair)) data.isPair = body.isPair;
    if (isString(body.partnerName)) data.partnerName = body.partnerName.trim();
    if (isString(body.partnerClass)) data.partnerClass = body.partnerClass.trim();
    if (isString(body.partnerPhoto)) data.partnerPhoto = body.partnerPhoto;

    if (data.isPair === false) {
      // Clear wakil fields when toggled off.
      data.partnerName = "";
      data.partnerClass = "";
      data.partnerPhoto = "";
    }

    const candidate = await db.candidate.update({
      where: { id },
      data,
    });

    await notifyAdminChange();

    return NextResponse.json(serialize(candidate));
  } catch (err) {
    console.error("[PUT /api/admin/candidates/[id]] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/candidates/[id]
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const { id } = await ctx.params;
    await db.candidate.delete({ where: { id } });

    await notifyAdminChange();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/candidates/[id]] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
