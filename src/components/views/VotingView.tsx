"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Candidate, Settings } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  KeyRound,
  Vote,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  GraduationCap,
  Clock,
  CalendarClock,
  CircleSlash,
} from "lucide-react";

const VoteConfetti = dynamic(() => import("@/components/three/VoteConfetti"), {
  ssr: false,
});

type Step = "token" | "select" | "success";

type ElectionState = "active" | "inactive" | "not-started" | "ended";

interface ElectionStatusInfo {
  state: ElectionState;
  label: string;
  canVote: boolean;
  scheduled: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface TokenStatus {
  valid: boolean;
  hasVoted: boolean;
  role: "student" | "teacher";
  voterName: string | null;
  votedAt: string | null;
}

/** Client-side mirror of evaluateElectionStatus (server uses Prisma; here we
 * just compute from settings we already fetched). */
function evaluateStatus(s: Settings | null): ElectionStatusInfo {
  const isActive = s?.isActive ?? true;
  const start = s?.startTime ? new Date(s.startTime) : null;
  const end = s?.endTime ? new Date(s.endTime) : null;
  const startValid = start && !isNaN(start.getTime()) ? start : null;
  const endValid = end && !isNaN(end.getTime()) ? end : null;
  const scheduled = !!(startValid || endValid);
  const now = new Date();

  let state: ElectionState;
  if (!isActive) state = "inactive";
  else if (scheduled && startValid && now < startValid) state = "not-started";
  else if (scheduled && endValid && now > endValid) state = "ended";
  else state = "active";

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
    startTime: startValid ? startValid.toISOString() : null,
    endTime: endValid ? endValid.toISOString() : null,
  };
}

function formatDateTime(iso: string | null): string {
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

const BANNER_STYLES: Record<
  ElectionState,
  { bg: string; text: string; border: string; icon: typeof Clock; dot: string }
> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: Clock,
    dot: "bg-emerald-500",
  },
  inactive: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: CircleSlash,
    dot: "bg-amber-500",
  },
  "not-started": {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
    icon: CalendarClock,
    dot: "bg-sky-500",
  },
  ended: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: CircleSlash,
    dot: "bg-slate-500",
  },
};

function ElectionBanner({ status }: { status: ElectionStatusInfo }) {
  const style = BANNER_STYLES[status.state];
  const Icon = style.icon;
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}
    >
      <div className="flex items-center gap-2">
        <span className={`relative flex h-2.5 w-2.5`}>
          {status.state === "active" && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${style.dot}`}
            />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${style.dot}`}
          />
        </span>
        <Icon className={`h-4 w-4 ${style.text}`} />
        <span className={`text-sm font-bold ${style.text}`}>{status.label}</span>
      </div>
      <div
        className={`flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs ${style.text}`}
      >
        {status.scheduled && status.startTime && (
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Mulai: {formatDateTime(status.startTime)}
          </span>
        )}
        {status.scheduled && status.endTime && (
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Selesai: {formatDateTime(status.endTime)}
          </span>
        )}
        {!status.scheduled && (
          <span className="text-xs">Tanpa jadwal — berjalan selama status AKTIF</span>
        )}
      </div>
    </div>
  );
}

