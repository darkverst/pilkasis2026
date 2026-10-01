"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Lock,
  Loader2,
  Users,
  Vote,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  UserCog,
  Printer,
  FileText,
  CalendarClock,
  Eye,
  EyeOff,
  Search,
  Trash,
  Sparkles,
} from "lucide-react";
import type { Candidate, ElectionResults, Settings, VoterInfo } from "@/lib/types";
import {
  generateElectionReportHTML,
  openReportInNewTab,
} from "@/lib/report";

interface TokenStats {
  total: number;
  voted: number;
  unvoted: number;
  students: { total: number; voted: number };
  teachers: { total: number; voted: number };
}

type SortKey = "newest" | "oldest" | "batch" | "voted-first" | "unvoted-first";

const PAGE_SIZE = 12;

/* ============================== HELPERS ============================== */

/**
 * Authenticated fetch wrapper for admin endpoints.
 * - On 401, calls onUnauthorized (sets authed=false) and returns null.
 * - On other non-OK responses, throws an Error with the server's message.
 * - On success, returns parsed JSON.
 */
async function adminFetch<T>(
  url: string,
  onUnauthorized: () => void,
  options?: RequestInit,
): Promise<T | null> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });
  if (res.status === 401) {
    onUnauthorized();
    return null;
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* ignore JSON parse error */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/* ============================== ROOT ============================== */
export function AdminView() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/check", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { authenticated: boolean }) => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

/* ============================== LOGIN ============================== */
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submit = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Login gagal.");
        return;
      }
      toast({ title: "Selamat datang, Panitia!", description: "Anda berhasil masuk." });
      onSuccess();
    } catch {
      setError("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-blue-100 bg-white/85 shadow-xl shadow-blue-100/40">
        <CardContent className="p-5 sm:p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 sm:mb-4 sm:h-14 sm:w-14">
              <Lock className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="text-xl font-black text-blue-950 sm:text-2xl">
              Login Panitia
            </h2>
            <p className="mt-2 text-xs text-blue-700/80 sm:text-sm">
              Masukkan password panitia untuk mengelola pemilihan OSIS.
            </p>
          </div>
          <div className="mt-5 space-y-3 sm:mt-6">
            <Label htmlFor="pw" className="text-blue-800">
              Password Panitia
            </Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="border-blue-200 focus:border-blue-500"
              autoFocus
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button
              onClick={submit}
              disabled={loading || !password}
              className="w-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Masuk
            </Button>
            <p className="rounded-lg bg-blue-50 p-3 text-center text-xs text-blue-700/80">
              Default: <span className="font-mono font-bold">panitia2025</span>{" "}
              (atur via env <span className="font-mono">ADMIN_PASSWORD</span>)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("overview");
  const { toast } = useToast();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    toast({ title: "Anda telah keluar." });
    onLogout();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge className="mb-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100 sm:mb-2">
            <UserCog className="mr-1.5 h-3 w-3" /> Panel Panitia
          </Badge>
          <h1 className="text-xl font-black text-blue-950 sm:text-2xl md:text-3xl">
            Dashboard Pemilihan
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
          size="sm"
        >
          <LogOut className="mr-1.5 h-4 w-4" /> Keluar
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-blue-50/80 p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <BarChart3 className="mr-1.5 h-4 w-4" /> Ringkasan
          </TabsTrigger>
          <TabsTrigger
            value="candidates"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="mr-1.5 h-4 w-4" /> Calon
          </TabsTrigger>
          <TabsTrigger
            value="tokens"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <KeyRound className="mr-1.5 h-4 w-4" /> Token
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <SettingsIcon className="mr-1.5 h-4 w-4" /> Pengaturan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab onLogout={onLogout} />
        </TabsContent>
        <TabsContent value="candidates" className="mt-4">
          <CandidatesTab onLogout={onLogout} />
        </TabsContent>
        <TabsContent value="tokens" className="mt-4">
          <TokensTab onLogout={onLogout} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab onLogout={onLogout} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------- OVERVIEW ----------------------------- */
function OverviewTab({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const { toast } = useToast();

  const refresh = () => {
    adminFetch<TokenStats>("/api/admin/tokens/stats", onLogout)
      .then((d) => d && setStats(d))
      .catch(() => {});
    fetch("/api/results")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ElectionResults | null) => {
        if (d && Array.isArray(d.candidates)) setResults(d);
      })
      .catch(() => {});
  };
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
     
  }, []);

  const handleReport = () => {
    if (!results) {
      toast({
        title: "Data belum tersedia",
        description: "Tunggu hingga hasil pemilihan termuat.",
        variant: "destructive",
      });
      return;
    }
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        const html = generateElectionReportHTML(results, s, stats);
        openReportInNewTab(html);
      })
      .catch(() => {
        const html = generateElectionReportHTML(results, null, stats);
        openReportInNewTab(html);
      });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <MiniStat
          icon={Vote}
          label="Total Suara"
          value={results?.totalVotes ?? 0}
          color="bg-blue-600"
        />
        <MiniStat
          icon={Users}
          label="Total Token"
          value={stats?.total ?? 0}
          color="bg-sky-500"
        />
        <MiniStat
          icon={Check}
          label="Sudah Memilih"
          value={stats?.voted ?? 0}
          color="bg-emerald-500"
        />
        <MiniStat
          icon={RefreshCw}
          label="Belum Memilih"
          value={stats?.unvoted ?? 0}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="border-blue-100 bg-white/85">
          <CardHeader>
            <CardTitle className="text-sm text-blue-950 sm:text-base">
              Partisipasi Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <ProgressBar
                value={
                  stats.students.total
                    ? (stats.students.voted / stats.students.total) * 100
                    : 0
                }
                label={`${stats.students.voted} / ${stats.students.total} siswa`}
              />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
            )}
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-white/85">
          <CardHeader>
            <CardTitle className="text-sm text-blue-950 sm:text-base">
              Partisipasi Guru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <ProgressBar
                value={
                  stats.teachers.total
                    ? (stats.teachers.voted / stats.teachers.total) * 100
                    : 0
                }
                label={`${stats.teachers.voted} / ${stats.teachers.total} guru`}
              />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-blue-950 sm:text-base">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> Perolehan Sementara
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!results || !Array.isArray(results.candidates) || results.candidates.length === 0 ? (
            <p className="py-4 text-center text-xs text-blue-700/70 sm:py-6 sm:text-sm">
              Belum ada data.
            </p>
          ) : (
            <div className="space-y-3">
              {[...results.candidates]
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 sm:gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 sm:text-xs">
                      {i + 1}
                    </span>
                    <span className="w-24 shrink-0 truncate text-xs font-medium text-blue-950 sm:w-32 sm:text-sm">
                      {c.name}
                    </span>
                    <div className="flex-1">
                      <ProgressBar
                        value={c.percentage}
                        label={`${c.voteCount} suara`}
                        color={c.color}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          onClick={handleReport}
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold shadow-sm"
        >
          <Printer className="mr-2 h-4 w-4" /> Cetak Laporan (Berita Acara)
        </Button>
      </div>

      <ResetCard onDone={() => refresh()} onLogout={onLogout} />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Vote;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="border-blue-100 bg-white/85">
      <CardContent className="p-3 sm:p-4">
        <div
          className={`mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${color} text-white shadow sm:mb-2 sm:h-9 sm:w-9`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600 sm:text-[11px]">
          {label}
        </p>
        <p className="text-xl font-black text-blue-950 sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProgressBar({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-full overflow-hidden rounded-full bg-blue-50">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, value)}%`,
            backgroundColor: color || "var(--primary)",
          }}
        />
      </div>
      <p className="text-xs text-blue-600">
        {label} &middot; {Math.round(value)}%
      </p>
    </div>
  );
}

/* ----------------------------- CANDIDATES ----------------------------- */
function CandidatesTab({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const load = (showLoading = false) => {
    if (showLoading) setLoading(true);
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((d: Candidate[]) => setItems(d || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    let alive = true;
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((d: Candidate[]) => alive && setItems(d || []))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const handleDelete = async (c: Candidate) => {
    if (!confirm(`Hapus calon "${c.name}"? Semua suara terkait juga akan dihapus.`))
      return;
    try {
      await adminFetch(`/api/admin/candidates/${c.id}`, onLogout, {
        method: "DELETE",
      });
      toast({ title: "Calon dihapus." });
      load();
    } catch {
      toast({ title: "Gagal menghapus.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-blue-700/80 sm:text-sm">
          {items.length} calon terdaftar
        </p>
        <Button
          onClick={() => setCreating(true)}
          className="bg-blue-600 text-white hover:bg-blue-700"
          size="sm"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Calon
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-blue-100 bg-white/80">
          <CardContent className="p-6 text-center text-xs text-blue-700/70 sm:p-8 sm:text-sm">
            Belum ada calon. Tambahkan calon pertama Anda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <Card key={c.id} className="overflow-hidden border-blue-100 bg-white/85">
              <div className="flex">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-blue-50 sm:h-24 sm:w-24">
                  {c.photo ? (
                     
                    <img
                      src={c.photo}
                      alt={c.name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-blue-200 sm:text-3xl">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  {c.isPair && c.partnerPhoto && (
                    <div className="absolute bottom-0 right-0 h-10 w-10 overflow-hidden rounded-tl-lg border-2 border-white sm:h-12 sm:w-12">
                      { }
                      <img
                        src={c.partnerPhoto}
                        alt={c.partnerName}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-blue-500 sm:text-xs">
                        No. Urut {c.order || i + 1}
                      </p>
                      <p className="truncate text-sm font-bold text-blue-950">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-blue-600 sm:text-xs">
                        {c.class}
                      </p>
                      {c.isPair && c.partnerName && (
                        <p className="truncate text-[10px] text-blue-500 sm:text-[11px]">
                          &amp; {c.partnerName}
                          {c.partnerClass ? ` (${c.partnerClass})` : ""}
                        </p>
                      )}
                    </div>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-blue-700/70 sm:text-xs">
                    {c.vision}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(c)}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 h-7 px-2 text-xs"
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(c)}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs"
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Hapus
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CandidateFormDialog
        key={creating ? "create" : "create-closed"}
        open={creating}
        candidate={null}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          load();
        }}
        onLogout={onLogout}
      />
      <CandidateFormDialog
        key={editing?.id || "edit-closed"}
        open={!!editing}
        candidate={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
        onLogout={onLogout}
      />
    </div>
  );
}

function CandidateFormDialog({
  open,
  candidate,
  onClose,
  onSaved,
  onLogout,
}: {
  open: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
  onLogout: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(candidate?.name || "");
  const [kelas, setKelas] = useState(candidate?.class || "");
  const [vision, setVision] = useState(candidate?.vision || "");
  const [mission, setMission] = useState(candidate?.mission || "");
  const [order, setOrder] = useState(String(candidate?.order ?? 1));
  const [color, setColor] = useState(candidate?.color || "#3b82f6");
  const [photo, setPhoto] = useState(candidate?.photo || "");
  const [isPair, setIsPair] = useState(!!candidate?.isPair);
  // For pairs: "together" = one combined photo (stored in `photo`, partnerPhoto empty),
  // "separate" = two individual photos. For non-pairs this is always "together".
  const [photoMode, setPhotoMode] = useState<"together" | "separate">(
    candidate?.isPair && candidate?.partnerPhoto ? "separate" : "together",
  );
  const [partnerName, setPartnerName] = useState(candidate?.partnerName || "");
  const [partnerClass, setPartnerClass] = useState(
    candidate?.partnerClass || "",
  );
  const [partnerPhoto, setPartnerPhoto] = useState(
    candidate?.partnerPhoto || "",
  );
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const partnerPhotoRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file: File, setter: (s: string) => void) => {
    if (file.size > 2_500_000) {
      toast({
        title: "Ukuran foto terlalu besar",
        description: "Maksimal 2.5MB.",
        variant: "destructive",
      });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setter(dataUrl);
    } catch {
      toast({ title: "Gagal membaca file.", variant: "destructive" });
    }
  };

  const save = async () => {
    if (!name.trim() || !kelas.trim() || !vision.trim() || !mission.trim()) {
      toast({ title: "Lengkapi semua field wajib.", variant: "destructive" });
      return;
    }
    if (isPair && (!partnerName.trim() || !partnerClass.trim())) {
      toast({
        title: "Lengkapi data wakil calon.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    // When pair uses a combined photo ("together"), clear partnerPhoto so the
    // display logic knows to show a single image instead of two.
    const finalPartnerPhoto =
      isPair && photoMode === "separate" ? partnerPhoto : "";
    const body = {
      name,
      class: kelas,
      vision,
      mission,
      order: Number(order) || 1,
      color,
      photo,
      isPair,
      partnerName: isPair ? partnerName : "",
      partnerClass: isPair ? partnerClass : "",
      partnerPhoto: finalPartnerPhoto,
    };
    const url = candidate
      ? `/api/admin/candidates/${candidate.id}`
      : "/api/admin/candidates";
    const method = candidate ? "PUT" : "POST";
    try {
      await adminFetch(url, onLogout, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast({ title: candidate ? "Calon diperbarui." : "Calon ditambahkan." });
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan.";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const colors = [
    "#3b82f6",
    "#0ea5e9",
    "#06b6d4",
    "#6366f1",
    "#14b8a6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-blue sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-950">
            {candidate ? "Edit Calon" : "Tambah Calon"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi identitas dan visi-misi calon OSIS.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Photo (ketua / combined) */}
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100">
              {photo ? (
                 
                <img
                  src={photo}
                  alt="preview"
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-blue-300">
                  <GraduationCap className="h-7 w-7" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-blue-800">
                {isPair && photoMode === "together"
                  ? " Foto Bersama (Ketua & Wakil)"
                  : "Foto Calon (Ketua)"}
              </Label>
              <Input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handlePhoto(e.target.files[0], setPhoto)
                }
                className="text-xs"
              />
              <p className="text-[11px] text-blue-500">
                JPG/PNG, maks 2.5MB. Disimpan sebagai data URL.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-blue-800">Nama Lengkap *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama calon"
                className="border-blue-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Kelas *</Label>
              <Input
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="IX A"
                className="border-blue-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-blue-800">Nomor Urut</Label>
              <Input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="border-blue-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Warna</Label>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full ring-2 transition ${
                      color === c ? "ring-blue-400 scale-110" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Warna ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Visi *</Label>
            <Textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Visi calon..."
              rows={2}
              className="border-blue-200"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Misi *</Label>
            <Textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Satu misi per baris..."
              rows={4}
              className="border-blue-200"
            />
            <p className="text-[11px] text-blue-500">
              Tulis satu misi per baris untuk tampilan daftar bernomor.
            </p>
          </div>

          {/* Pair toggle */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-800">Calon Berpasangan</p>
                <p className="text-[11px] text-blue-600">
                  Aktifkan jika calon memiliki wakil ketua.
                </p>
              </div>
              <Switch checked={isPair} onCheckedChange={setIsPair} />
            </div>

            {isPair && (
              <div className="mt-3 space-y-3 border-t border-blue-100 pt-3">
                {/* Photo mode selector — together or separate */}
                <div className="space-y-1.5">
                  <Label className="text-blue-800">Mode Foto Pasangan</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoMode("together")}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        photoMode === "together"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      📸 Foto Bersama
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode("separate")}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        photoMode === "separate"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      👥 Foto Terpisah
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-500">
                    {photoMode === "together"
                      ? "Gunakan satu foto berdua (foto di atas)."
                      : "Unggah foto ketua & wakil secara terpisah."}
                  </p>
                </div>

                {/* Partner photo upload — only shown in "separate" mode */}
                {photoMode === "separate" && (
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-blue-100">
                      {partnerPhoto ? (
                         
                        <img
                          src={partnerPhoto}
                          alt="wakil"
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-blue-300">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-blue-800">Foto Wakil</Label>
                      <Input
                        ref={partnerPhotoRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handlePhoto(e.target.files[0], setPartnerPhoto)
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-blue-800">Nama Wakil *</Label>
                    <Input
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Nama wakil"
                      className="border-blue-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-blue-800">Kelas Wakil *</Label>
                    <Input
                      value={partnerClass}
                      onChange={(e) => setPartnerClass(e.target.value)}
                      placeholder="IX B"
                      className="border-blue-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-200"
          >
            Batal
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {candidate ? "Simpan Perubahan" : "Tambah Calon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- TOKENS ----------------------------- */
function TokensTab({ onLogout }: { onLogout: () => void }) {
  const [tokens, setTokens] = useState<VoterInfo[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [genCount, setGenCount] = useState("20");
  const [genRole, setGenRole] = useState<"student" | "teacher">("student");
  const [genBatch, setGenBatch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const { toast } = useToast();

  const load = (showLoading = false) => {
    if (showLoading) setLoading(true);
    fetch("/api/admin/tokens", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: VoterInfo[]) => setTokens(d || []))
      .finally(() => setLoading(false));
    adminFetch<TokenStats>("/api/admin/tokens/stats", onLogout)
      .then((d) => d && setStats(d))
      .catch(() => {});
  };
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/tokens", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: VoterInfo[]) => alive && setTokens(d || []))
      .finally(() => alive && setLoading(false));
    fetch("/api/admin/tokens/stats", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((s) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const generate = async () => {
    const count = Math.max(1, Math.min(500, Number(genCount) || 0));
    if (!count) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const data = await adminFetch<{ tokens: string[] }>(
        "/api/admin/tokens/generate",
        onLogout,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count,
            role: genRole,
            batch: genBatch.trim() || undefined,
          }),
        },
      );
      if (data) {
        setGenerated(data.tokens);
        toast({ title: `${data.tokens.length} token dibuat!` });
        load();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal membuat token.";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyAll = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const exportExcel = async () => {
    if (!generated) return;
    try {
      const XLSX = await import("xlsx");
      const rows = generated.map((t, i) => ({
        No: i + 1,
        Token: t,
        Peran: genRole === "teacher" ? "Guru" : "Siswa",
        Batch: genBatch || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tokens");
      XLSX.writeFile(wb, `tokens-${genRole}-${Date.now()}.xlsx`);
    } catch {
      toast({ title: "Gagal export Excel.", variant: "destructive" });
    }
  };

  // Filter + sort (client-side) — MUST be defined before functions that use it
  // (exportTableExcel, printTokens, toggleSelectAll).
  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tokens;
    if (q) {
      list = list.filter(
        (t) =>
          t.token.toLowerCase().includes(q) ||
          (t.batch || "").toLowerCase().includes(q) ||
          (t.name || "").toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "batch":
        sorted.sort((a, b) => (a.batch || "").localeCompare(b.batch || ""));
        break;
      case "voted-first":
        sorted.sort(
          (a, b) =>
            Number(b.hasVoted) - Number(a.hasVoted) ||
            new Date(b.votedAt || 0).getTime() - new Date(a.votedAt || 0).getTime(),
        );
        break;
      case "unvoted-first":
        sorted.sort(
          (a, b) =>
            Number(a.hasVoted) - Number(b.hasVoted) ||
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
    }
    return sorted;
  }, [tokens, search, sort]);

  /** Export tokens from the TABLE (not generated ones) to Excel.
   *  - If any tokens are selected → export selected.
   *  - Otherwise → export all filtered+sorted tokens. */
  const exportTableExcel = async () => {
    const selectedTokens = tokens.filter((t) => selectedIds.has(t.id));
    const list = selectedTokens.length > 0 ? selectedTokens : filteredSorted;
    if (list.length === 0) {
      toast({ title: "Tidak ada token untuk diekspor.", variant: "destructive" });
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const rows = list.map((t, i) => ({
        No: i + 1,
        Token: t.token,
        Peran: t.role === "teacher" ? "Guru" : "Siswa",
        Batch: t.batch || "",
        Status: t.hasVoted ? "Sudah Memilih" : "Belum Memilih",
        "Waktu Pilih": t.votedAt ? new Date(t.votedAt).toLocaleString("id-ID") : "",
        "Dibuat": new Date(t.createdAt).toLocaleString("id-ID"),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5 }, { wch: 18 }, { wch: 8 }, { wch: 16 },
        { wch: 16 }, { wch: 22 }, { wch: 22 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Token Pemilihan");
      const label = selectedTokens.length > 0 ? "terpilih" : "semua";
      XLSX.writeFile(wb, `token-${label}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: `${list.length} token diekspor ke Excel.` });
    } catch {
      toast({ title: "Gagal export Excel.", variant: "destructive" });
    }
  };

  const printTokens = () => {
    // If tokens are selected, print selected. Otherwise print all filtered.
    const selectedTokens = tokens.filter((t) => selectedIds.has(t.id));
    const list = selectedTokens.length > 0 ? selectedTokens : (filteredSorted.length > 0 ? filteredSorted : tokens);
    if (list.length === 0) {
      toast({ title: "Tidak ada token untuk dicetak." });
      return;
    }

    const rows = list
      .map(
        (t, i) => `
        <tr>
          <td style="text-align:center;font-weight:bold;">${i + 1}</td>
          <td class="mono" style="font-size:14px;font-weight:bold;letter-spacing:1px;color:#1e3a8a;">${t.token}</td>
          <td>${t.role === "teacher" ? "Guru / Staf" : "Siswa"}</td>
          <td>${t.batch || "-"}</td>
          <td style="text-align:center;">
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${
              t.hasVoted ? "#dcfce7;color:#166534" : "#fef9c3;color:#854d0e"
            }">
              ${t.hasVoted ? "Sudah Memilih" : "Belum Memilih"}
            </span>
          </td>
        </tr>`,
      )
      .join("");

    const tokenDocHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <title>Daftar Token Pemilihan OSIS</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #0f172a; }
    .action-bar {
      position: sticky; top: 0; z-index: 100;
      background: #0f172a; color: #fff; padding: 12px 24px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .action-bar button {
      padding: 8px 16px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; font-size: 13px;
    }
    .btn-print { background: #2563eb; color: #fff; margin-right: 8px; }
    .btn-close { background: #334155; color: #f8fafc; }
    .page { max-width: 820px; margin: 20px auto; background: #fff; padding: 32px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    h1 { font-size: 20px; margin: 0 0 4px; text-transform: uppercase; color: #0f172a; }
    p.sub { font-size: 12px; color: #64748b; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
    .mono { font-family: "Courier New", Courier, monospace; }
    @media print {
      body { background: #fff !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
      th { background-color: #f1f5f9 !important; }
      @page { size: A4 portrait; margin: 12mm 15mm; }
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <div style="font-size:14px;font-weight:600;">Daftar Token Pemilihan OSIS (${list.length} token)</div>
    <div>
      <button class="btn-print" onclick="window.print()">Cetak Token</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>
  <div class="page">
    <h1>Daftar Token Pemilihan OSIS</h1>
    <p class="sub">Dicetak: ${new Date().toLocaleString("id-ID")} &middot; Total: ${list.length} token</p>
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center;">No.</th>
          <th>Token Rahasia</th>
          <th>Peran</th>
          <th>Kelas / Batch</th>
          <th style="text-align:center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  <script>
    window.addEventListener("load", function() {
      setTimeout(function() {
        try { window.print(); } catch (e) {}
      }, 400);
    });
  </script>
</body>
</html>`;

    openReportInNewTab(tokenDocHtml);
  };

  const deleteToken = async (t: VoterInfo) => {
    if (!confirm(`Hapus token ${t.token}?`)) return;
    try {
      await adminFetch(`/api/admin/tokens/${t.id}`, onLogout, {
        method: "DELETE",
      });
      toast({ title: "Token dihapus." });
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menghapus.";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const batchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} token terpilih?`)) return;
    setBatchDeleting(true);
    let ok = 0;
    let fail = 0;
    for (const id of selectedIds) {
      try {
        await adminFetch(`/api/admin/tokens/${id}`, onLogout, {
          method: "DELETE",
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setBatchDeleting(false);
    setSelectedIds(new Set());
    toast({
      title: `${ok} token dihapus${fail ? `, ${fail} gagal` : ""}.`,
    });
    load();
  };

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    // Select ALL tokens in the current filter/sort (not just the current page).
    const allIds = filteredSorted.map((t) => t.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all filtered tokens.
        allIds.forEach((id) => next.delete(id));
      } else {
        // Select all filtered tokens.
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Generate */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-blue-950 sm:text-base">
            <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" /> Buat Token Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-blue-800">Jumlah</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={genCount}
                onChange={(e) => setGenCount(e.target.value)}
                className="border-blue-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Peran</Label>
              <Select
                value={genRole}
                onValueChange={(v) => setGenRole(v as "student" | "teacher")}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Siswa</SelectItem>
                  <SelectItem value="teacher">Guru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-blue-800">Batch (opsional)</Label>
              <Input
                value={genBatch}
                onChange={(e) => setGenBatch(e.target.value)}
                placeholder="cth: Kelas IX IPA"
                className="border-blue-200"
              />
            </div>
          </div>
          <Button
            onClick={generate}
            disabled={generating}
            className="bg-blue-600 text-white hover:bg-blue-700"
            size="sm"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Buat Token
          </Button>

          {generated && (
            <div className="rounded-xl bg-blue-50 p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-blue-800 sm:text-sm">
                  {generated.length} token berhasil dibuat:
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyAll}
                    className="border-blue-300 text-blue-700 h-7 text-xs"
                  >
                    {copiedAll ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3" />
                    )}
                    {copiedAll ? "Disalin!" : "Salin Semua"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportExcel}
                    className="border-blue-300 text-blue-700 h-7 text-xs"
                  >
                    <Download className="mr-1 h-3 w-3" /> Excel
                  </Button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto scrollbar-blue rounded bg-white p-2">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {generated.map((t) => (
                    <code
                      key={t}
                      className="rounded bg-blue-50 px-2 py-1 font-mono text-[11px] text-blue-700 sm:text-xs"
                    >
                      {t}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <MiniStat
            icon={Users}
            label="Total"
            value={stats.total}
            color="bg-blue-600"
          />
          <MiniStat
            icon={Check}
            label="Sudah Memilih"
            value={stats.voted}
            color="bg-emerald-500"
          />
          <MiniStat
            icon={RefreshCw}
            label="Belum Memilih"
            value={stats.unvoted}
            color="bg-amber-500"
          />
          <MiniStat
            icon={GraduationCap}
            label="Siswa / Guru"
            value={`${stats.students.total} / ${stats.teachers.total}`}
            color="bg-sky-500"
          />
        </div>
      )}

      {/* List */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm text-blue-950 sm:text-base">
                Daftar Token
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={printTokens}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Cetak
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportTableExcel}
                  disabled={filteredSorted.length === 0}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Excel
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari token / batch / nama…"
                  className="h-8 pl-8 text-xs border-blue-200"
                />
              </div>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as SortKey)}
              >
                <SelectTrigger className="h-8 w-36 border-blue-200 text-xs sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="batch">Batch (A-Z)</SelectItem>
                  <SelectItem value="voted-first">Sudah Memilih dulu</SelectItem>
                  <SelectItem value="unvoted-first">Belum Memilih dulu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 p-2">
                <Badge className="bg-blue-600 text-white">
                  {selectedIds.size} dipilih
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={batchDelete}
                  disabled={batchDeleting}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 h-7 text-xs"
                >
                  {batchDeleting ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Trash className="mr-1 h-3 w-3" />
                  )}
                  Hapus Terpilih
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exportTableExcel}
                  className="h-7 px-2 text-xs text-blue-600"
                >
                  <Download className="mr-1 h-3 w-3" /> Export Excel
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={printTokens}
                  className="h-7 px-2 text-xs text-blue-600"
                >
                  <Printer className="mr-1 h-3 w-3" /> Cetak
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-7 text-xs text-blue-600"
                >
                  Batal
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-400" />
            </div>
          ) : filteredSorted.length === 0 ? (
            <p className="py-8 text-center text-xs text-blue-700/70 sm:text-sm">
              {search ? "Tidak ada token yang cocok." : "Belum ada token."}
            </p>
          ) : (
            <>
              <div className="max-h-[480px] overflow-auto scrollbar-blue">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-blue-50/95 backdrop-blur">
                    <tr className="text-left text-[10px] text-blue-600 sm:text-xs">
                      <th className="p-2">
                        <Checkbox
                          checked={
                            filteredSorted.length > 0 &&
                            filteredSorted.every((t) => selectedIds.has(t.id))
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Pilih semua token"
                        />
                      </th>
                      <th className="p-2 font-semibold">Token</th>
                      <th className="hidden p-2 font-semibold sm:table-cell">
                        Peran
                      </th>
                      <th className="hidden p-2 font-semibold sm:table-cell">
                        Batch/Kelas
                      </th>
                      <th className="p-2 font-semibold">Status</th>
                      <th className="hidden p-2 font-semibold md:table-cell">
                        Waktu Pilih
                      </th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((t) => (
                      <tr key={t.id} className="border-t border-blue-50">
                        <td className="p-2">
                          <Checkbox
                            checked={selectedIds.has(t.id)}
                            onCheckedChange={() => toggleSelect(t.id)}
                            aria-label={`Pilih token ${t.token}`}
                          />
                        </td>
                        <td className="p-2 font-mono text-[11px] text-blue-800 sm:text-xs">
                          {t.token}
                        </td>
                        <td className="hidden p-2 sm:table-cell">
                          <Badge
                            variant="outline"
                            className="border-blue-200 text-blue-700"
                          >
                            {t.role === "teacher" ? "Guru" : "Siswa"}
                          </Badge>
                        </td>
                        <td className="hidden p-2 text-[11px] text-blue-500 sm:table-cell sm:text-xs">
                          {t.batch || "-"}
                        </td>
                        <td className="p-2">
                          {t.hasVoted ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <Check className="mr-1 h-3 w-3" /> Sudah
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-200 text-amber-700"
                            >
                              Belum
                            </Badge>
                          )}
                        </td>
                        <td className="hidden p-2 text-[11px] text-blue-500 md:table-cell sm:text-xs">
                          {t.votedAt
                            ? new Date(t.votedAt).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="p-2">
                          {!t.hasVoted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteToken(t)}
                              className="h-7 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 pt-3 text-xs text-blue-600">
                <span>
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredSorted.length)} dari{" "}
                  {filteredSorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-7 border-blue-200 px-2 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <span className="px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-7 border-blue-200 px-2 text-xs"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- SETTINGS ----------------------------- */
function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [electionTitle, setElectionTitle] = useState("");
  const [electionDescription, setElectionDescription] = useState("");
  const [totalVoters, setTotalVoters] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [resultsPublic, setResultsPublic] = useState(true);
  const [schoolLogo, setSchoolLogo] = useState("");
  const [scheduledMode, setScheduledMode] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bgBlur, setBgBlur] = useState<number>(12);
  const [bgOpacity, setBgOpacity] = useState<number>(60);
  const { toast } = useToast();
  const logoRef = useRef<HTMLInputElement>(null);
  const updateSettingsStore = useAppStore((s) => s.setSettings);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setSettings(s);
        updateSettingsStore(s);
        setSchoolName(s.schoolName);
        setElectionTitle(s.electionTitle);
        setElectionDescription(s.electionDescription);
        setTotalVoters(String(s.totalVoters));
        setIsActive(s.isActive);
        setResultsPublic(s.resultsPublic);
        setSchoolLogo(s.schoolLogo);
        setBgBlur(typeof s.bgBlur === "number" ? s.bgBlur : 12);
        setBgOpacity(typeof s.bgOpacity === "number" ? s.bgOpacity : 60);
        const hasSchedule = !!s.startTime || !!s.endTime;
        setScheduledMode(hasSchedule);
        setStartTime(s.startTime ? toLocalInput(s.startTime) : "");
        setEndTime(s.endTime ? toLocalInput(s.endTime) : "");
      })
      .catch(() => {});
  }, []);

  const handleLogo = async (file: File) => {
    if (file.size > 1_500_000) {
      toast({
        title: "Logo terlalu besar",
        description: "Maksimal 1.5MB.",
        variant: "destructive",
      });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSchoolLogo(dataUrl);
    } catch {
      toast({ title: "Gagal membaca file.", variant: "destructive" });
    }
  };

  const save = async () => {
    setSaving(true);
    const body: Partial<Settings> = {
      schoolName,
      electionTitle,
      electionDescription,
      totalVoters: Number(totalVoters) || 0,
      isActive,
      resultsPublic,
      schoolLogo,
      bgBlur,
      bgOpacity,
    };
    if (scheduledMode) {
      body.startTime = startTime ? new Date(startTime).toISOString() : null;
      body.endTime = endTime ? new Date(endTime).toISOString() : null;
    } else {
      body.startTime = null;
      body.endTime = null;
    }
    try {
      const updated = await adminFetch<Settings>(
        "/api/admin/settings",
        onLogout,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (updated) {
        setSettings(updated);
        updateSettingsStore(updated);
        toast({ title: "Pengaturan disimpan." });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan.";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!settings)
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-400" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* School identity */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-blue-950 sm:text-base">
            <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Identitas Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-blue-100">
              {schoolLogo ? (
                 
                <img
                  src={schoolLogo}
                  alt="logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-blue-200">
                  {schoolName.charAt(0) || "S"}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-blue-800">Logo Sekolah</Label>
              <Input
                ref={logoRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleLogo(e.target.files[0])
                }
                className="text-xs"
              />
              <p className="text-[11px] text-blue-500">SVG/PNG/JPG, maks 1.5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-blue-800">Nama Sekolah</Label>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="border-blue-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Total Pemilih (target)</Label>
              <Input
                type="number"
                min={0}
                value={totalVoters}
                onChange={(e) => setTotalVoters(e.target.value)}
                className="border-blue-200"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Judul Pemilihan</Label>
            <Input
              value={electionTitle}
              onChange={(e) => setElectionTitle(e.target.value)}
              className="border-blue-200"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Deskripsi</Label>
            <Textarea
              value={electionDescription}
              onChange={(e) => setElectionDescription(e.target.value)}
              rows={2}
              className="border-blue-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status & Schedule */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-blue-950 sm:text-base">
            <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5" /> Status & Jadwal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AKTIF / NONAKTIF */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div>
              <p className="text-sm font-bold text-blue-800">Status Pemilihan</p>
              <p className="text-[11px] text-blue-600">
                Aktifkan agar pemilih dapat menggunakan token mereka.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  isActive
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                }
              >
                {isActive ? "AKTIF" : "NONAKTIF"}
              </Badge>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Mode jadwal */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-800">Mode Jadwal</p>
                <p className="text-[11px] text-blue-600">
                  Tanpa Waktu = aktif selama status AKTIF. Terjadwal = aktif
                  otomatis sesuai rentang waktu.
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-blue-100">
                <button
                  onClick={() => setScheduledMode(false)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    !scheduledMode
                      ? "bg-blue-600 text-white shadow"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  Tanpa Waktu
                </button>
                <button
                  onClick={() => setScheduledMode(true)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    scheduledMode
                      ? "bg-blue-600 text-white shadow"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  Terjadwal
                </button>
              </div>
            </div>
            {scheduledMode && (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-blue-100 pt-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-blue-800">Waktu Mulai</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-blue-800">Waktu Selesai</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border-blue-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PUBLIK / PRIVAT */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-start gap-2">
              {resultsPublic ? (
                <Eye className="mt-0.5 h-4 w-4 text-blue-600" />
              ) : (
                <EyeOff className="mt-0.5 h-4 w-4 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-bold text-blue-800">
                  Visibilitas Hasil
                </p>
                <p className="text-[11px] text-blue-600">
                  PUBLIK = pemilih bisa melihat hasil. PRIVAT = hanya panitia.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  resultsPublic
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-200"
                }
              >
                {resultsPublic ? "PUBLIK" : "PRIVAT"}
              </Badge>
              <Switch checked={resultsPublic} onCheckedChange={setResultsPublic} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Background Blur & Content Contrast Settings */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-blue-950 sm:text-base">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /> Tampilan Latar Belakang 3D & Kontras Konten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-blue-700">
            Atur keburaman (<em>blur</em>) dan kepekatan lapisan latar belakang agar animasi 3D tetap menarik tanpa mengaburkan atau mengganggu keterbacaan teks dan kartu konten pemilihan.
          </p>

          {/* Blur Level Selection */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-900">Efek Keburaman (Backdrop Blur)</p>
                <p className="text-[11px] text-blue-600">Semakin tinggi, objek 3D akan semakin lembut menyerupai bokeh/cahaya ambient.</p>
              </div>
              <Badge variant="outline" className="border-blue-300 font-mono text-blue-800 bg-white">
                {bgBlur} px
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { val: 0, label: "0px (Jernih)" },
                { val: 6, label: "6px (Halus)" },
                { val: 12, label: "12px (Standar)" },
                { val: 20, label: "20px (Lembut)" },
                { val: 32, label: "32px (Maksimal)" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    setBgBlur(opt.val);
                    if (settings) updateSettingsStore({ ...settings, bgBlur: opt.val, bgOpacity });
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition ${
                    bgBlur === opt.val
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-blue-800 border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity / Dimming Level */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-900">Kepekatan Lapisan Penutup (Dimming / Opacity)</p>
                <p className="text-[11px] text-blue-600">Meredupkan latar belakang agar kartu dan teks pemilihan lebih kontras dan mudah dibaca.</p>
              </div>
              <Badge variant="outline" className="border-blue-300 font-mono text-blue-800 bg-white">
                {bgOpacity}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { val: 30, label: "30% (Tipis)" },
                { val: 50, label: "50% (Sedang)" },
                { val: 65, label: "65% (Standar)" },
                { val: 85, label: "85% (Pekat / Fokus)" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    setBgOpacity(opt.val);
                    if (settings) updateSettingsStore({ ...settings, bgBlur, bgOpacity: opt.val });
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition ${
                    bgOpacity === opt.val
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-blue-800 border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}

function toLocalInput(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/* ----------------------------- RESET ----------------------------- */
function ResetCard({
  onDone,
  onLogout,
}: {
  onDone: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"votes" | "all">("votes");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const run = async () => {
    setLoading(true);
    try {
      await adminFetch("/api/admin/reset", onLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, scope }),
      });
      toast({
        title: scope === "all" ? "Pemilihan direset total." : "Semua suara dihapus.",
      });
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal reset.";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setOpen(false);
      setConfirm(false);
    }
  };

  return (
    <Card className="border-rose-200 bg-rose-50/50">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
          <div>
            <p className="text-sm font-bold text-rose-800 sm:text-base">
              Reset Pemilihan
            </p>
            <p className="text-[11px] text-rose-700/80 sm:text-xs">
              Hapus semua suara atau seluruh data (token + calon).
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-rose-300 text-rose-600 hover:bg-rose-100"
          size="sm"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" /> Reset
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-700">Konfirmasi Reset</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-blue-800">Ruang Lingkup</Label>
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as "votes" | "all")}
              >
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes">Hapus semua suara saja</SelectItem>
                  <SelectItem value="all">
                    Hapus suara + token + calon (SEMUA)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-blue-800">
              <Checkbox
                checked={confirm}
                onCheckedChange={(v) => setConfirm(v === true)}
              />
              Saya mengerti tindakan ini permanen.
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-blue-200"
            >
              Batal
            </Button>
            <Button
              onClick={run}
              disabled={!confirm || loading}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Ya, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
