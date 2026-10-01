"use client";

import type { Settings } from "@/lib/types";
import { Heart } from "lucide-react";

const SCHOOL_FALLBACK = "SMP Negeri 1";

export function Footer({ settings }: { settings: Settings | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto w-full border-t border-blue-100 bg-white/70 backdrop-blur pb-16 md:pb-0">
      <div className="mx-auto flex max-w-[1700px] flex-col items-center justify-between gap-2 px-3 py-4 text-center text-xs text-blue-700/80 sm:px-6 sm:flex-row sm:text-left lg:px-10 xl:px-16">
        <p>
          &copy; {year} {settings?.schoolName || SCHOOL_FALLBACK} &middot; Sistem
          Pemilihan OSIS Digital
        </p>
        <p className="flex items-center gap-1.5 font-medium">
          Dibuat dengan <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 inline-block" />{" "}
          oleh <span className="font-semibold text-blue-900">MGMP Informatika Banyuwangi 2026</span>
        </p>
      </div>
    </footer>
  );
}
