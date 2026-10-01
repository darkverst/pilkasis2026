import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { parseJsonBody } from "@/lib/http";
import { hashPassword, verifyAdminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ChangePasswordBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

// POST /api/admin/password  body: { currentPassword, newPassword }
export async function POST(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const parsed = await parseJsonBody<ChangePasswordBody>(req);
    if (!parsed.ok) return parsed.response;
    const { currentPassword, newPassword } = parsed.data;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json(
        { error: "Password saat ini wajib diisi" },
        { status: 400 },
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 },
      );
    }

    const isValidCurrent = await verifyAdminPassword(currentPassword);
    if (!isValidCurrent) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 },
      );
    }

    const hashed = hashPassword(newPassword);

    await db.settings.upsert({
      where: { id: "default" },
      update: { adminPassword: hashed },
      create: {
        id: "default",
        adminPassword: hashed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password panitia berhasil diperbarui",
    });
  } catch (err) {
    console.error("[POST /api/admin/password] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/password -> Reset back to default password (MGMPINFBWI)
export async function DELETE(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    await db.settings.upsert({
      where: { id: "default" },
      update: { adminPassword: null },
      create: {
        id: "default",
        adminPassword: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password panitia berhasil direset ke default (MGMPINFBWI)",
    });
  } catch (err) {
    console.error("[DELETE /api/admin/password] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
