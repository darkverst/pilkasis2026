import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pemilihan OSIS Digital | Sistem Voting Sekolah",
  description:
    "Aplikasi pemilihan Ketua & Wakil OSIS berbasis token sekali pakai, aman, transparan, dan realtime dengan visualisasi 3D.",
  keywords: [
    "OSIS",
    "pemilihan osis",
    "voting sekolah",
    "e-voting",
    "sistem pemilihan",
    "realtime results",
    "three.js",
  ],
  authors: [{ name: "Panitia OSIS" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Pemilihan OSIS Digital",
    description: "Sistem voting OSIS dengan token sekali pakai & hasil realtime",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pemilihan OSIS Digital",
    description: "Sistem voting OSIS dengan token sekali pakai & hasil realtime",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
