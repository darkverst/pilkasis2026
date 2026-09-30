// Election status helper — shared by vote API and vote/status API.

import { db } from "@/lib/db";

export type ElectionState = "active" | "inactive" | "not-started" | "ended";

export interface ElectionStatus {
  state: ElectionState;
  label: string;
  canVote: boolean;
  scheduled: boolean;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(typeof v === "string" ? v : String(v));
  return isNaN(d.getTime()) ? null : d;
}

export function evaluateElectionStatus(settings: {
  isActive: boolean;
  startTime?: Date | null;
  endTime?: Date | null;
} | null): ElectionStatus {
  const isActive = settings?.isActive ?? true;
  const start = parseDate(settings?.startTime);
  const end = parseDate(settings?.endTime);
  const scheduled = !!(start || end);
  const now = new Date();

  let state: ElectionState;
  if (!isActive) {
    state = "inactive";
  } else if (scheduled && start && now < start) {
    state = "not-started";
  } else if (scheduled && end && now > end) {
    state = "ended";
  } else {
    state = "active";
  }

  const labels: Record<ElectionState, string> = {
    active: "Sedang Berlangsung",
    inactive: "Dinonaktifkan Panitia",
    "not-started": "Belum Dimulai",
    ended: "Telah Berakhir",
  };

  return {
    state,
    label: labels[state],
    canVote: state === "active",
    scheduled,
    isActive,
    startTime: start ? start.toISOString() : null,
    endTime: end ? end.toISOString() : null,
  };
}

export async function getElectionStatus(): Promise<ElectionStatus> {
  const settings = await db.settings.findUnique({ where: { id: "default" } });
  return evaluateElectionStatus(settings);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
