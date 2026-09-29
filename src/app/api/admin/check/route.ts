import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/check → { authenticated: boolean }
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const authenticated = verifyAdminSession(token);
    return NextResponse.json({ authenticated });
  } catch (err) {
    console.error("[GET /api/admin/check] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
