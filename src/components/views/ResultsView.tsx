"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ElectionResults } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { getSocket, disconnectSocket } from "@/lib/socket-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Radio, Users, Vote, TrendingUp, Clock, Trophy, Wifi, WifiOff } from "lucide-react";

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
}

export function ResultsView() {
  const results = useAppStore((s) => s.results);
  const setResults = useAppStore((s) => s.setResults);
  const setLastVoteCast = useAppStore((s) => s.setLastVoteCast);
  const lastVoteCast = useAppStore((s) => s.lastVoteCast);
  const socketConnected = useAppStore((s) => s.socketConnected);
  const setSocketConnected = useAppStore((s) => s.setSocketConnected);
  const onlineViewers = useAppStore((s) => s.onlineViewers);
  const setOnlineViewers = useAppStore((s) => s.setOnlineViewers);

  const [feed, setFeed] = useState<VoteFeedItem[]>([]);

  // Initial fetch + socket subscription
  useEffect(() => {
    let mounted = true;

    // Initial fetch
    fetch("/api/results")
      .then((r) => r.json())
      .then((data: ElectionResults) => {
        if (mounted) setResults(data);
      })
      .catch(() => {});

    const socket = getSocket();

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("results:update", (data: ElectionResults) => {
      setResults(data);
    });

    socket.on("vote:cast", (data: VoteFeedItem) => {
      setLastVoteCast(data);
      setFeed((prev) => [data, ...prev].slice(0, 30));
    });

    socket.on("voter:online", (data: { count: number }) => {
      setOnlineViewers(data.count);
    });

    // Poll fallback every 8s in case socket misses something
    const interval = setInterval(() => {
      fetch("/api/results")
        .then((r) => r.json())
        .then((data: ElectionResults) => mounted && setResults(data))
        .catch(() => {});
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("results:update");
      socket.off("vote:cast");
      socket.off("voter:online");
      // Do NOT disconnect socket globally — other views may use it. Keep connection alive.
    };
     
  }, []);

  const leader = results?.candidates
    ? [...results.candidates].sort((a, b) => b.voteCount - a.voteCount)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header + status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Radio className="mr-1.5 h-3 w-3 animate-pulse" /> Live Hasil Pemilihan
          </Badge>
          <h1 className="text-3xl font-black text-blue-950 sm:text-4xl">Pantau Realtime</h1>
          <p className="mt-1 text-sm text-blue-700/80">
            Perolehan suara diperbarui otomatis setiap kali ada pemilih yang memilih.
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
                <WifiOff className="mr-1.5 h-3 w-3" /> Menghubungkan…
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Vote} label="Total Suara" value={results?.totalVotes ?? 0} color="from-blue-500 to-sky-500" />
        <StatCard icon={Users} label="Pemilih" value={results?.totalVoters ?? 0} color="from-sky-500 to-cyan-500" />
        <StatCard icon={TrendingUp} label="Partisipasi" value={`${results?.turnOut ?? 0}%`} color="from-cyan-500 to-blue-500" />
        <StatCard icon={Clock} label="Update" value={results ? "Baru saja" : "-"} color="from-indigo-400 to-blue-500" />
      </div>

      {/* 3D visualization */}
      <Card className="overflow-hidden border-blue-100 bg-white/80">
        <CardContent className="p-3 sm:p-4">
          <LiveResults3D results={results || { totalVoters: 0, totalVotes: 0, turnOut: 0, candidates: [], lastUpdated: new Date().toISOString() }} height={440} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="border-blue-100 bg-white/85">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-blue-950">Klasemen Sementara</h2>
                {leader && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <Trophy className="mr-1.5 h-3 w-3" /> Terdepan: {leader.name}
                  </Badge>
                )}
              </div>

              {!results || results.candidates.length === 0 ? (
                <p className="py-8 text-center text-sm text-blue-700/70">
                  Belum ada calon atau suara yang masuk.
                </p>
              ) : (
                <div className="space-y-3">
                  {[...results.candidates]
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((c, idx) => {
                      const pct = results.totalVotes > 0 ? (c.voteCount / results.totalVotes) * 100 : 0;
                      const isLeader = idx === 0 && c.voteCount > 0;
                      return (
                        <div key={c.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                  isLeader
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-blue-50">
                                {c.photo ? (
                                   
                                  <img src={c.photo} alt={c.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-blue-300">
                                    {c.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-blue-950">{c.name}</p>
                                <p className="truncate text-xs text-blue-600">{c.class}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-blue-950">{c.voteCount}</p>
                              <p className="text-[11px] text-blue-500">{c.percentage}%</p>
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
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-lg font-black text-blue-950">Aliran Suara</h2>
            </div>
            {feed.length === 0 ? (
              <div className="py-8 text-center text-sm text-blue-700/70">
                <Vote className="mx-auto mb-2 h-8 w-8 text-blue-200" />
                Menunggu suara masuk…
              </div>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto scrollbar-blue pr-1">
                {feed.map((f, i) => (
                  <div
                    key={`${f.candidateId}-${f.timestamp}-${i}`}
                    className="flex items-center gap-2.5 rounded-lg bg-blue-50/60 p-2.5 animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white ring-2" style={{ ringColor: f.candidateColor }}>
                      {f.candidatePhoto ? (
                         
                        <img src={f.candidatePhoto} alt={f.candidateName} className="h-full w-full object-cover" />
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
                      <p className="text-[10px] text-blue-500">
                        {new Date(f.timestamp).toLocaleTimeString("id-ID")} &middot; Total {f.totalVotes}
                      </p>
                    </div>
                    <Vote className="h-4 w-4 shrink-0" style={{ color: f.candidateColor }} />
                  </div>
                ))}
              </div>
            )}
            {lastVoteCast && (
              <p className="mt-3 text-center text-[11px] text-blue-400">
                Update terakhir: {new Date(lastVoteCast.timestamp).toLocaleTimeString("id-ID")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
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
      <CardContent className="p-4">
        <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">{label}</p>
        <p className="text-2xl font-black text-blue-950">{value}</p>
      </CardContent>
    </Card>
  );
}
