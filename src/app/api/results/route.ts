import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeResults } from "@/lib/results";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// GET /api/results → live ElectionResults snapshot.
// If settings.resultsPublic is false, only authenticated panitia may view.
export async function GET(req: NextRequest) {
  try {
    const settings = await db.settings.findUnique({ where: { id: "default" } });
    const resultsPublic = settings?.resultsPublic ?? true;

    if (!resultsPublic) {
      const unauthorized = requireAdmin(req);
      if (unauthorized) {
        return NextResponse.json(
          {
            error: "Hasil pemilihan bersifat privat. Silakan login sebagai panitia.",
            private: true,
          },
          { status: 403 },
        );
      }
    }

    const results = await computeResults();
    return NextResponse.json(results);
  } catch (err) {
    console.error("[GET /api/results] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
