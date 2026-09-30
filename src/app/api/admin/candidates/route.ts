import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { notifyAdminChange } from "@/lib/socket-notify";
import type { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CreateCandidateBody {
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

// POST /api/admin/candidates  body: { name, class, photo, vision, mission, color, order?, isPair?, partnerName?, partnerClass?, partnerPhoto? }
export async function POST(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const body = (await req.json()) as CreateCandidateBody;

    const name = isString(body.name) ? body.name.trim() : "";
    const className = isString(body.class) ? body.class.trim() : "";
    const vision = isString(body.vision) ? body.vision : "";
    const mission = isString(body.mission) ? body.mission : "";
    const color = isString(body.color) ? body.color : "#3b82f6";
    const photo = isString(body.photo) ? body.photo : "";
    const order = isNumber(body.order) ? body.order : 0;
    const isPair = isBoolean(body.isPair) ? body.isPair : false;
    const partnerName = isString(body.partnerName) ? body.partnerName.trim() : "";
    const partnerClass = isString(body.partnerClass) ? body.partnerClass.trim() : "";
    const partnerPhoto = isString(body.partnerPhoto) ? body.partnerPhoto : "";

    if (!name) {
      return NextResponse.json(
        { error: "Nama calon wajib diisi" },
        { status: 400 },
      );
    }
    if (isPair && !partnerName) {
      return NextResponse.json(
        { error: "Nama wakil calon wajib diisi untuk calon berpasangan" },
        { status: 400 },
      );
    }

    const candidate = await db.candidate.create({
      data: {
        name,
        class: className,
        photo,
        vision,
        mission,
        color,
        order,
        isPair,
        partnerName: isPair ? partnerName : "",
        partnerClass: isPair ? partnerClass : "",
        partnerPhoto: isPair ? partnerPhoto : "",
      },
    });

    await notifyAdminChange();

    return NextResponse.json(serialize(candidate), { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/candidates] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
