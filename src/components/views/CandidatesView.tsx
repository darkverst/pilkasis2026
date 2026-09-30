"use client";

import { useEffect, useState } from "react";
import type { Candidate } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Users,
  Vote,
  GraduationCap,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/** Two square photos side-by-side with a blue "&" divider. */
function PairPhotos({
  candidate,
}: {
  candidate: Pick<
    Candidate,
    "photo" | "name" | "isPair" | "partnerPhoto" | "partnerName"
  >;
}) {
  if (!candidate.isPair || !candidate.partnerPhoto) {
    return (
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        {candidate.photo ? (
           
          <img
            src={candidate.photo}
            alt={`Foto ${candidate.name}`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl font-black text-blue-200">
              {candidate.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="relative flex aspect-square w-full items-stretch gap-1">
      <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        {candidate.photo ? (
           
          <img
            src={candidate.photo}
            alt={`Foto ${candidate.name}`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-black text-blue-200">
              {candidate.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center px-0.5">
        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-black text-white shadow sm:text-sm">
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
            <span className="text-5xl font-black text-blue-200">
              {candidate.partnerName.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="space-y-5 sm:space-y-6">
      <div className="text-center">
        <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100 sm:mb-3">
          <Users className="mr-1.5 h-3 w-3" /> {candidates.length} Calon
        </Badge>
        <h1 className="text-2xl font-black text-blue-950 sm:text-3xl md:text-4xl">
          Calon Ketua & Wakil OSIS
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-xs text-blue-700/80 sm:mt-2 sm:text-sm">
          Kenali visi & misi setiap calon. Klik kartu untuk detail lengkap, lalu
          gunakan token Anda di menu Voting untuk menyalurkan suara.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-blue-100">
              <Skeleton className="aspect-square w-full rounded-t-xl" />
              <CardContent className="space-y-2 p-3 sm:space-y-3 sm:p-5">
                <Skeleton className="h-4 w-3/4 sm:h-5" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-9 w-full sm:h-12" />
                <Skeleton className="h-8 w-full sm:h-9" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card className="border-blue-100 bg-white/80">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center sm:p-12">
            <Users className="h-12 w-12 text-blue-200" />
            <p className="text-sm text-blue-700 sm:text-base">
              Belum ada calon yang didaftarkan panitia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
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
          {selected && (
            <CandidateDetail
              candidate={selected}
              onVote={() => {
                setSelected(null);
                setView("vote");
              }}
            />
          )}
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
      {/* Photo / Photo pair */}
      <div className="relative">
        <PairPhotos candidate={candidate} />
        {/* Number badge */}
        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-black text-blue-700 shadow ring-2 ring-blue-500 sm:h-9 sm:w-9 sm:text-sm">
          {number}
        </div>
        {/* Color accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: candidate.color }}
        />
      </div>

      <CardContent className="p-3 sm:p-5">
        <h3 className="truncate text-sm font-bold text-blue-950 sm:text-base sm:text-lg">
          {candidate.name}
        </h3>
        {candidate.isPair && candidate.partnerName ? (
          <p className="truncate text-[11px] font-medium text-blue-500 sm:text-xs">
            &amp; {candidate.partnerName}
            {candidate.partnerClass ? (
              <span className="text-blue-400"> &middot; {candidate.partnerClass}</span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-600 sm:text-xs">
          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{candidate.class}</span>
        </p>
        <p className="mt-2 line-clamp-2 text-[11px] text-blue-700/70 sm:text-sm">
          <span className="font-semibold text-blue-800">Visi:</span> {candidate.vision}
        </p>
        <Button
          variant="outline"
          className="mt-3 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
          size="sm"
        >
          Lihat Visi & Misi <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
        <DialogTitle className="text-xl font-black text-blue-950 sm:text-2xl">
          {candidate.name}
        </DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-1.5 text-blue-600">
          <GraduationCap className="h-4 w-4" /> {candidate.class}
          {candidate.isPair && candidate.partnerName ? (
            <span className="text-blue-500">
              &middot; w/ {candidate.partnerName}
              {candidate.partnerClass ? ` (${candidate.partnerClass})` : ""}
            </span>
          ) : null}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="relative w-full shrink-0 overflow-hidden rounded-xl bg-blue-50 sm:w-44">
          <PairPhotos candidate={candidate} />
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
