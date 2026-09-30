import { db } from "@/lib/db";

export interface CandidateResult {
  id: string;
  name: string;
  class: string;
  photo: string;
  color: string;
  order: number;
  voteCount: number;
  percentage: number;
  isPair: boolean;
  partnerName: string;
  partnerClass: string;
  partnerPhoto: string;
}

export interface ElectionResults {
  totalVoters: number;
  totalVotes: number;
  turnOut: number; // percentage
  candidates: CandidateResult[];
  lastUpdated: string;
}

// Compute the current election tallies from the database
export async function computeResults(): Promise<ElectionResults> {
  const [candidates, voters, settings] = await Promise.all([
    db.candidate.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { votes: true } } },
    }),
    db.voter.count(),
    db.settings.findUnique({ where: { id: "default" } }),
  ]);

  const totalVotes = candidates.reduce((s, c) => s + c._count.votes, 0);
  const totalVoters = settings?.totalVoters || voters;

  const candidateResults: CandidateResult[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    class: c.class,
    photo: c.photo,
    color: c.color,
    order: c.order,
    voteCount: c._count.votes,
    percentage: totalVotes > 0 ? Math.round((c._count.votes / totalVotes) * 1000) / 10 : 0,
    isPair: c.isPair,
    partnerName: c.partnerName,
    partnerClass: c.partnerClass,
    partnerPhoto: c.partnerPhoto,
  }));

  return {
    totalVoters,
    totalVotes,
    turnOut: totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 1000) / 10 : 0,
    candidates: candidateResults,
    lastUpdated: new Date().toISOString(),
  };
}
