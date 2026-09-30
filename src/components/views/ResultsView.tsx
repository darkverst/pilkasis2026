"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ElectionResults } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket-client";
import { maskToken } from "@/lib/socket-notify";
// report.ts is imported for re-use elsewhere (admin). It is not used here —
// the public ResultsView intentionally does NOT show a report button.
import { generateElectionReportHTML } from "@/lib/report";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Radio,
  Users,
  Vote,
  TrendingUp,
  Clock,
  Trophy,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Box,
  BarChart3,
  Lock,
  ShieldCheck,
  Eye,
} from "lucide-react";

const LiveResults3D = dynamic(() => import("@/components/three/LiveResults3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100">
      <div className="animate-pulse text-blue-400">Memuat visualisasi 3D…</div>
    </div>
  ),
});

interface VoteFeedItem {
  candidateId: string;
  candidateName: string;
  candidatePhoto: string;
  candidateColor: string;
  totalVotes: number;
  timestamp: string;
  voterTokenMasked?: string;
  voterRole?: "student" | "teacher";
}

type ChartMode = "2d" | "3d";

const POLL_INTERVAL_MS = 3000;

export function ResultsView() {
  const results = useAppStore((s) => s.results);
  const setResults = useAppStore((s) => s.setResults);
  const setLastVoteCast = useAppStore((s) => s.setLastVoteCast);
  const lastVoteCast = useAppStore((s) => s.lastVoteCast);
  const socketConnected = useAppStore((s) => s.socketConnected);
  const setSocketConnected = useAppStore((s) => s.setSocketConnected);
  const onlineViewers = useAppStore((s) => s.onlineViewers);
  const setOnlineViewers = useAppStore((s) => s.setOnlineViewers);
  const settings = useAppStore((s) => s.settings);
  const setView = useAppStore((s) => s.setView);

  const [feed, setFeed] = useState<VoteFeedItem[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("2d");
  const [apiLocked, setApiLocked] = useState(false);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // silence the import so it isn't tree-shaken away; safe in client component
  void generateElectionReportHTML;

  // "Locked" = settings says private OR the API responded 403.
  // Derived directly from settings + apiLocked flag (no setState in effect).
  const locked = (settings && settings.resultsPublic === false) || apiLocked;

  // Initial fetch + socket subscription + polling fallback
  useEffect(() => {
    let mounted = true;

    const doFetch = async () => {
      try {
        const r = await fetch("/api/results");
        if (r.status === 403) {
          if (mounted) setApiLocked(true);
          return null;
        }
        if (!r.ok) return null;
        const data = (await r.json()) as ElectionResults;
        if (mounted) {
          setApiLocked(false);
          setResults(data);
        }
        return data;
      } catch {
        return null;
      }
    };
    doFetch();

    const socket = getSocket();
    if (socket) {
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      const onResultsUpdate = (data: ElectionResults) => setResults(data);
      const onVoteCast = (data: VoteFeedItem) => {
        setLastVoteCast(data);
        setFeed((prev) => [data, ...prev].slice(0, 30));
      };
      const onVoterOnline = (data: { count: number }) =>
        setOnlineViewers(data.count);

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("results:update", onResultsUpdate);
      socket.on("vote:cast", onVoteCast);
      socket.on("voter:online", onVoterOnline);
      if (!socket.connected) socket.connect();

      return () => {
        mounted = false;
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("results:update", onResultsUpdate);
        socket.off("vote:cast", onVoteCast);
        socket.off("voter:online", onVoterOnline);
      };
    }

    // No socket (Vercel/serverless) → poll every 3s.
    const interval = setInterval(() => {
      doFetch();
    }, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setResults, setLastVoteCast, setOnlineViewers, setSocketConnected]);

  // Fullscreen API
  const toggleFullscreen = async () => {
    const el = chartWrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore — Fullscreen API may be unavailable (e.g. iOS Safari) */
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ============== Private results view ==============
  if (locked) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-blue-100 bg-white/85 shadow-xl shadow-blue-100/40">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-950 sm:text-2xl">
                Hasil Privat
              </h2>
              <p className="mt-2 text-xs text-blue-700/80 sm:text-sm">
                Panitia telah memprivasi hasil pemilihan sementara. Hasil akan
                dipublikasikan kembali setelah pemilihan selesai.
              </p>
            </div>
            <Button
              onClick={() => setView("admin")}
              className="bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Login Panitia
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leader = results?.candidates
    ? [...results.candidates].sort((a, b) => b.voteCount - a.voteCount)[0]
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header + status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100 sm:mb-2">
            <Radio className="mr-1.5 h-3 w-3 animate-pulse" /> Live Hasil Pemilihan
          </Badge>
          <h1 className="text-2xl font-black text-blue-950 sm:text-3xl md:text-4xl">
            Pantau Realtime
          </h1>
          <p className="mt-1 text-xs text-blue-700/80 sm:text-sm">
            Perolehan suara diperbarui otomatis setiap kali ada pemilih yang
            memilih.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              socketConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {socketConnected ? (
              <>
                <Wifi className="mr-1.5 h-3 w-3" /> Terhubung
              </>
            ) : (
              <>
                <WifiOff className="mr-1.5 h-3 w-3" /> Polling 3s
              </>
            )}
          </Badge>
          {onlineViewers > 0 && (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              <Users className="mr-1.5 h-3 w-3" /> {onlineViewers} menonton
            </Badge>
          )}
        </div>
      </div>

      {/* Stats row — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard
          icon={Vote}
          label="Total Suara"
          value={results?.totalVotes ?? 0}
          color="from-blue-500 to-sky-500"
        />
        <StatCard
          icon={Users}
          label="Pemilih"
          value={results?.totalVoters ?? 0}
          color="from-sky-500 to-cyan-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Partisipasi"
          value={`${results?.turnOut ?? 0}%`}
          color="from-cyan-500 to-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Update"
          value={results ? "Baru saja" : "-"}
          color="from-sky-400 to-blue-500"
        />
      </div>

      {/* Chart with mode toggle + fullscreen */}
      <Card className="overflow-hidden border-blue-100 bg-white/80">
        <CardContent className="p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-full bg-blue-50 p-1">
              <button
                onClick={() => setChartMode("2d")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  chartMode === "2d"
                    ? "bg-blue-600 text-white shadow"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
                aria-pressed={chartMode === "2d"}
              >
                <BarChart3 className="h-3.5 w-3.5" /> 2D
              </button>
              <button
                onClick={() => setChartMode("3d")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  chartMode === "3d"
                    ? "bg-blue-600 text-white shadow"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
                aria-pressed={chartMode === "3d"}
              >
                <Box className="h-3.5 w-3.5" /> 3D
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="mr-1.5 h-3.5 w-3.5" /> Keluar Layar Penuh
                </>
              ) : (
                <>
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Layar Penuh
                </>
              )}
            </Button>
          </div>

          <div
            ref={chartWrapRef}
            className={`overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/40 to-sky-50 ${
              isFullscreen ? "h-full min-h-[100vh]" : ""
            }`}
          >
            {chartMode === "3d" ? (
              <LiveResults3D
                results={
                  results || {
                    totalVoters: 0,
                    totalVotes: 0,
                    turnOut: 0,
                    candidates: [],
                    lastUpdated: new Date().toISOString(),
                  }
                }
                height={isFullscreen ? 600 : 440}
              />
            ) : (
              <Chart2D results={results} />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="border-blue-100 bg-white/85">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h2 className="text-base font-black text-blue-950 sm:text-lg">
                  Klasemen Sementara
                </h2>
                {leader && leader.voteCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <Trophy className="mr-1.5 h-3 w-3" /> Terdepan: {leader.name}
                  </Badge>
                )}
              </div>

              {!results || results.candidates.length === 0 ? (
                <p className="py-6 text-center text-sm text-blue-700/70 sm:py-8">
                  Belum ada calon atau suara yang masuk.
                </p>
              ) : (
                <div className="space-y-3">
                  {[...results.candidates]
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((c, idx) => {
                      const pct =
                        results.totalVotes > 0
                          ? (c.voteCount / results.totalVotes) * 100
                          : 0;
                      const isLeader = idx === 0 && c.voteCount > 0;
                      return (
                        <div key={c.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black sm:h-7 sm:w-7 sm:text-xs ${
                                  isLeader
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-50 sm:h-9 sm:w-9">
                                {c.photo ? (
                                   
                                  <img
                                    src={c.photo}
                                    alt={c.name}
                                    className="h-full w-full object-cover object-top"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-black text-blue-300 sm:text-sm">
                                    {c.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-blue-950 sm:text-sm">
                                  {c.name}
                                </p>
                                <p className="truncate text-[11px] text-blue-600">
                                  {c.class}
                                  {c.isPair && c.partnerName
                                    ? ` &middot; & ${c.partnerName}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-black text-blue-950 sm:text-lg">
                                {c.voteCount}
                              </p>
                              <p className="text-[10px] text-blue-500 sm:text-[11px]">
                                {c.percentage}%
                              </p>
                            </div>
                          </div>
                          <Progress
                            value={pct}
                            className="h-2 bg-blue-50"
                            style={
                              {
                                ["--progress-foreground" as string]: c.color,
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live vote feed */}
        <Card className="border-blue-100 bg-white/85">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-base font-black text-blue-950 sm:text-lg">
                Aliran Suara
              </h2>
            </div>
            {feed.length === 0 ? (
              <div className="py-6 text-center text-sm text-blue-700/70 sm:py-8">
                <Vote className="mx-auto mb-2 h-8 w-8 text-blue-200" />
                Menunggu suara masuk…
              </div>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto scrollbar-blue pr-1">
                {feed.map((f, i) => {
                  const masked =
                    f.voterTokenMasked ||
                    (f.voterRole ? "OSIS-•••-XXX" : "OSIS-•••-XXX");
                  return (
                    <div
                      key={`${f.candidateId}-${f.timestamp}-${i}`}
                      className="flex items-center gap-2.5 rounded-lg bg-blue-50/60 p-2.5 animate-in fade-in slide-in-from-right-4 duration-300"
                    >
                      <div
                        className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white ring-2"
                        style={{ ["--tw-ring-color" as string]: f.candidateColor }}
                      >
                        {f.candidatePhoto ? (
                           
                          <img
                            src={f.candidatePhoto}
                            alt={f.candidateName}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-black text-blue-500">
                            {f.candidateName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-blue-950">
                          Suara untuk {f.candidateName}
                        </p>
                        <p className="flex flex-wrap items-center gap-1 text-[10px] text-blue-500">
                          <code className="rounded bg-white px-1 font-mono text-blue-700">
                            {masked}
                          </code>
                          {f.voterRole && (
                            <Badge
                              variant="outline"
                              className={`h-4 px-1 text-[9px] leading-none ${
                                f.voterRole === "teacher"
                                  ? "border-purple-200 bg-purple-50 text-purple-700"
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                              }`}
                            >
                              {f.voterRole === "teacher" ? "Guru" : "Siswa"}
                            </Badge>
                          )}
                          <span>&middot; Total {f.totalVotes}</span>
                        </p>
                      </div>
                      <Vote
                        className="h-4 w-4 shrink-0"
                        style={{ color: f.candidateColor }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {lastVoteCast && (
              <p className="mt-2 text-center text-[11px] text-blue-400 sm:mt-3">
                Update terakhir:{" "}
                {new Date(lastVoteCast.timestamp).toLocaleTimeString("id-ID")}
              </p>
            )}
            <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-blue-400">
              <Eye className="h-3 w-3" /> Token pemilih dimask untuk privasi
              (contoh: <code className="font-mono">{maskToken("OSIS-ABC-XYZ")}</code>)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Chart2D({ results }: { results: ElectionResults | null }) {
  if (!results || results.candidates.length === 0) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center text-center text-blue-700/70">
        <BarChart3 className="mb-2 h-10 w-10 text-blue-200" />
        <p className="text-sm">Belum ada data untuk ditampilkan.</p>
      </div>
    );
  }
  const max = Math.max(1, ...results.candidates.map((c) => c.voteCount));
  const sorted = [...results.candidates].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="space-y-3 p-3 sm:p-4">
      {sorted.map((c, idx) => {
        const widthPct = (c.voteCount / max) * 100;
        return (
          <div key={c.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  idx === 0 && c.voteCount > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {idx + 1}
              </span>
              <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-blue-50">
                {c.photo ? (
                   
                  <img
                    src={c.photo}
                    alt={c.name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-blue-300">
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-blue-950 sm:text-sm">
                {c.name}
              </p>
              <span className="text-xs font-bold text-blue-700 sm:text-sm">
                {c.voteCount}
              </span>
              <span className="text-[10px] text-blue-400 sm:text-xs">
                {c.percentage}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-blue-50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(2, widthPct)}%`,
                  backgroundColor: c.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Vote;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="overflow-hidden border-blue-100 bg-white/85">
      <CardContent className="p-3 sm:p-4">
        <div
          className={`mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow sm:mb-2 sm:h-9 sm:w-9`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600 sm:text-[11px]">
          {label}
        </p>
        <p className="text-lg font-black text-blue-950 sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}
