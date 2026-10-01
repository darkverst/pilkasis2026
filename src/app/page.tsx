"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
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

// Dynamic import — SSR-safe (the component itself is also SSR-safe, but
// dynamic + ssr:false avoids shipping the three.js bundle to the server).
const PageBackground3D = dynamic(
  () => import("@/components/three/PageBackground3D"),
  { ssr: false },
);

export default function Home() {
  const view = useAppStore((s) => s.view);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const results = useAppStore((s) => s.results);
  const setResults = useAppStore((s) => s.setResults);
  const setSocketConnected = useAppStore((s) => s.setSocketConnected);
  const setOnlineViewers = useAppStore((s) => s.setOnlineViewers);

  // Load settings + initial results
  useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        if (alive) setSettings(s);
      })
      .catch(() => {});
    fetch("/api/results")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data && Array.isArray(data.candidates)) setResults(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [setSettings, setResults]);

  // Dynamically update browser tab favicon when school logo is loaded or changed
  useEffect(() => {
    if (settings?.schoolLogo) {
      const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          link.href = settings.schoolLogo;
        });
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = settings.schoolLogo;
        document.head.appendChild(link);
      }
    }
  }, [settings?.schoolLogo]);

  // Keep a single global socket connection alive across view switches.
  // On Vercel/serverless without a socket service, getSocket() returns null
  // and we silently fall back to HTTP polling — no socket setup happens here.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onOnline = (data: { count: number }) => setOnlineViewers(data.count);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("voter:online", onOnline);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("voter:online", onOnline);
    };
  }, [setSocketConnected, setOnlineViewers]);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Deepest layer: ambient 3D backdrop, fixed behind everything. */}
      <PageBackground3D settings={settings} />

      <Navbar settings={settings} />
      <main className="mx-auto w-full max-w-[1700px] flex-1 px-3 py-4 pb-24 sm:px-6 sm:py-8 md:pb-8 lg:px-10 xl:px-16">
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
