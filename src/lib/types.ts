// Shared types for the OSIS election app — used by API, UI, and socket service.

export interface Candidate {
  id: string;
  name: string;
  class: string;
  photo: string; // data URL or path
  vision: string;
  mission: string;
  order: number;
  color: string;
}

export interface CandidateResult {
  id: string;
  name: string;
  class: string;
  photo: string;
  color: string;
  order: number;
  voteCount: number;
  percentage: number; // 0-100 with one decimal
}

export interface ElectionResults {
  totalVoters: number;
  totalVotes: number;
  turnOut: number; // 0-100 with one decimal
  candidates: CandidateResult[];
  lastUpdated: string; // ISO string
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

// Real-time socket events (socket.io, port 3003, path "/")
// Client emits: "subscribe:results"
// Server emits:
//   - "results:update"  payload: ElectionResults
//   - "vote:cast"       payload: { candidateId, candidateName, candidatePhoto, candidateColor, totalVotes, timestamp }
//   - "voter:online"    payload: { count }
