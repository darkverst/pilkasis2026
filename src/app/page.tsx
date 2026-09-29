"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket-client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HomeView } from "@/components/views/HomeView";
import { CandidatesView } from "@/components/views/CandidatesView";
import { VotingView } from "@/components/views/VotingView";
import { ResultsView } from "@/components/views/ResultsView";
import { AdminView } from "@/components/views/AdminView";
import type { Settings } from "@/lib/types";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const results = useAppStore((s) => s.results);
  const setResults = useAppStore((s) => s.setResults);
  const setSocketConnected = useAppStore((s) => s.setSocketConnected);

  // Load settings + initial results
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => setSettings(s))
      .catch(() => {});
    fetch("/api/results")
      .then((r) => r.json())
      .then((data) => setResults(data))
      .catch(() => {});
  }, [setSettings, setResults]);

  // Keep a single global socket connection alive across view switches
  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [setSocketConnected]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar settings={settings} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {view === "home" && <HomeView settings={settings} results={results} />}
        {view === "candidates" && <CandidatesView />}
        {view === "vote" && <VotingView />}
        {view === "results" && <ResultsView />}
        {view === "admin" && <AdminView />}
      </main>
      <Footer settings={settings} />
    </div>
  );
}
