// Shared request-body helper for App Router route handlers.
//
// `req.json()` throws on an empty or malformed body, which the route-level
// catch turns into a 500. These helpers return a 400 instead, since a bad
// request body is a client error, not a server fault.

import { NextResponse } from "next/server";

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/** Parse a JSON request body, returning a 400 response on failure. */
export async function parseJsonBody<T>(req: Request): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Body permintaan harus berupa JSON yang valid" },
        { status: 400 },
      ),
    };
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Body permintaan harus berupa objek JSON" },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: raw as T };
}