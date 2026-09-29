"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { Candidate, ElectionResults, Settings, VoterInfo } from "@/lib/types";

interface TokenStats {
  total: number;
  voted: number;
  unvoted: number;
  students: { total: number; voted: number };
  teachers: { total: number; voted: number };
}

export function AdminView() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/check")
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
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
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
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-blue-950">Login Panitia</h2>
            <p className="mt-2 text-sm text-blue-700/80">
              Masukkan password panitia untuk mengelola pemilihan OSIS.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <Label htmlFor="pw" className="text-blue-800">Password Panitia</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
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
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Masuk
            </Button>
            <p className="rounded-lg bg-blue-50 p-3 text-center text-xs text-blue-700/80">
              Default: <span className="font-mono font-bold">panitia2025</span> (atur via env{" "}
              <span className="font-mono">ADMIN_PASSWORD</span>)
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
    await fetch("/api/admin/logout", { method: "POST" });
    toast({ title: "Anda telah keluar." });
    onLogout();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
            <UserCog className="mr-1.5 h-3 w-3" /> Panel Panitia
          </Badge>
          <h1 className="text-2xl font-black text-blue-950 sm:text-3xl">Dashboard Pemilihan</h1>
        </div>
        <Button variant="outline" onClick={handleLogout} className="border-blue-200 text-blue-700 hover:bg-blue-50">
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-blue-50/80 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><BarChart3 className="mr-1.5 h-4 w-4" /> Ringkasan</TabsTrigger>
          <TabsTrigger value="candidates" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Users className="mr-1.5 h-4 w-4" /> Calon</TabsTrigger>
          <TabsTrigger value="tokens" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><KeyRound className="mr-1.5 h-4 w-4" /> Token</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><SettingsIcon className="mr-1.5 h-4 w-4" /> Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="candidates" className="mt-4"><CandidatesTab /></TabsContent>
        <TabsContent value="tokens" className="mt-4"><TokensTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------- OVERVIEW ----------------------------- */
