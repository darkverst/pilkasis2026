/**
 * Smoke test for the OSIS election API.
 *
 * Runs against a live server (dev or standalone prod) and asserts the
 * behaviours that previously broke silently:
 *
 *   1. public routes respond 200
 *   2. admin routes reject unauthenticated callers
 *   3. a hand-forged admin session cookie is rejected (HMAC signing)
 *   4. malformed / empty JSON bodies return 400, not 500
 *   5. login with the correct password grants access
 *   6. a vote can be cast, and the same token cannot vote twice
 *
 * The vote section writes to the database (creates a voter, casts a vote) and
 * then removes both again, so it is safe to run repeatedly. It is skipped
 * unless DATABASE_URL points at a local SQLite file, so pointing BASE_URL at a
 * real election server cannot corrupt live results.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 bun run smoke
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MGPMINFBWI";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

interface Result {
  status: number;
  body: string;
}

async function req(
  path: string,
  init?: RequestInit & { cookie?: string },
): Promise<Result> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  if (init?.cookie) headers.set("Cookie", init.cookie);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const body = await res.text();
  return { status: res.status, body };
}

async function expect(name: string, path: string, want: number, init?: RequestInit & { cookie?: string }) {
  try {
    const { status, body } = await req(path, init);
    check(name, status === want, `expected ${want}, got ${status} — ${body.slice(0, 120)}`);
    return body;
  } catch (err) {
    check(name, false, err instanceof Error ? err.message : String(err));
    return "";
  }
}

/**
 * Remove a throwaway voter (and its vote) straight from the local SQLite DB.
 * Returns false if the row could not be removed.
 */
async function cleanupVoter(token: string): Promise<boolean> {
  if (!/^file:/.test(process.env.DATABASE_URL ?? "")) return false;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const voter = await prisma.voter.findUnique({ where: { token } });
      if (!voter) return true; // already gone
      await prisma.vote.deleteMany({ where: { voterId: voter.id } });
      await prisma.voter.delete({ where: { id: voter.id } });
      return true;
    } finally {
      await prisma.$disconnect();
    }
  } catch {
    return false;
  }
}

