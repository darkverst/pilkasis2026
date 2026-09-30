import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/logout → clear the admin session cookie.
export async function POST() {
  try {
    const res = NextResponse.json({ success: true });
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  } catch (err) {
    console.error("[POST /api/admin/logout] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