function OverviewTab() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);

  const refresh = () => {
    fetch("/api/admin/tokens/stats").then((r) => r.json()).then(setStats).catch(() => {});
    fetch("/api/results").then((r) => r.json()).then(setResults).catch(() => {});
  };
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={Vote} label="Total Suara" value={results?.totalVotes ?? 0} color="bg-blue-600" />
        <MiniStat icon={Users} label="Total Token" value={stats?.total ?? 0} color="bg-sky-500" />
        <MiniStat icon={Check} label="Sudah Memilih" value={stats?.voted ?? 0} color="bg-emerald-500" />
        <MiniStat icon={Clock2} label="Belum Memilih" value={stats?.unvoted ?? 0} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-blue-100 bg-white/85">
          <CardHeader><CardTitle className="text-blue-950">Partisipasi Siswa</CardTitle></CardHeader>
          <CardContent>
            {stats ? (
              <ProgressBar value={stats.students.total ? (stats.students.voted / stats.students.total) * 100 : 0} label={`${stats.students.voted} / ${stats.students.total} siswa`} />
            ) : <Loader2 className="h-5 w-5 animate-spin text-blue-300" />}
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-white/85">
          <CardHeader><CardTitle className="text-blue-950">Partisipasi Guru</CardTitle></CardHeader>
          <CardContent>
            {stats ? (
              <ProgressBar value={stats.teachers.total ? (stats.teachers.voted / stats.teachers.total) * 100 : 0} label={`${stats.teachers.voted} / ${stats.teachers.total} guru`} />
            ) : <Loader2 className="h-5 w-5 animate-spin text-blue-300" />}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 bg-white/85">
        <CardHeader><CardTitle className="flex items-center gap-2 text-blue-950"><BarChart3 className="h-5 w-5" /> Perolehan Sementara</CardTitle></CardHeader>
        <CardContent>
          {!results || results.candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-blue-700/70">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {[...results.candidates].sort((a,b)=>b.voteCount-a.voteCount).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{i+1}</span>
                  <span className="w-32 shrink-0 truncate text-sm font-medium text-blue-950">{c.name}</span>
                  <div className="flex-1"><ProgressBar value={c.percentage} label={`${c.voteCount} suara`} color={c.color} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResetCard onDone={() => refresh()} />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: typeof Vote; label: string; value: number; color: string }) {
  return (
    <Card className="border-blue-100 bg-white/85">
      <CardContent className="p-4">
        <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color} text-white shadow`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">{label}</p>
        <p className="text-2xl font-black text-blue-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-full overflow-hidden rounded-full bg-blue-50">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color || "var(--primary)" }}
        />
      </div>
      <p className="text-xs text-blue-600">{label} &middot; {Math.round(value)}%</p>
    </div>
  );
}

function Clock2(props: React.ComponentProps<typeof Vote>) {
  return <RefreshCw {...props} />;
}

/* ----------------------------- CANDIDATES ----------------------------- */
function CandidatesTab() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const load = (showLoading = false) => {
    if (showLoading) setLoading(true);
    fetch("/api/candidates").then((r) => r.json()).then((d: Candidate[]) => setItems(d || [])).finally(() => setLoading(false));
  };
  useEffect(() => {
    let alive = true;
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((d: Candidate[]) => alive && setItems(d || []))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const handleDelete = async (c: Candidate) => {
    if (!confirm(`Hapus calon "${c.name}"? Semua suara terkait juga akan dihapus.`)) return;
    const res = await fetch(`/api/admin/candidates/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Calon dihapus." });
      load();
    } else {
      toast({ title: "Gagal menghapus.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-700/80">{items.length} calon terdaftar</p>
        <Button onClick={() => setCreating(true)} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Calon
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-400" /></div>
      ) : items.length === 0 ? (
        <Card className="border-blue-100 bg-white/80"><CardContent className="p-8 text-center text-blue-700/70">Belum ada calon. Tambahkan calon pertama Anda.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <Card key={c.id} className="overflow-hidden border-blue-100 bg-white/85">
              <div className="flex">
                <div className="h-24 w-24 shrink-0 overflow-hidden bg-blue-50">
                  {c.photo ? (
                     
                    <img src={c.photo} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-blue-200">{c.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-blue-500">No. Urut {c.order || i + 1}</p>
                      <p className="truncate font-bold text-blue-950">{c.name}</p>
                      <p className="text-xs text-blue-600">{c.class}</p>
                    </div>
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-blue-700/70">{c.vision}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)} className="border-blue-200 text-blue-700 hover:bg-blue-50 h-7 px-2 text-xs">
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(c)} className="border-rose-200 text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs">
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
        onSaved={() => { setCreating(false); load(); }}
      />
      <CandidateFormDialog
        key={editing?.id || "edit-closed"}
        open={!!editing}
        candidate={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
    </div>
  );
}

function CandidateFormDialog({
  open,
  candidate,
  onClose,
  onSaved,
}: {
  open: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  // Initialize state directly from the candidate prop. The parent passes a `key`
  // so the component remounts fresh each time it opens for a different candidate,
  // avoiding prop-to-state sync inside an effect.
  const [name, setName] = useState(candidate?.name || "");
  const [kelas, setKelas] = useState(candidate?.class || "");
  const [vision, setVision] = useState(candidate?.vision || "");
  const [mission, setMission] = useState(candidate?.mission || "");
  const [order, setOrder] = useState(String(candidate?.order ?? 1));
  const [color, setColor] = useState(candidate?.color || "#3b82f6");
  const [photo, setPhoto] = useState(candidate?.photo || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (file: File) => {
    if (file.size > 2_500_000) {
      toast({ title: "Ukuran foto terlalu besar", description: "Maksimal 2.5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!name.trim() || !kelas.trim() || !vision.trim() || !mission.trim()) {
      toast({ title: "Lengkapi semua field wajib.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const body = { name, class: kelas, vision, mission, order: Number(order) || 1, color, photo };
    const url = candidate ? `/api/admin/candidates/${candidate.id}` : "/api/admin/candidates";
    const method = candidate ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) {
      toast({ title: candidate ? "Calon diperbarui." : "Calon ditambahkan." });
      onSaved();
    } else {
      toast({ title: "Gagal menyimpan.", variant: "destructive" });
    }
  };

  const colors = ["#3b82f6", "#0ea5e9", "#06b6d4", "#6366f1", "#14b8a6", "#8b5cf6", "#ec4899", "#f59e0b"];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-blue sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-950">{candidate ? "Edit Calon" : "Tambah Calon"}</DialogTitle>
          <DialogDescription>Lengkapi identitas dan visi-misi calon OSIS.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Photo */}
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100">
              {photo ? (
                 
                <img src={photo} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-blue-300"><GraduationCap className="h-7 w-7" /></div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-blue-800">Foto Calon</Label>
              <Input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} className="text-xs" />
              <p className="text-[11px] text-blue-500">JPG/PNG, maks 2.5MB. Disimpan sebagai data URL.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-blue-800">Nama Lengkap *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama calon" className="border-blue-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Kelas *</Label>
              <Input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="XI IPA 1" className="border-blue-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-blue-800">Nomor Urut</Label>
              <Input type="number" min={1} value={order} onChange={(e) => setOrder(e.target.value)} className="border-blue-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Warna</Label>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`h-7 w-7 rounded-full ring-2 transition ${color === c ? "ring-blue-400 scale-110" : "ring-transparent"}`} style={{ backgroundColor: c }} aria-label={`Warna ${c}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Visi *</Label>
            <Textarea value={vision} onChange={(e) => setVision(e.target.value)} placeholder="Visi calon..." rows={2} className="border-blue-200" />
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Misi *</Label>
            <Textarea value={mission} onChange={(e) => setMission(e.target.value)} placeholder="Satu misi per baris..." rows={4} className="border-blue-200" />
            <p className="text-[11px] text-blue-500">Tulis satu misi per baris untuk tampilan daftar bernomor.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-blue-200">Batal</Button>
          <Button onClick={save} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {candidate ? "Simpan Perubahan" : "Tambah Calon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- TOKENS ----------------------------- */
function TokensTab() {
  const [tokens, setTokens] = useState<VoterInfo[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [genCount, setGenCount] = useState("20");
  const [genRole, setGenRole] = useState<"student" | "teacher">("student");
  const [genBatch, setGenBatch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unvoted" | "voted">("all");
  const [copiedAll, setCopiedAll] = useState(false);
  const { toast } = useToast();

  const load = (showLoading = false) => {
    if (showLoading) setLoading(true);
    const q = filter === "all" ? "" : `?${filter === "unvoted" ? "unvoted=true" : "unvoted=false"}`;
    fetch(`/api/admin/tokens${q}`).then((r) => r.json()).then((d: VoterInfo[]) => setTokens(d || [])).finally(() => setLoading(false));
    fetch("/api/admin/tokens/stats").then((r) => r.json()).then(setStats).catch(() => {});
  };
  useEffect(() => {
    let alive = true;
    const q = filter === "all" ? "" : `?${filter === "unvoted" ? "unvoted=true" : "unvoted=false"}`;
    fetch(`/api/admin/tokens${q}`)
      .then((r) => r.json())
      .then((d: VoterInfo[]) => alive && setTokens(d || []))
      .finally(() => alive && setLoading(false));
    fetch("/api/admin/tokens/stats").then((r) => r.json()).then((s) => alive && setStats(s)).catch(() => {});
    return () => { alive = false; };
  }, [filter]);

  const generate = async () => {
    const count = Math.max(1, Math.min(500, Number(genCount) || 0));
    if (!count) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await fetch("/api/admin/tokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, role: genRole, batch: genBatch.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenerated(data.tokens);
        toast({ title: `${data.tokens.length} token dibuat!` });
        load();
      } else {
        toast({ title: "Gagal membuat token.", variant: "destructive" });
      }
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

  const downloadCSV = () => {
    if (!generated) return;
    const csv = "token,role,batch\n" + generated.map((t) => `${t},${genRole},${genBatch || ""}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokens-${genRole}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteToken = async (t: VoterInfo) => {
    if (!confirm(`Hapus token ${t.token}?`)) return;
    const res = await fetch(`/api/admin/tokens/${t.id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Token dihapus." }); load(); }
    else { const d = await res.json(); toast({ title: d.error || "Gagal menghapus.", variant: "destructive" }); }
  };

  return (
    <div className="space-y-5">
      {/* Generate */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader><CardTitle className="flex items-center gap-2 text-blue-950"><KeyRound className="h-5 w-5" /> Buat Token Baru</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-blue-800">Jumlah</Label>
              <Input type="number" min={1} max={500} value={genCount} onChange={(e) => setGenCount(e.target.value)} className="border-blue-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-blue-800">Peran</Label>
              <Select value={genRole} onValueChange={(v) => setGenRole(v as "student" | "teacher")}>
                <SelectTrigger className="border-blue-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Siswa</SelectItem>
                  <SelectItem value="teacher">Guru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-blue-800">Batch (opsional)</Label>
              <Input value={genBatch} onChange={(e) => setGenBatch(e.target.value)} placeholder="cth: Kelas XI IPA" className="border-blue-200" />
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="bg-blue-600 text-white hover:bg-blue-700">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Buat Token
          </Button>

          {generated && (
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-800">{generated.length} token berhasil dibuat:</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyAll} className="border-blue-300 text-blue-700 h-7 text-xs">
                    {copiedAll ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copiedAll ? "Disalin!" : "Salin Semua"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadCSV} className="border-blue-300 text-blue-700 h-7 text-xs">
                    <Download className="mr-1 h-3 w-3" /> CSV
                  </Button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto scrollbar-blue rounded bg-white p-2">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {generated.map((t) => (
                    <code key={t} className="rounded bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700">{t}</code>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat icon={Users} label="Total" value={stats.total} color="bg-blue-600" />
          <MiniStat icon={Check} label="Sudah Memilih" value={stats.voted} color="bg-emerald-500" />
          <MiniStat icon={Clock2} label="Belum Memilih" value={stats.unvoted} color="bg-amber-500" />
          <MiniStat icon={GraduationCap} label="Siswa / Guru" value={`${stats.students.total} / ${stats.teachers.total}`} color="bg-sky-500" />
        </div>
      )}

      {/* Filter + List */}
      <Card className="border-blue-100 bg-white/85">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-blue-950">Daftar Token</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="h-8 w-40 border-blue-200 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="unvoted">Belum Memilih</SelectItem>
                <SelectItem value="voted">Sudah Memilih</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-400" /></div>
          ) : tokens.length === 0 ? (
            <p className="py-8 text-center text-sm text-blue-700/70">Belum ada token. Buat token di atas.</p>
          ) : (
            <div className="max-h-[480px] overflow-y-auto scrollbar-blue">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-blue-50/95 backdrop-blur">
                  <tr className="text-left text-xs text-blue-600">
                    <th className="p-2 font-semibold">Token</th>
                    <th className="p-2 font-semibold">Peran</th>
                    <th className="p-2 font-semibold">Status</th>
                    <th className="p-2 font-semibold">Waktu Pilih</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.id} className="border-t border-blue-50">
                      <td className="p-2 font-mono text-xs text-blue-800">{t.token}</td>
                      <td className="p-2"><Badge variant="outline" className="border-blue-200 text-blue-700">{t.role === "teacher" ? "Guru" : "Siswa"}</Badge></td>
                      <td className="p-2">
                        {t.hasVoted ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Check className="mr-1 h-3 w-3" /> Sudah</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 text-amber-700">Belum</Badge>
                        )}
                      </td>
                      <td className="p-2 text-xs text-blue-500">{t.votedAt ? new Date(t.votedAt).toLocaleString("id-ID") : "-"}</td>
                      <td className="p-2">
                        {!t.hasVoted && (
                          <Button size="sm" variant="ghost" onClick={() => deleteToken(t)} className="h-7 text-rose-600 hover:bg-rose-50">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- SETTINGS ----------------------------- */
function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [electionTitle, setElectionTitle] = useState("");
  const [electionDescription, setElectionDescription] = useState("");
  const [totalVoters, setTotalVoters] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [schoolLogo, setSchoolLogo] = useState("");
  const { toast } = useToast();
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s: Settings) => {
      setSettings(s);
      setSchoolName(s.schoolName);
      setElectionTitle(s.electionTitle);
      setElectionDescription(s.electionDescription);
      setTotalVoters(String(s.totalVoters));
      setIsActive(s.isActive);
      setSchoolLogo(s.schoolLogo);
    }).catch(() => {});
  }, []);

  const handleLogo = (file: File) => {
    if (file.size > 1_500_000) {
      toast({ title: "Logo terlalu besar", description: "Maksimal 1.5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSchoolLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolName, electionTitle, electionDescription,
        totalVoters: Number(totalVoters) || 0, isActive,
        schoolLogo,
      }),
    });
    setSaving(false);
    if (res.ok) toast({ title: "Pengaturan disimpan." });
    else toast({ title: "Gagal menyimpan.", variant: "destructive" });
  };

  if (!settings) return <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-400" /></div>;

  return (
    <Card className="border-blue-100 bg-white/85">
      <CardHeader><CardTitle className="flex items-center gap-2 text-blue-950"><SettingsIcon className="h-5 w-5" /> Pengaturan Pemilihan</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-blue-100">
            {schoolLogo ? (
               
              <img src={schoolLogo} alt="logo" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-blue-200">{schoolName.charAt(0) || "S"}</div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-blue-800">Logo Sekolah</Label>
            <Input ref={logoRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} className="text-xs" />
            <p className="text-[11px] text-blue-500">SVG/PNG/JPG, maks 1.5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-blue-800">Nama Sekolah</Label>
            <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="border-blue-200" />
          </div>
          <div className="space-y-1">
            <Label className="text-blue-800">Total Pemilih (target)</Label>
            <Input type="number" min={0} value={totalVoters} onChange={(e) => setTotalVoters(e.target.value)} className="border-blue-200" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-blue-800">Judul Pemilihan</Label>
          <Input value={electionTitle} onChange={(e) => setElectionTitle(e.target.value)} className="border-blue-200" />
        </div>
        <div className="space-y-1">
          <Label className="text-blue-800">Deskripsi</Label>
          <Textarea value={electionDescription} onChange={(e) => setElectionDescription(e.target.value)} rows={2} className="border-blue-200" />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsActive(!isActive)} variant="outline" className={isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
            {isActive ? "Status: AKTIF" : "Status: NONAKTIF"}
          </Button>
          <p className="text-xs text-blue-600">Aktif/nonaktif hanya untuk tampilan status.</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- RESET ----------------------------- */
function ResetCard({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"votes" | "all">("votes");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true, scope }),
    });
    setLoading(false);
    setOpen(false);
    setConfirm(false);
    if (res.ok) {
      toast({ title: scope === "all" ? "Pemilihan direset total." : "Semua suara dihapus." });
      onDone();
    } else {
      toast({ title: "Gagal reset.", variant: "destructive" });
    }
  };

  return (
    <Card className="border-rose-200 bg-rose-50/50">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
          <div>
            <p className="font-bold text-rose-800">Reset Pemilihan</p>
            <p className="text-xs text-rose-700/80">Hapus semua suara atau seluruh data (token + calon).</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)} className="border-rose-300 text-rose-600 hover:bg-rose-100">
          <RefreshCw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-700">Konfirmasi Reset</DialogTitle>
            <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-blue-800">Ruang Lingkup</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as "votes" | "all")}>
                <SelectTrigger className="border-blue-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes">Hapus semua suara saja</SelectItem>
                  <SelectItem value="all">Hapus suara + token + calon (SEMUA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-blue-800">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="h-4 w-4 rounded" />
              Saya mengerti tindakan ini permanen.
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-blue-200">Batal</Button>
            <Button onClick={run} disabled={!confirm || loading} className="bg-rose-600 text-white hover:bg-rose-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Ya, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
