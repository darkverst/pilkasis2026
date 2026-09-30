// Server-side helper: notify the socket.io mini-service.
// On Vercel/serverless without a socket service, these become no-ops
// and the frontend falls back to HTTP polling.

const SOCKET_INTERNAL_URL = process.env.SOCKET_SERVICE_URL || "http://localhost:3003/internal/notify";
const SOCKET_ENABLED = !!process.env.SOCKET_SERVICE_URL || process.env.NODE_ENV === "development";

export interface VoteNotificationPayload {
  candidateId: string;
  candidateName: string;
  candidatePhoto: string;
  candidateColor: string;
  voterTokenMasked?: string;
  voterRole?: string;
}

/** Mask a token like "OSIS-M6Q-NLX" → "OSIS-•••-NLX" (keep prefix + suffix, mask middle). */
export function maskToken(token: string): string {
  if (!token) return "";
  const parts = token.split("-");
  if (parts.length >= 3) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const middleMasked = parts.slice(1, -1).map((p) => "•".repeat(Math.max(p.length, 3))).join("-");
    return `${first}-${middleMasked}-${last}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}-${"•".repeat(Math.max(parts[1].length, 3))}`;
  }
  if (token.length <= 4) return "•".repeat(token.length);
  return token.slice(0, 2) + "•".repeat(token.length - 4) + token.slice(-2);
}

export async function notifyVoteCast(payload: VoteNotificationPayload): Promise<void> {
  if (!SOCKET_ENABLED) return;
  await fetch(SOCKET_INTERNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function notifyAdminChange(): Promise<void> {
  if (!SOCKET_ENABLED) return;
  await fetch(SOCKET_INTERNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(() => {});
}
