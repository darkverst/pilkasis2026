// Admin authentication helper (simple cookie-based session)
// For a school election panitia dashboard. Password is read from env.

export const ADMIN_COOKIE_NAME = "osis_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

interface AdminSession {
  role: "admin";
  loginAt: number;
  expiresAt: number;
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "panitia2025";
}

export function createAdminSession(): string {
  const now = Date.now();
  const session: AdminSession = {
    role: "admin",
    loginAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  // base64 encode (not encryption — demo only)
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (decoded.role !== "admin") return false;
    if (typeof decoded.expiresAt !== "number") return false;
    return Date.now() < decoded.expiresAt;
  } catch {
    return false;
  }
}

// Generate human-friendly one-time tokens like: OSIS-7K2-9PX
export function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  const block = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `OSIS-${block(3)}-${block(3)}`;
}

export function generateBatch(count: number): string[] {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(generateToken());
  }
  return Array.from(set);
}
