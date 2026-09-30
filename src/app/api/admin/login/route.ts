import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  getAdminPassword,
} from "@/lib/auth";

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
    const body = (await req.json()) as LoginRequestBody;
    const password = isString(body.password) ? body.password : "";

    if (password !== getAdminPassword()) {
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
