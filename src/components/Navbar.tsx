"use client";

import { useAppStore, type ViewKey } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Home, Users, Vote, BarChart3, ShieldCheck, Radio } from "lucide-react";

const TABS: { key: ViewKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Beranda", icon: Home },
  { key: "candidates", label: "Calon OSIS", icon: Users },
  { key: "vote", label: "Voting", icon: Vote },
  { key: "results", label: "Live Hasil", icon: BarChart3 },
  { key: "admin", label: "Panitia", icon: ShieldCheck },
];

export function Navbar({ settings }: { settings: Settings | null }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const socketConnected = useAppStore((s) => s.socketConnected);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-card border-b border-white/40 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          {/* Logo + title */}
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-3 text-left"
            aria-label="Beranda"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow ring-1 ring-blue-100">
              {settings?.schoolLogo ? (
                 
                <img
                  src={settings.schoolLogo}
                  alt={`Logo ${settings.schoolName}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-lg font-black text-blue-600">
                  {settings?.schoolName?.charAt(0) || "S"}
                </span>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-blue-950">
                {settings?.schoolName || "SMA Negeri 1"}
              </p>
              <p className="text-[11px] leading-tight text-blue-700/70">
                {settings?.electionTitle || "Pemilihan OSIS"}
              </p>
            </div>
          </button>

          {/* Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto rounded-full bg-blue-50/80 p-1 backdrop-blur scrollbar-blue">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = view === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm",
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-blue-700 hover:bg-blue-100"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.key === "results" && socketConnected && (
                    <Radio className="h-3 w-3 animate-pulse text-emerald-300 sm:hidden md:inline" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
