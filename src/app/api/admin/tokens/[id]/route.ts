import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { notifyAdminChange } from "@/lib/socket-notify";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/tokens/[id]
// Deletes a single voter. Refuses to delete a voter that has already voted.
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const { id } = await ctx.params;

    const voter = await db.voter.findUnique({ where: { id } });
    if (!voter) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 404 },
      );
    }
    if (voter.hasVoted) {
      return NextResponse.json(
        { error: "Token yang sudah digunakan untuk memilih tidak dapat dihapus" },
        { status: 400 },
      );
    }

    await db.voter.delete({ where: { id } });

    await notifyAdminChange();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/tokens/[id]] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