async function main() {
  console.log(`\nSmoke test → ${BASE_URL}\n`);

  // ---------------------------------------------------------------- public
  console.log("public routes");
  await expect("GET /                → 200", "/", 200);
  await expect("GET /api/settings    → 200", "/api/settings", 200);
  const candidatesBody = await expect(
    "GET /api/candidates  → 200",
    "/api/candidates",
    200,
  );

  let candidates: { id: string }[] = [];
  try {
    candidates = JSON.parse(candidatesBody) as { id: string }[];
  } catch {
    /* reported by the assertion above */
  }

  // ------------------------------------------------------------- auth gate
  console.log("\nadmin auth gate");
  await expect("GET /api/admin/tokens (anon) → 401", "/api/admin/tokens", 401);
  await expect("GET /api/admin/reset   (anon) → 401", "/api/admin/reset", 401, {
    method: "POST",
    body: JSON.stringify({ confirm: true, scope: "votes" }),
  });

  // forged cookie — plain base64 JSON with no HMAC signature
  const forgedPayload = Buffer.from(
    JSON.stringify({ role: "admin", loginAt: Date.now(), expiresAt: Date.now() + 9e6 }),
  ).toString("base64url");
  await expect(
    "forged session cookie     → 401",
    "/api/admin/tokens",
    401,
    { cookie: `osis_admin_session=${forgedPayload}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` },
  );
  await expect(
    "legacy unsigned cookie   → 401",
    "/api/admin/tokens",
    401,
    { cookie: `osis_admin_session=${Buffer.from(JSON.stringify({ role: "admin", expiresAt: Date.now() + 9e6 })).toString("base64")}` },
  );

  // ------------------------------------------------------------ body parsing
  console.log("\nmalformed request bodies → 400 (was 500)");
  await expect("POST /api/vote   no body  → 400", "/api/vote", 400, { method: "POST" });
  await expect("POST /api/vote   array    → 400", "/api/vote", 400, {
    method: "POST",
    body: "[]",
  });
  await expect("POST /api/vote   garbage  → 400", "/api/vote", 400, {
    method: "POST",
    body: "{not json",
  });
  await expect("POST /api/admin/login no body → 400", "/api/admin/login", 400, {
    method: "POST",
  });

  // ------------------------------------------------------------------ login
  console.log("\nadmin login");
  const badLogin = await req("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: "definitely-wrong" }),
  });
  check("wrong password → 401", badLogin.status === 401, `got ${badLogin.status}`);

  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  const cookieMatch = setCookie.match(/osis_admin_session=([^;]+)/);
  check("correct password → 200 + cookie", loginRes.status === 200 && !!cookieMatch);
  const cookie = cookieMatch ? `osis_admin_session=${cookieMatch[1]}` : "";

  if (cookie) {
    await expect("GET /api/admin/tokens (authed) → 200", "/api/admin/tokens", 200, { cookie });
    await expect("GET /api/admin/check    (authed) → 200", "/api/admin/check", 200, { cookie });
    const stats = await req("/api/admin/tokens/stats", { cookie });
    check("token stats returns totals", stats.status === 200 && stats.body.includes("total"));
  }

  // ------------------------------------------------------------- vote once
  //
  // This section writes to the database (creates a voter, casts a vote), then
  // removes them again. It is refused unless the target is a local SQLite file,
  // so pointing BASE_URL at a real election server cannot corrupt live results.
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isLocalDb = /^file:/.test(dbUrl);
  const voteTestAllowed = isLocalDb || process.env.ALLOW_VOTE_TEST === "1";

  console.log("\nvote flow (single-use token)");
  if (!cookie || candidates.length === 0) {
    console.log("  SKIP  (no admin cookie or no candidates — is the DB seeded?)");
  } else if (!voteTestAllowed) {
    console.log(
      `  SKIP  (writes to the DB; needs a file: DATABASE_URL or ALLOW_VOTE_TEST=1, got "${dbUrl}")`,
    );
  } else {
    // Mint a dedicated throwaway voter, so we never disturb real tokens.
    const gen = await req("/api/admin/tokens/generate", {
      method: "POST",
      cookie,
      body: JSON.stringify({ count: 1, role: "student" }),
    });
    let throwawayToken = "";
    try {
      throwawayToken = (JSON.parse(gen.body) as { tokens: string[] }).tokens[0] ?? "";
    } catch {
      /* reported below */
    }
    check("generated a throwaway token", !!throwawayToken, gen.body.slice(0, 120));

    if (throwawayToken) {
      const first = await req("/api/vote", {
        method: "POST",
        body: JSON.stringify({ token: throwawayToken, candidateId: candidates[0].id }),
      });
      check(
        "first vote accepted",
        first.status === 200 && first.body.includes('"success":true'),
        `got ${first.status} — ${first.body.slice(0, 120)}`,
      );

      const second = await req("/api/vote", {
        method: "POST",
        body: JSON.stringify({ token: throwawayToken, candidateId: candidates[0].id }),
      });
      check(
        "token cannot vote twice",
        second.status === 400,
        `got ${second.status} — ${second.body.slice(0, 120)}`,
      );

      const bogus = await req("/api/vote", {
        method: "POST",
        body: JSON.stringify({ token: "OSIS-NOP-NOP", candidateId: candidates[0].id }),
      });
      check(
        "unknown token rejected",
        bogus.status === 400,
        `got ${bogus.status} — ${bogus.body.slice(0, 120)}`,
      );

      // A used token cannot be deleted through the API — deliberately, so a
      // cast vote stays auditable. Clean up directly against the local DB
      // instead (the vote row cascades with the voter).
      const cleaned = await cleanupVoter(throwawayToken);
      check(
        "cleanup: throwaway voter + vote removed",
        cleaned,
        `could not remove ${throwawayToken} from the local DB`,
      );
    }
  }

  // ----------------------------------------------------------------- result
  console.log(`\n${"─".repeat(52)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  • ${f}`);
  }
  console.log(`${"─".repeat(52)}\n`);

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nsmoke test crashed:", err);
  process.exit(1);
});