import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

interface StatsResponse {
  total: number;
  voted: number;
  unvoted: number;
  students: { total: number; voted: number };
  teachers: { total: number; voted: number };
}

// GET /api/admin/tokens/stats → token participation breakdown
export async function GET(req: NextRequest) {
  try {
    const unauthorized = requireAdmin(req);
    if (unauthorized) return unauthorized;

    const [total, voted, studentTotal, studentVoted, teacherTotal, teacherVoted] =
      await Promise.all([
        db.voter.count(),
        db.voter.count({ where: { hasVoted: true } }),
        db.voter.count({ where: { role: "student" } }),
        db.voter.count({ where: { role: "student", hasVoted: true } }),
        db.voter.count({ where: { role: "teacher" } }),
        db.voter.count({ where: { role: "teacher", hasVoted: true } }),
      ]);

    const body: StatsResponse = {
      total,
      voted,
      unvoted: total - voted,
      students: { total: studentTotal, voted: studentVoted },
      teachers: { total: teacherTotal, voted: teacherVoted },
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[GET /api/admin/tokens/stats] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
