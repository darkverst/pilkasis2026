"use client";

import { useEffect, useState } from "react";
import type { Candidate } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Vote, GraduationCap, Target, Sparkles, ArrowRight } from "lucide-react";

export function CandidatesView() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const setView = useAppStore((s) => s.setView);

  useEffect(() => {
    let alive = true;
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((data: Candidate[]) => {
        if (alive) setCandidates(data || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Users className="mr-1.5 h-3 w-3" /> {candidates.length} Calon
        </Badge>
        <h1 className="text-3xl font-black text-blue-950 sm:text-4xl">
          Calon Ketua & Wakil OSIS
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-blue-700/80">
          Kenali visi & misi setiap calon. Klik kartu untuk detail lengkap, lalu gunakan token
          Anda di menu Voting untuk menyalurkan suara.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-blue-100">
              <Skeleton className="h-56 w-full rounded-t-xl" />
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card className="border-blue-100 bg-white/80">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Users className="h-12 w-12 text-blue-200" />
            <p className="text-blue-700">Belum ada calon yang didaftarkan panitia.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c, idx) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              number={idx + 1}
              onSelect={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-blue sm:max-w-2xl">
          {selected && <CandidateDetail candidate={selected} onVote={() => { setSelected(null); setView("vote"); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CandidateCard({
  candidate,
  number,
  onSelect,
}: {
  candidate: Candidate;
  number: number;
  onSelect: () => void;
}) {
  return (
    <Card
      onClick={onSelect}
      className="group cursor-pointer overflow-hidden border-blue-100 bg-white/80 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
    >
      {/* Photo */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        {candidate.photo ? (
           
          <img
            src={candidate.photo}
            alt={`Foto ${candidate.name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl font-black text-blue-200">
              {candidate.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Number badge */}
        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm font-black text-blue-700 shadow ring-2 ring-blue-500">
          {number}
        </div>
        {/* Color accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: candidate.color }}
        />
      </div>

      <CardContent className="p-5">
        <h3 className="text-lg font-bold text-blue-950">{candidate.name}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-blue-600">
          <GraduationCap className="h-3.5 w-3.5" />
          {candidate.class}
        </p>
        <p className="mt-3 line-clamp-2 text-sm text-blue-700/70">
          <span className="font-semibold text-blue-800">Visi:</span> {candidate.vision}
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Lihat Visi & Misi <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function CandidateDetail({
  candidate,
  onVote,
}: {
  candidate: Candidate;
  onVote: () => void;
}) {
  const missions = candidate.mission
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-2xl font-black text-blue-950">
          {candidate.name}
        </DialogTitle>
        <DialogDescription className="flex items-center gap-1.5 text-blue-600">
          <GraduationCap className="h-4 w-4" /> {candidate.class}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-blue-50 sm:h-44 sm:w-40">
          {candidate.photo ? (
             
            <img
              src={candidate.photo}
              alt={`Foto ${candidate.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-5xl font-black text-blue-200">
                {candidate.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-blue-700">
              <Target className="h-4 w-4" /> Visi
            </p>
            <p className="mt-1 text-sm text-blue-900">{candidate.vision}</p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-sm font-bold text-blue-700">
          <Sparkles className="h-4 w-4" /> Misi
        </p>
        {missions.length > 0 ? (
          <ol className="mt-2 space-y-2">
            {missions.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-blue-900">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <span>{m}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-blue-700/70">{candidate.mission}</p>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onVote} className="bg-blue-600 text-white hover:bg-blue-700">
          <Vote className="mr-2 h-4 w-4" /> Pilih Calon Ini
        </Button>
      </div>
    </div>
  );
}
