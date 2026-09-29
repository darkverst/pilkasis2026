// Server-side helper: notify the socket.io mini-service (port 3003)
// that something changed so it can push real-time updates to clients.
//
// This MUST be called after:
//   - any successful vote (with candidate payload)
//   - any admin mutation on candidates/settings/tokens (with empty payload `{}`)
//
// The fetch is fire-and-forget — if the socket service is down, we never
// want to fail the user-facing request because of it.

const SOCKET_INTERNAL_URL = "http://localhost:3003/internal/notify";

export interface VoteNotificationPayload {
  candidateId: string;
  candidateName: string;
  candidatePhoto: string;
  candidateColor: string;
}

/**
 * Notify the socket.io mini-service that a vote was cast.
 * Includes the candidate payload so connected clients can render
 * a live "X just received a vote" animation.
 */
export async function notifyVoteCast(
  payload: VoteNotificationPayload,
): Promise<void> {
  await fetch(SOCKET_INTERNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // ignore — socket service may be down
  });
}

/**
 * Notify the socket.io mini-service that an admin mutation occurred
 * (candidate created/updated/deleted, settings changed, tokens generated,
 * reset performed, etc.). Sends an empty body so the service just
 * re-broadcasts a fresh results snapshot.
 */
export async function notifyAdminChange(): Promise<void> {
  await fetch(SOCKET_INTERNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(() => {
    // ignore — socket service may be down
  });
}
