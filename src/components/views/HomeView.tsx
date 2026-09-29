"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import type { ElectionResults, Settings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, BarChart3, ShieldCheck, ArrowRight, Clock, CheckCircle2, Radio } from "lucide-react";

const ElectionHero = dynamic(() => import("@/components/three/ElectionHero"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] w-full items-center justify-center bg-gradient-to-br from-blue-100 via-sky-50 to-white">
      <div className="animate-pulse text-blue-400">Memuat visualisasi 3D…</div>
    </div>
  ),
});

export function HomeView({
  settings,
  results,
}: {
  settings: Settings | null;
  results: ElectionResults | null;
}) {
  const setView = useAppStore((s) => s.setView);

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
      color: "from-indigo-400 to-blue-500",
    },
    {
      icon: Users,
      title: "Siswa & Guru",
      desc: "Seluruh siswa dan guru ikut menentukan pilihan dengan peran masing-masing.",
      color: "from-cyan-500 to-blue-500",
    },
  ];

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-lg shadow-blue-100/40 lg:grid-cols-5">
        {/* Text column */}
        <div className="relative z-10 px-5 py-8 sm:px-10 sm:py-12 lg:col-span-2 lg:flex lg:flex-col lg:justify-center">
          <Badge className="mb-4 w-fit bg-blue-100 text-blue-700 hover:bg-blue-100">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Pemilihan Sedang Berlangsung
          </Badge>
          <h1 className="text-3xl font-black leading-tight text-blue-950 sm:text-4xl xl:text-5xl">
            {settings?.electionTitle || "Pemilihan Ketua & Wakil OSIS 2025"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-blue-800/80 sm:text-base">
            {settings?.electionDescription ||
              "Pilih pemimpin OSIS pilihanmu untuk periode 2025/2026."}
          </p>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Card className="glass-card min-w-[110px] border-blue-100">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
                    Total Suara
                  </p>
                  <p className="text-2xl font-black text-blue-950">
                    {results?.totalVotes ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card min-w-[120px] border-blue-100">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
                    Pemilih
                  </p>
                  <p className="text-2xl font-black text-blue-950">
                    {results?.totalVoters ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card min-w-[120px] border-blue-100">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
                    Partisipasi
                  </p>
                  <p className="text-2xl font-black text-blue-950">
                    {results?.turnOut ?? 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => setView("vote")}
                className="bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
              >
                <Vote className="mr-2 h-5 w-5" />
                Mulai Memilih
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView("candidates")}
                className="border-blue-200 bg-white/70 text-blue-700 hover:bg-blue-50"
              >
                Lihat Calon
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setView("results")}
                className="text-blue-700 hover:bg-blue-50"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Live Hasil
              </Button>
            </div>
        </div>

        {/* 3D hero canvas column — prominent Three.js visual */}
        <div className="relative min-h-[320px] bg-gradient-to-br from-sky-100/40 to-blue-50 lg:col-span-3">
          <ElectionHero schoolName={settings?.schoolName} height={440} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-blue-950 sm:text-3xl">
            Cara Kerja Pemilihan
          </h2>
          <p className="mt-2 text-sm text-blue-700/80">
            Empat langkah sederhana untuk menyalurkan aspirasimu
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "01", title: "Dapatkan Token", desc: "Panitia membagikan token sekali pakai kepada setiap pemilih.", icon: ShieldCheck },
            { step: "02", title: "Masukkan Token", desc: "Gunakan token untuk masuk ke bilik suara digital.", icon: Clock },
            { step: "03", title: "Pilih Calon", desc: "Pelajari visi-misi, lalu pilih satu calon OSIS pilihanmu.", icon: Vote },
            { step: "04", title: "Selesai", desc: "Suara tercatat aman. Pantau hasilnya secara realtime.", icon: CheckCircle2 },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} className="group relative overflow-hidden border-blue-100 bg-white/80 transition hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-black text-blue-100">{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-blue-950">{s.title}</h3>
                  <p className="mt-1 text-sm text-blue-700/70">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-blue-950 sm:text-3xl">
            Kenapa Pemilihan Digital?
          </h2>
          <p className="mt-2 text-sm text-blue-700/80">
            Cepat, aman, transparan, dan ramah lingkungan
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="overflow-hidden border-blue-100 bg-white/80">
                <CardContent className="p-5">
                  <div
                    className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-blue-950">{f.title}</h3>
                  <p className="mt-1 text-sm text-blue-700/70">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
