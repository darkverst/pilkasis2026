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
  Trophy,
  KeyRound,
  Search,
  Sparkles,
  Heart,
} from "lucide-react";

/** Render a candidate's photo — single or pair (side-by-side or combined). */
function CandidatePhoto({ candidate }: { candidate: Candidate }) {
  // Pair with separate photos → show two side by side with "&" divider
  if (candidate.isPair && candidate.partnerPhoto) {
    return (
      <div className="relative flex aspect-square w-full items-stretch gap-0.5 overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="relative flex-1 overflow-hidden">
          {candidate.photo ? (
             
            <img src={candidate.photo} alt={candidate.name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-black text-blue-200">{candidate.name.charAt(0)}</div>
          )}
        </div>
        <div className="z-10 flex items-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-md sm:h-8 sm:w-8">&amp;</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {candidate.partnerPhoto ? (
             
            <img src={candidate.partnerPhoto} alt={candidate.partnerName} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-black text-blue-200">{candidate.partnerName?.charAt(0) || "?"}</div>
          )}
        </div>
      </div>
    );
  }
  // Single photo (individual, OR pair with combined photo)
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
      {candidate.photo ? (
         
        <img src={candidate.photo} alt={candidate.name} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl font-black text-blue-200 sm:text-6xl">{candidate.name.charAt(0)}</div>
      )}
    </div>
  );
}

/** Build a display name — "Andi & Dewi" for pairs, "Andi" for individual. */
function displayName(c: Candidate): string {
  if (c.isPair && c.partnerName) {
    const first = c.name.split(" ")[0];
    const partner = c.partnerName.split(" ")[0];
    return `${first} & ${partner}`;
  }
  return c.name;
}

