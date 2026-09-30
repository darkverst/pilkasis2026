"use client";

import { useState } from "react";
import { useAppStore, type ViewKey } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Vote,
  BarChart3,
  ShieldCheck,
  Radio,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS: { key: ViewKey; label: string; short: string; icon: typeof Home }[] = [
  { key: "home", label: "Beranda", short: "Beranda", icon: Home },
  { key: "candidates", label: "Calon", short: "Calon", icon: Users },
  { key: "vote", label: "Voting", short: "Voting", icon: Vote },
  { key: "results", label: "Hasil", short: "Hasil", icon: BarChart3 },
  { key: "admin", label: "Panitia", short: "Panitia", icon: ShieldCheck },
];

const SCHOOL_FALLBACK = "SMP Negeri 1";

export function Navbar({ settings }: { settings: Settings | null }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const socketConnected = useAppStore((s) => s.socketConnected);
  const [menuOpen, setMenuOpen] = useState(false);

  const schoolName = settings?.schoolName || SCHOOL_FALLBACK;

  const go = (k: ViewKey) => {
    setView(k);
    setMenuOpen(false);
  };

  return (
    <>
      {/* ============================================================
          TOP BAR — visible on every breakpoint
          Mobile/tablet: logo + (tablet) hamburger
          Desktop: logo + horizontal pill tabs
         ============================================================ */}
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-card border-b border-white/40 shadow-sm">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-10 xl:px-16">
            {/* Logo + title */}
            <button
              onClick={() => go("home")}
              className="flex min-w-0 items-center gap-2.5 text-left sm:gap-3"
              aria-label="Beranda"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow ring-1 ring-blue-100 sm:h-11 sm:w-11">
                {settings?.schoolLogo ? (
                   
                  <img
                    src={settings.schoolLogo}
                    alt={`Logo ${schoolName}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-base font-black text-blue-600 sm:text-lg">
                    {schoolName.charAt(0) || "S"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold leading-tight text-blue-950 sm:text-sm">
                  {schoolName}
                </p>
                <p className="hidden truncate text-[11px] leading-tight text-blue-700/70 sm:block">
                  {settings?.electionTitle || "Pemilihan OSIS"}
                </p>
              </div>
            </button>

            {/* ---- Desktop (lg+): horizontal pill tabs ---- */}
            <nav className="hidden items-center gap-1 overflow-x-auto rounded-full bg-blue-50/80 p-1 backdrop-blur scrollbar-blue lg:flex">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = view === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => go(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all xl:px-4 xl:text-sm",
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-blue-700 hover:bg-blue-100",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.key === "results" && socketConnected && (
                      <Radio className="h-3 w-3 animate-pulse text-emerald-300" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* ---- Tablet (md–lg): hamburger button ---- */}
            <Button
              onClick={() => setMenuOpen((v) => !v)}
              variant="outline"
              size="sm"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              className="border-blue-200 bg-white/70 text-blue-700 hover:bg-blue-50 md:inline-flex lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="ml-1.5 text-xs font-semibold">Menu</span>
            </Button>
          </div>

          {/* Tablet dropdown */}
          {menuOpen && (
            <div className="border-t border-blue-100 bg-white/95 backdrop-blur lg:hidden">
              <nav className="mx-auto grid max-w-[1700px] grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-2 sm:px-4">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = view === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => go(tab.key)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-blue-600 text-white shadow"
                          : "text-blue-800 hover:bg-blue-50",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                      {tab.key === "results" && socketConnected && (
                        <Radio className="ml-auto h-3 w-3 animate-pulse text-emerald-300" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================
          MOBILE (<md): FIXED BOTTOM NAV — 5 items, icons + labels
          Active indicator bar + safe-area-inset
         ============================================================ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-100 bg-white/95 backdrop-blur-md md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Navigasi utama"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.key;
            return (
              <li key={tab.key} className="flex-1">
                <button
                  onClick={() => go(tab.key)}
                  className={cn(
                    "relative flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
                    active ? "text-blue-600" : "text-blue-400 hover:text-blue-600",
                  )}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.label}
                >
                  {/* Active indicator bar */}
                  <span
                    className={cn(
                      "absolute top-0 h-0.5 w-8 rounded-b-full transition-all",
                      active ? "bg-blue-600" : "bg-transparent",
                    )}
                  />
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active ? "scale-110" : "scale-100",
                    )}
                  />
                  <span className="leading-none">{tab.short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
