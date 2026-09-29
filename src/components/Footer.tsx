"use client";

import type { Settings } from "@/lib/types";
import { Heart } from "lucide-react";

export function Footer({ settings }: { settings: Settings | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto w-full border-t border-blue-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-blue-700/80 sm:flex-row sm:text-left">
        <p>
          &copy; {year} {settings?.schoolName || "SMA Negeri 1 Nusantara"} &middot; Sistem Pemilihan
          OSIS Digital
        </p>
        <p className="flex items-center gap-1.5">
          Dibuat dengan <Heart className="h-3 w-3 fill-rose-400 text-rose-400" /> untuk demokrasi
          sekolah
        </p>
      </div>
    </footer>
  );
}