export function VotingView() {
  const [step, setStep] = useState<Step>("token");
  const [token, setToken] = useState("");
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);
  const [election, setElection] = useState<ElectionStatusInfo | null>(null);
  const { toast } = useToast();
  const setView = useAppStore((s) => s.setView);

  // Fetch election status + preload candidates once.
  // We fetch /api/settings and evaluate the status client-side because the
  // token-status endpoint (/api/vote/status?token=...) is per-token.
  useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        if (alive) setElection(evaluateStatus(s));
      })
      .catch(() => {
        if (alive)
          setElection({
            state: "active",
            label: "Sedang Berlangsung",
            canVote: true,
            scheduled: false,
            startTime: null,
            endTime: null,
          });
      });
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((data: Candidate[]) => alive && setCandidates(data || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const handleCheckToken = async () => {
    const t = token.trim().toUpperCase();
    if (!t) {
      setTokenError("Masukkan token terlebih dahulu.");
      return;
    }
    if (election && !election.canVote) {
      const messages: Record<ElectionState, string> = {
        active: "",
        inactive:
          "Pemilihan sedang dinonaktifkan oleh panitia. Mohon tunggu hingga pemilihan diaktifkan kembali.",
        "not-started": `Pemilihan belum dimulai. Jadwal mulai: ${formatDateTime(
          election.startTime,
        )}.`,
        ended: `Pemilihan telah berakhir pada ${formatDateTime(election.endTime)}.`,
      };
      setTokenError(messages[election.state]);
      return;
    }
    setTokenChecking(true);
    setTokenError(null);
    try {
      const res = await fetch(`/api/vote/status?token=${encodeURIComponent(t)}`);
      const data: TokenStatus = await res.json();
      if (!data.valid) {
        setTokenError("Token tidak dikenali. Periksa kembali penulisan token Anda.");
        return;
      }
      if (data.hasVoted) {
        setTokenStatus(data);
        setTokenError("Token ini sudah digunakan untuk memilih. Satu token = satu suara.");
        return;
      }
      setTokenStatus(data);
      setStep("select");
      toast({
        title: "Token valid",
        description: `Selamat datang, ${
          data.voterName || (data.role === "teacher" ? "Bapak/Ibu Guru" : "Siswa")
        }! Silakan pilih calon.`,
      });
    } catch {
      setTokenError("Gagal memverifikasi token. Coba lagi.");
    } finally {
      setTokenChecking(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selected || !tokenStatus) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim().toUpperCase(),
          candidateId: selected.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Gagal memilih",
          description: data.error || "Terjadi kesalahan.",
          variant: "destructive",
        });
        setConfirmOpen(false);
        return;
      }
      setVotedCandidate(selected);
      setConfirmOpen(false);
      setStep("success");
      toast({
        title: "Suara tercatat!",
        description: "Terima kasih telah berpartisipasi dalam demokrasi sekolah.",
      });
    } catch {
      toast({
        title: "Gagal memilih",
        description: "Koneksi bermasalah. Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("token");
    setToken("");
    setSelected(null);
    setTokenStatus(null);
    setVotedCandidate(null);
    setTokenError(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Stepper */}
      <Stepper step={step} />

      {/* Election status banner */}
      {election && <ElectionBanner status={election} />}

      {step === "token" && (
        <Card className="border-blue-100 bg-white/85 shadow-lg shadow-blue-100/50">
          <CardContent className="p-4 sm:p-6 sm:p-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 sm:mb-4 sm:h-14 sm:w-14">
                <KeyRound className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h2 className="text-xl font-black text-blue-950 sm:text-2xl">
                Masukkan Token
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs text-blue-700/80 sm:text-sm">
                Gunakan token sekali pakai yang Anda terima dari panitia. Token
                berformat
                <span className="mx-1 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs text-blue-700">
                  OSIS-XXX-XXX
                </span>
              </p>
            </div>

            <div className="mx-auto mt-5 max-w-md space-y-3 sm:mt-6">
              <Label htmlFor="token" className="text-blue-800">
                Token Pemilih
              </Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.toUpperCase());
                  setTokenError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCheckToken()}
                placeholder="OSIS-XXX-XXX"
                className="text-center font-mono text-base tracking-widest border-blue-200 focus:border-blue-500 sm:text-lg"
                autoComplete="off"
              />
              {tokenError && (
                <div
                  className={`flex items-start gap-1.5 rounded-lg p-3 text-sm ${
                    election && !election.canVote
                      ? "bg-amber-50 text-amber-800"
                      : "text-rose-600"
                  }`}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}
              {tokenStatus?.hasVoted && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="flex items-center gap-2 p-3 text-sm text-amber-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Token ini sudah digunakan pada{" "}
                    {tokenStatus.votedAt
                      ? new Date(tokenStatus.votedAt).toLocaleString("id-ID")
                      : "sebelumnya"}
                    .
                  </CardContent>
                </Card>
              )}
              <Button
                onClick={handleCheckToken}
                disabled={tokenChecking || !token.trim()}
                className="w-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
                size="lg"
              >
                {tokenChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memverifikasi…
                  </>
                ) : (
                  <>
                    Verifikasi Token <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="mx-auto mt-5 max-w-md rounded-xl bg-blue-50 p-3 text-center sm:mt-6 sm:p-4">
              <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-blue-500" />
              <p className="text-xs text-blue-700/80">
                Token bersifat rahasia & sekali pakai. Jangan berikan kepada
                orang lain. Satu token hanya bisa digunakan untuk satu calon.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "select" && tokenStatus && (
        <div className="space-y-4">
          <Card className="border-blue-100 bg-white/85">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:h-10 sm:w-10">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">
                    {tokenStatus.voterName ||
                      (tokenStatus.role === "teacher"
                        ? "Bapak/Ibu Guru"
                        : "Siswa")}
                  </p>
                  <p className="text-xs text-blue-600 capitalize">
                    {tokenStatus.role === "teacher" ? "Guru" : "Siswa"} &middot;
                    Token aktif
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-blue-600"
              >
                Ganti token
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <h2 className="text-xl font-black text-blue-950 sm:text-2xl">
              Pilih Calon Anda
            </h2>
            <p className="mt-1 text-xs text-blue-700/80 sm:text-sm">
              Klik salah satu calon di bawah untuk memilih.
            </p>
          </div>

          {candidates.length === 0 ? (
            <Card className="border-blue-100 bg-white/80">
              <CardContent className="p-6 text-center text-sm text-blue-700 sm:p-8">
                Belum ada calon. Hubungi panitia.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {candidates.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="group text-left"
                >
                  <Card
                    className={`overflow-hidden border-2 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 ${
                      selected?.id === c.id
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-blue-100 bg-white/85"
                    }`}
                  >
                    <div className="flex">
                      <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-blue-50 sm:h-32 sm:w-28">
                        {c.photo ? (
                           
                          <img
                            src={c.photo}
                            alt={c.name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-black text-blue-200 sm:text-4xl">
                            {c.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[10px] font-black text-blue-700 ring-1 ring-blue-300 sm:h-7 sm:w-7 sm:text-xs">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 p-3">
                        <p className="text-sm font-bold text-blue-950">{c.name}</p>
                        {c.isPair && c.partnerName ? (
                          <p className="text-[11px] text-blue-500">
                            &amp; {c.partnerName}
                          </p>
                        ) : null}
                        <p className="text-xs text-blue-600">{c.class}</p>
                        <p className="mt-1.5 line-clamp-2 text-xs text-blue-700/70">
                          {c.vision}
                        </p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="sticky bottom-16 z-20 md:bottom-4">
              <Card className="border-blue-200 bg-white/95 shadow-xl shadow-blue-200/50 backdrop-blur">
                <CardContent className="flex items-center justify-between gap-3 p-3 sm:p-4">
                  <div className="min-w-0">
                    <p className="text-xs text-blue-600">Calon pilihan Anda:</p>
                    <p className="truncate text-sm font-bold text-blue-950 sm:text-base">
                      {selected.name}
                    </p>
                  </div>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    className="bg-blue-600 text-white shadow hover:bg-blue-700"
                    size="sm"
                  >
                    <Vote className="mr-1.5 h-4 w-4" /> Konfirmasi
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {step === "success" && votedCandidate && (
        <div className="relative">
          <VoteConfetti
            trigger={true}
            height={0}
            className="pointer-events-none fixed inset-0 z-50"
          />
          <Card className="border-blue-100 bg-white/90 shadow-xl">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:gap-4 sm:p-8 sm:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-pulse-ring sm:h-20 sm:w-20">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-blue-950 sm:text-3xl">
                  Suara Tercatat!
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs text-blue-700/80 sm:text-sm">
                  Terima kasih telah berpartisipasi dalam Pemilihan OSIS. Suara
                  Anda untuk{" "}
                  <span className="font-bold text-blue-900">
                    {votedCandidate.name}
                  </span>{" "}
                  telah berhasil disimpan dengan aman.
                </p>
              </div>
              <div className="flex h-16 w-16 overflow-hidden rounded-xl bg-blue-50 sm:h-20 sm:w-20">
                {votedCandidate.photo && (
                   
                  <img
                    src={votedCandidate.photo}
                    alt={votedCandidate.name}
                    className="h-full w-full object-cover object-top"
                  />
                )}
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                <ShieldCheck className="mr-1.5 h-3 w-3" /> Token dinonaktifkan
              </Badge>
              <div className="flex flex-wrap justify-center gap-2 pt-1 sm:gap-3 sm:pt-2">
                <Button
                  onClick={() => setView("results")}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  Lihat Live Hasil <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="border-blue-200 text-blue-700"
                  size="sm"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Konfirmasi Pilihan</DialogTitle>
            <DialogDescription className="text-blue-700/80">
              Tindakan ini tidak dapat dibatalkan. Pastikan pilihan Anda sudah
              benar.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white sm:h-16 sm:w-16">
                {selected.photo && (
                   
                  <img
                    src={selected.photo}
                    alt={selected.name}
                    className="h-full w-full object-cover object-top"
                  />
                )}
              </div>
              <div>
                <p className="font-bold text-blue-950">{selected.name}</p>
                <p className="text-sm text-blue-600">{selected.class}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="border-blue-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitVote}
              disabled={submitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  <Vote className="mr-2 h-4 w-4" /> Ya, Pilih Calon Ini
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "token", label: "Token" },
    { key: "select", label: "Pilih" },
    { key: "success", label: "Selesai" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
              i < currentIdx
                ? "bg-emerald-100 text-emerald-700"
                : i === currentIdx
                ? "bg-blue-600 text-white shadow"
                : "bg-blue-50 text-blue-400"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 sm:h-5 sm:w-5">
              {i < currentIdx ? (
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                i + 1
              )}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className="h-0.5 w-4 bg-blue-200 sm:w-10" />
          )}
        </div>
      ))}
    </div>
  );
}