/** Build a class string — "IX A & IX B" for pairs with different classes. */
function displayClass(c: Candidate): string {
  if (c.isPair && c.partnerClass && c.partnerClass !== c.class) {
    return `${c.class} & ${c.partnerClass}`;
  }
  return c.class;
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

  // Find the current leader for the highlight badge
  const leader = results?.candidates
    ? [...results.candidates].sort((a, b) => b.voteCount - a.voteCount)[0]
    : null;

  // How-it-works steps — improved flow with better descriptions
  const steps = [
    {
      step: 1,
      title: "Dapatkan Token",
      desc: "Panitia membagikan token rahasia sekali pakai kepada setiap pemilih yang sah.",
      icon: KeyRound,
      color: "from-blue-500 to-sky-500",
    },
    {
      step: 2,
      title: "Masukkan Token",
      desc: "Buka menu Voting, masukkan token Anda untuk masuk ke bilik suara digital.",
      icon: ShieldCheck,
      color: "from-sky-500 to-cyan-500",
    },
    {
      step: 3,
      title: "Pilih Calon",
      desc: "Pelajari visi & misi setiap calon, lalu pilih SATU calon pilihanmu dengan konfirmasi.",
      icon: Vote,
      color: "from-cyan-500 to-blue-500",
    },
    {
      step: 4,
      title: "Selesai & Pantau",
      desc: "Suara tercatat aman. Token dinonaktifkan otomatis. Pantau hasil secara realtime.",
      icon: CheckCircle2,
      color: "from-indigo-400 to-blue-500",
    },
  ];

  const features = [
    {
      icon: Vote,
      title: "Satu Suara, Satu Token",
      desc: "Token sekali pakai menjamin satu orang = satu suara. Tidak bisa curang.",
      color: "from-blue-500 to-sky-500",
    },
    {
      icon: Radio,
      title: "Hasil Realtime",
      desc: "Pantau perolehan suara langsung dengan grafik 2D & visualisasi 3D interaktif.",
      color: "from-sky-500 to-cyan-500",
    },
    {
      icon: ShieldCheck,
      title: "Aman & Transparan",
      desc: "Token terenkripsi, suara anonim, data terverifikasi. Transparan untuk warga sekolah.",
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
    <div className="space-y-8 sm:space-y-12">
      {/* ============== HERO — rich gradient banner ============== */}
      <section className="relative overflow-hidden rounded-2xl shadow-2xl shadow-blue-300/30 sm:rounded-3xl">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400" />
        {/* Decorative blurred orbs */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute right-1/4 top-0 h-40 w-40 rounded-full bg-indigo-400/30 blur-2xl" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div className="relative px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="text-center">
            {/* Animated status badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md ring-1 ring-white/30 sm:mb-5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-bold text-white sm:text-sm">
                Pemilihan Sedang Berlangsung
              </span>
            </div>

            {/* Title with gradient text effect on dark bg */}
            <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
              {settings?.electionTitle || "Pemilihan Ketua & Wakil OSIS 2025"}
            </h1>

            {/* Description */}
            <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-50 sm:mt-4 sm:text-base lg:text-lg">
              {settings?.electionDescription ||
                "Pilih pemimpin OSIS pilihanmu untuk periode 2025/2026."}
            </p>
          </div>

          {/* Quick stats — glass cards on gradient bg */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
            <HeroStat
              icon={Vote}
              label="Total Suara"
              value={String(results?.totalVotes ?? 0)}
            />
            <HeroStat
              icon={Users}
              label="Pemilih"
              value={String(results?.totalVoters ?? 0)}
            />
            <HeroStat
              icon={BarChart3}
              label="Partisipasi"
              value={`${results?.turnOut ?? 0}%`}
            />
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
            <Button
              onClick={() => setView("vote")}
              className="bg-white text-blue-700 shadow-xl shadow-blue-900/20 hover:bg-blue-50"
              size="sm"
            >
              <Vote className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
              Mulai Memilih
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("candidates")}
              className="border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              size="sm"
            >
              <Search className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Lihat Calon
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView("results")}
              className="text-white hover:bg-white/15 hover:text-white"
              size="sm"
            >
              <BarChart3 className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
              Live Hasil
            </Button>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
          style={{ height: "40px" }}
        >
          <path
            d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z"
            fill="white"
            fillOpacity="0.95"
          />
        </svg>
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
            Kenali pasangan calon pilihanmu sebelum menyalurkan suara.
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
            {candidates.map((c, idx) => {
              const result = results?.candidates.find((r) => r.id === c.id);
              const isLeader = leader?.id === c.id && (leader?.voteCount ?? 0) > 0;
              return (
                <Card
                  key={c.id}
                  onClick={() => setView("candidates")}
                  className="group cursor-pointer overflow-hidden border-blue-100 bg-white/85 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
                >
                  <div className="relative">
                    <CandidatePhoto candidate={c} />
                    {/* Number badge */}
                    <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-black text-blue-700 shadow ring-2 ring-blue-500 sm:h-8 sm:w-8">
                      {idx + 1}
                    </div>
                    {/* Leader badge */}
                    {isLeader && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow sm:text-xs">
                        <Trophy className="h-3 w-3" /> Terdepan
                      </div>
                    )}
                    {/* Color accent bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: c.color }}
                    />
                  </div>
                  <CardContent className="p-3 sm:p-4">
                    {/* Paslon name — prominent */}
                    <p className="truncate text-sm font-bold text-blue-950 sm:text-base">
                      {displayName(c)}
                    </p>
                    {/* Class — shows both classes if different */}
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-blue-600 sm:text-xs">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{displayClass(c)}</span>
                    </p>
                    {/* Vote count if available */}
                    {result && result.voteCount > 0 && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-blue-700 sm:text-xs">
                        <span className="font-semibold">{result.voteCount} suara</span>
                        <span>{result.percentage}%</span>
                      </div>
                    )}
                    {/* Pair badge */}
                    {c.isPair && (
                      <Badge className="mt-2 bg-blue-50 text-blue-600 hover:bg-blue-50 text-[10px]">
                        <Users className="mr-1 h-2.5 w-2.5" /> Pasangan
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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

      {/* ============== HOW IT WORKS — improved timeline flow ============== */}
      <section>
        <div className="mb-4 text-center sm:mb-6">
          <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100 sm:mb-3">
            <Sparkles className="mr-1.5 h-3 w-3" /> Panduan
          </Badge>
          <h2 className="text-xl font-black text-blue-950 sm:text-2xl md:text-3xl">
            Cara Kerja Pemilihan
          </h2>
          <p className="mt-1 text-xs text-blue-700/80 sm:mt-2 sm:text-sm">
            Empat langkah mudah untuk menyalurkan aspirasimu
          </p>
        </div>

        {/* Desktop: horizontal timeline with connecting line */}
        <div className="relative hidden lg:block">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-[44px] h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />
          <div className="relative grid grid-cols-4 gap-4">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div className={`flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-white shadow-lg ring-4 ring-white`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  {/* Step number badge */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                      {s.step}
                    </span>
                    <h3 className="text-sm font-bold text-blue-950">{s.title}</h3>
                  </div>
                  <p className="mt-1.5 max-w-[200px] text-xs text-blue-700/70">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet: vertical steps */}
        <div className="space-y-3 lg:hidden">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} className="group relative overflow-hidden border-blue-100 bg-white/85 backdrop-blur transition hover:shadow-lg">
                <CardContent className="flex items-start gap-3 p-3 sm:p-4">
                  {/* Step icon with number */}
                  <div className="relative shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md sm:h-14 sm:w-14`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white ring-2 ring-white">
                      {s.step}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-blue-950 sm:text-base">{s.title}</h3>
                    <p className="mt-0.5 text-xs text-blue-700/70 sm:text-sm">{s.desc}</p>
                  </div>
                  {/* Arrow connector (except last) */}
                  {idx < steps.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-blue-200 sm:block" />
                  )}
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
              <Card key={f.title} className="overflow-hidden border-blue-100 bg-white/80 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-3 sm:p-5">
                  <div
                    className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md sm:mb-3 sm:h-11 sm:w-11`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-blue-950 sm:text-base">{f.title}</h3>
                  <p className="mt-1 text-[11px] text-blue-700/70 sm:text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ============== CTA FOOTER ============== */}
      <section>
        <Card className="overflow-hidden border-blue-200 bg-gradient-to-r from-blue-600 to-sky-500">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <Heart className="h-8 w-8 text-white animate-pulse" />
            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">Suara Anda Menentukan Masa Depan OSIS</h2>
              <p className="mt-1 text-sm text-blue-50">Gunakan hak pilihmu sekarang — satu token, satu suara, untuk perubahan yang lebih baik.</p>
            </div>
            <Button
              onClick={() => setView("vote")}
              className="bg-white text-blue-700 shadow-lg hover:bg-blue-50"
              size="sm"
            >
              <Vote className="mr-1.5 h-4 w-4" />
              Mulai Memilih
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/** Hero stat card — glassmorphism style for the gradient hero background. */
function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Vote;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/15 px-2 py-3 text-center backdrop-blur-md ring-1 ring-white/20 transition hover:bg-white/25 sm:px-4 sm:py-4">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white/25 sm:h-9 sm:w-9">
        <Icon className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
      </div>
      <p className="text-lg font-black text-white sm:text-2xl">{value}</p>
      <p className="text-[9px] font-medium uppercase tracking-wide text-blue-50 sm:text-[11px]">{label}</p>
    </div>
  );
}
