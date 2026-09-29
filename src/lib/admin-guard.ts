// Admin session guard for App Router route handlers.
//
// Usage:
//   const guard = requireAdmin(req);
//   if (guard instanceof Response) return guard; // 401
//   // ...authorized handler logic...
//
// `requireAdmin` returns `null` when the request is authorized, or a
// `NextResponse` with status 401 to be returned immediately otherwise.

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";

export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
