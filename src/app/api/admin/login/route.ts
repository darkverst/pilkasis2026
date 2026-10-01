import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";

export const dynamic = "force-dynamic";

interface LoginRequestBody {
  password?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

// POST /api/admin/login  body: { password }
// Sets an httpOnly cookie `osis_admin_session` valid for 8 hours.
export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody<LoginRequestBody>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const password = isString(body.password) ? body.password : "";

    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Password panitia salah" },
        { status: 401 },
      );
    }

    const token = createAdminSession();
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 3600,
    });
    return res;
  } catch (err) {
    console.error("[POST /api/admin/login] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
