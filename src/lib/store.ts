"use client";

import { create } from "zustand";
import type { ElectionResults, Settings } from "@/lib/types";

export type ViewKey = "home" | "candidates" | "vote" | "results" | "admin";

interface AppState {
  // Navigation
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // Settings (loaded once)
  settings: Settings | null;
  setSettings: (s: Settings) => void;

  // Live results (updated by socket + polling)
  results: ElectionResults | null;
  setResults: (r: ElectionResults) => void;

  // Online viewer count (socket)
  onlineViewers: number;
  setOnlineViewers: (n: number) => void;

  // Last vote-cast feed event
  lastVoteCast:
    | {
        candidateId: string;
        candidateName: string;
        candidatePhoto: string;
        candidateColor: string;
        totalVotes: number;
        timestamp: string;
      }
    | null;
  setLastVoteCast: (v: AppState["lastVoteCast"]) => void;

  // Socket connection state
  socketConnected: boolean;
  setSocketConnected: (b: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "home",
  setView: (view) => set({ view }),

  settings: null,
  setSettings: (settings) => set({ settings }),

  results: null,
  setResults: (results) => set({ results }),

  onlineViewers: 0,
  setOnlineViewers: (onlineViewers) => set({ onlineViewers }),

  lastVoteCast: null,
  setLastVoteCast: (lastVoteCast) => set({ lastVoteCast }),

  socketConnected: false,
  setSocketConnected: (socketConnected) => set({ socketConnected }),
}));
