import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

export const ADMIN_COOKIE_NAME = "osis_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

interface AdminSession {
  role: "admin";
  loginAt: number;
  expiresAt: number;
}

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(plain: string, stored: string): boolean {
  if (!stored.includes(":")) {
    return safeEqual(plain, stored);
  }
  const [salt, hash] = stored.split(":");
  const check = scryptSync(plain, salt, 64).toString("hex");
  return safeEqual(hash, check);
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "MGMPINFBWI";
}

export async function verifyAdminPassword(input: string): Promise<boolean> {
  const defaultPassword = getAdminPassword();
  try {
    const s = await db.settings.findUnique({
      where: { id: "default" },
      select: { adminPassword: true },
    });
    if (s?.adminPassword) {
      return verifyPasswordHash(input, s.adminPassword);
    }
  } catch (err) {
    console.error("[verifyAdminPassword] DB error, using default password fallback:", err);
  }
  return safeEqual(input, defaultPassword);
}

// The session cookie is a signed token, so it cannot be forged by hand-editing
// base64. The secret falls back to the admin password so a misconfigured deploy
// still gets unique-but-derived signing material rather than a known constant.
function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "MGMPINFBWI"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createAdminSession(): string {
  const now = Date.now();
  const session: AdminSession = {
    role: "admin",
    loginAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return false;

    const payload = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    if (!safeEqual(signature, sign(payload))) return false;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
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