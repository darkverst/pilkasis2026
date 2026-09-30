"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Candidate, ElectionResults, Settings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Vote,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Radio,
  GraduationCap,
} from "lucide-react";

/** A reusable pair-of-photos block for a candidate (with optional wakil). */
function CandidatePhotoPair({
  candidate,
  className,
}: {
  candidate: Pick<Candidate, "photo" | "name" | "isPair" | "partnerPhoto" | "partnerName">;
  className?: string;
}) {
  if (!candidate.isPair || !candidate.partnerPhoto) {
    return (
      <div className={`relative aspect-square w-full overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100 ${className ?? ""}`}>
        {candidate.photo ? (
           
          <img
            src={candidate.photo}
            alt={`Foto ${candidate.name}`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-black text-blue-200 sm:text-6xl">
              {candidate.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={`relative flex aspect-square w-full items-stretch gap-1 ${className ?? ""}`}>
      <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        {candidate.photo ? (
           
          <img
            src={candidate.photo}
            alt={`Foto ${candidate.name}`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-black text-blue-200">
              {candidate.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center px-0.5">
        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm sm:text-xs">
          &amp;
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        {candidate.partnerPhoto ? (
           
          <img
            src={candidate.partnerPhoto}
            alt={`Foto wakil ${candidate.partnerName}`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-black text-blue-200">
              {candidate.partnerName.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeView({
  settings,
  results,
}: {
  settings: Settings | null;
  results: ElectionResults | null;
}) {
  const setView = useAppStore((s) => s.setView);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((data: Candidate[]) => {
        if (alive) setCandidates((data || []).slice(0, 4));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const features = [
    {
      icon: Vote,
      title: "Satu Suara, Satu Token",
      desc: "Setiap pemilih menerima token sekali pakai dari panitia. Satu orang = satu suara, dijamin aman.",
      color: "from-blue-500 to-sky-500",
    },
    {
      icon: Radio,
      title: "Hasil Realtime",
      desc: "Pantau perolehan suara calon secara langsung dengan visualisasi 3D yang interaktif.",
      color: "from-sky-500 to-cyan-500",
    },
    {
      icon: ShieldCheck,
      title: "Aman & Transparan",
      desc: "Token terenkripsi, suara anonim, dan data terverifikasi. Transparan untuk seluruh warga sekolah.",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: Users,
      title: "Siswa & Guru",
      desc: "Seluruh siswa dan guru ikut menentukan pilihan dengan peran masing-masing.",
      color: "from-sky-400 to-blue-500",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      {/* ============== HERO — glass card over 3D bg ============== */}
      <section className="relative">
        <div className="glass-card mx-auto w-full max-w-5xl rounded-2xl border-white/40 px-4 py-6 shadow-xl shadow-blue-100/40 backdrop-blur-md sm:rounded-3xl sm:px-8 sm:py-10 lg:px-12 lg:py-12 bg-white/70">
          <div className="text-center">
            <Badge className="mb-3 inline-flex bg-blue-100 text-blue-700 hover:bg-blue-100 sm:mb-4">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Pemilihan Sedang Berlangsung
            </Badge>
            <h1 className="text-2xl font-black leading-tight text-blue-950 sm:text-3xl md:text-4xl xl:text-5xl">
              {settings?.electionTitle || "Pemilihan Ketua & Wakil OSIS 2025"}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-xs text-blue-800/80 sm:mt-3 sm:text-sm md:text-base">
              {settings?.electionDescription ||
                "Pilih pemimpin OSIS pilihanmu untuk periode 2025/2026."}
            </p>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <StatCard
              label="Total Suara"
              value={String(results?.totalVotes ?? 0)}
            />
            <StatCard
              label="Pemilih"
              value={String(results?.totalVoters ?? 0)}
            />
            <StatCard
              label="Partisipasi"
              value={`${results?.turnOut ?? 0}%`}
            />
          </div>

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3">
            <Button
              onClick={() => setView("vote")}
              className="bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
              size="sm"
            >
              <Vote className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
              Mulai Memilih
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("candidates")}
              className="border-blue-200 bg-white/70 text-blue-700 hover:bg-blue-50"
              size="sm"
            >
              Lihat Calon
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView("results")}
              className="text-blue-700 hover:bg-blue-50"
              size="sm"
            >
              <BarChart3 className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
              Live Hasil
            </Button>
          </div>
        </div>
      </section>

      {/* ============== CANDIDATES PREVIEW ============== */}
      <section>
        <div className="mb-4 text-center sm:mb-6">
          <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100 sm:mb-3">
            <Users className="mr-1.5 h-3 w-3" /> Kenali Calon
          </Badge>
          <h2 className="text-xl font-black text-blue-950 sm:text-2xl md:text-3xl">
            Calon Ketua & Wakil OSIS
          </h2>
          <p className="mx-auto mt-1 max-w-2xl text-xs text-blue-700/80 sm:mt-2 sm:text-sm">
            Empat calon utama siap membawa OSIS ke arah yang lebih baik.
          </p>
        </div>

        {candidates.length === 0 ? (
          <Card className="border-blue-100 bg-white/70 backdrop-blur">
            <CardContent className="p-6 text-center text-sm text-blue-700/70 sm:p-8">
              <Users className="mx-auto mb-2 h-8 w-8 text-blue-200" />
              Memuat calon…
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {candidates.map((c, idx) => (
              <Card
                key={c.id}
                onClick={() => setView("candidates")}
                className="group cursor-pointer overflow-hidden border-blue-100 bg-white/80 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
              >
                <div className="relative">
                  <CandidatePhotoPair candidate={c} />
                  <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-black text-blue-700 shadow ring-2 ring-blue-500 sm:h-8 sm:w-8">
                    {idx + 1}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: c.color }}
                  />
                </div>
                <CardContent className="p-3 sm:p-4">
                  <p className="truncate text-sm font-bold text-blue-950 sm:text-base">
                    {c.name}
                  </p>
                  {c.isPair && c.partnerName ? (
                    <p className="truncate text-[11px] text-blue-500 sm:text-xs">
                      &amp; {c.partnerName}
                    </p>
                  ) : null}
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-blue-600 sm:text-xs">
                    <GraduationCap className="h-3 w-3 shrink-0" />
                    <span className="truncate">{c.class}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4 text-center sm:mt-6">
          <Button
            variant="outline"
            onClick={() => setView("candidates")}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            size="sm"
          >
            Lihat Semua Calon <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section>
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="text-xl font-black text-blue-950 sm:text-2xl md:text-3xl">
            Cara Kerja Pemilihan
          </h2>
          <p className="mt-1 text-xs text-blue-700/80 sm:mt-2 sm:text-sm">
            Empat langkah sederhana untuk menyalurkan aspirasimu
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { step: "01", title: "Dapatkan Token", desc: "Panitia membagikan token sekali pakai.", icon: ShieldCheck },
            { step: "02", title: "Masukkan Token", desc: "Gunakan token untuk masuk bilik digital.", icon: Clock },
            { step: "03", title: "Pilih Calon", desc: "Pelajari visi-misi, lalu pilih satu calon.", icon: Vote },
            { step: "04", title: "Selesai", desc: "Suara tercatat aman. Pantau hasil realtime.", icon: CheckCircle2 },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.step}
                className="group relative overflow-hidden border-blue-100 bg-white/80 transition hover:shadow-lg"
              >
                <CardContent className="p-3 sm:p-5">
                  <div className="mb-2 flex items-center justify-between sm:mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white sm:h-11 sm:w-11">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-xl font-black text-blue-100 sm:text-3xl">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-blue-950 sm:text-base">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-blue-700/70 sm:text-sm">
                    {s.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============== FEATURES ============== */}
      <section>
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="text-xl font-black text-blue-950 sm:text-2xl md:text-3xl">
            Kenapa Pemilihan Digital?
          </h2>
          <p className="mt-1 text-xs text-blue-700/80 sm:mt-2 sm:text-sm">
            Cepat, aman, transparan, dan ramah lingkungan
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="overflow-hidden border-blue-100 bg-white/80">
                <CardContent className="p-3 sm:p-5">
                  <div
                    className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md sm:mb-3 sm:h-11 sm:w-11`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-blue-950 sm:text-base">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-blue-700/70 sm:text-sm">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="glass-card border-blue-100">
      <CardContent className="p-2 sm:p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600 sm:text-[11px]">
          {label}
        </p>
        <p className="text-lg font-black text-blue-950 sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}
