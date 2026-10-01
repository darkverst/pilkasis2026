// Shared types for the OSIS election app — used by API, UI, and socket service.

export interface Candidate {
  id: string;
  name: string;
  class: string;
  photo: string;
  vision: string;
  mission: string;
  order: number;
  color: string;
  isPair: boolean;
  partnerName: string;
  partnerClass: string;
  partnerPhoto: string;
}

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
  turnOut: number;
  candidates: CandidateResult[];
  lastUpdated: string;
}

export interface Settings {
  schoolName: string;
  schoolLogo: string;
  electionTitle: string;
  electionDescription: string;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
  totalVoters: number;
  resultsPublic: boolean;
  bgBlur?: number;
  bgOpacity?: number;
  hasCustomPassword?: boolean;
}

export interface VoterInfo {
  id: string;
  token: string;
  role: "student" | "teacher";
  name: string | null;
  hasVoted: boolean;
  votedAt: string | null;
  batch: string | null;
  createdAt: string;
}

export interface TokenStats {
  total: number;
  voted: number;
  unvoted: number;
  students: { total: number; voted: number };
  teachers: { total: number; voted: number };
}

