# 🗳️ PILKASIS - Sistem Pemilihan OSIS Digital Modern

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Parallax-black?style=flat&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

**PILKASIS** adalah aplikasi web pemilihan umum ketua & wakil ketua OSIS digital yang dirancang untuk sekolah (SMP/SMA/SMK). Dilengkapi dengan efek latar belakang 3D interaktif Three.js, visualisasi hasil *real-time*, validasi token sekali pakai (*single-use token*), cetak laporan formal Berita Acara A4, dan panel panitia yang komprehensif.

---

## ✨ Fitur Unggulan

- **🗳️ Bilik Suara Digital Cepat & Aman**: Pemungutan suara berbasis token acak unik sekali pakai (*single-use token*) yang mencegah kecurangan atau golput ganda.
- **🌐 Latar Belakang 3D Interaktif (Three.js)**: Efek paralaks 3D *real-time* yang responsif terhadap gerakan kursor *mouse* dan *scroll*, menampilkan surat suara melayang, kotak suara pintar berpendar, koin kehormatan OSIS, dan terhubung dinamis dengan identitas sekolah.
- **📊 Hasil Real-Time 2D & 3D**: Grafik perolehan suara *real-time* dengan visualisasi podium 3D dan statistik persentase kehadiran pemilih (*turnout*).
- **🖨️ Cetak Berita Acara & Rekapitulasi (Standar Sekolah)**: Ekspor dokumen resmi Berita Acara Pemilihan dan Hasil Perhitungan Suara berformat A4 lengkap dengan kop surat, rincian DPT siswa/guru, dan 4 kolom tanda tangan legal.
- **🎫 Manajemen Token & Cetak Kartu Suara**: Pembuatan batch token massal, pencetakan kartu token pemilih rapi siap potong, dan filter status voting.
- **⚙️ Konfigurasi Identitas Sekolah Dinamis**: Pengaturan nama sekolah, logo, periode tahun ajaran, batas waktu pemilihan, dan visibilitas hasil pemilu.

---

## 🚀 Panduan Fork & Deploy ke Vercel

Aplikasi ini siap di-*deploy* langsung ke **Vercel** dengan database PostgreSQL *cloud* gratis (seperti **Neon.tech** atau **Supabase**).

### Langkah 1: Fork Repositori di GitHub
1. Klik tombol **Fork** di pojok kanan atas repositori ini di GitHub.
2. Beri nama repositori Anda (misal: `pilkasis` atau `pilkasis-smpn1`).
3. Pastikan opsi *"Copy the main branch only"* dicentang, lalu klik **Create fork**.

---

### Langkah 2: Buat Database PostgreSQL Gratis

Karena Vercel berjalan secara *serverless*, gunakan database PostgreSQL cloud gratis:

#### Opsi A: Menggunakan Neon (Sangat Direkomendasikan - 1 Menit Selesai)
1. Buka [neon.tech](https://neon.tech) dan masuk/daftar menggunakan akun GitHub Anda.
2. Buat proyek baru (misal: `pilkasis-db`).
3. Pada dasbor Neon, salin **Connection String** yang berformat:
   ```text
   postgresql://username:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### Opsi B: Menggunakan Supabase
1. Buka [supabase.com](https://supabase.com) dan buat proyek baru.
2. Buka **Project Settings** → **Database** → **Connection String** (Mode *Transaction* atau *Session*).
3. Salin URL koneksi PostgreSQL Anda.

---

### Langkah 3: Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) dan *Login* menggunakan akun GitHub Anda.
2. Klik **Add New...** → **Project**.
3. Cari repositori fork Anda (`pilkasis`) dan klik **Import**.
4. Pada bagian **Configure Project**:
   - **Framework Preset**: Biarkan otomatis `Next.js`.
   - **Root Directory**: `./` (default).
5. Buka bagian **Environment Variables** dan tambahkan variabel berikut:

| Nama Variabel | Nilai Contoh | Penjelasan |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Connection string PostgreSQL dari Neon / Supabase |
| `ADMIN_PASSWORD` | `MGMPINFBWI` | Password awal masuk ke panel admin panitia (dapat diubah di panel) |
| `ADMIN_SESSION_SECRET` | *(string acak 32+ karakter)* | Kunci rahasia enkripsi cookie sesi admin |

> 💡 *Catatan Teknis*: File `vercel.json` dan skrip `vercel-build` dalam repositori ini sudah secara otomatis menjalankan migrasi skema tabel PostgreSQL (`prisma/schema.prod.prisma`) saat proses build berjalan di Vercel.

6. Klik tombol **Deploy** dan tunggu proses build selesai (sekitar 1-2 menit).
7. 🎉 Aplikasi Pilkasis Anda sekarang sudah live di domain Vercel (misal: `https://pilkasis-anda.vercel.app`)!

---

### Langkah 4: Seeding Data Awal (Opsional)

Jika ingin mengisi data awal (Pasangan Calon, Pengaturan SMP 2026, dan Token Pemilih Sampel) ke database production Anda:

1. Di komputer lokal Anda, buka terminal dan buat file `.env`:
   ```bash
   DATABASE_URL="postgresql://username:password@your-db-host/neondb?sslmode=require"
   ```
2. Jalankan perintah:
   ```bash
   # Sinkronkan skema ke database Postgres
   bunx prisma db push --schema=./prisma/schema.prod.prisma

   # Jalankan pengisian data awal SMP 2026
   bun run seed-assets/seed.ts
   ```
3. Data paslon dan token sudah terisi ke database production Anda!

---

## 💻 Panduan Menjalankan di Lokal (Development)

Untuk pengembangan lokal, proyek ini menggunakan **SQLite** secara default (tanpa perlu install database server):

### 1. Kloning Repositori
```bash
git clone https://github.com/USERNAME/pilkasis.git
cd pilkasis
```

### 2. Pasang Dependencies
Rekomendasi menggunakan [Bun](https://bun.sh) (atau Node.js 20+ dengan npm/pnpm):
```bash
bun install
```

### 3. Buat File Environment
```bash
cp .env.example .env
```
Isi default di `.env` sudah siap untuk development:
```env
DATABASE_URL="file:./db/custom.db"
ADMIN_PASSWORD="MGMPINFBWI"
ADMIN_SESSION_SECRET="kunci_rahasia_lokal_32_karakter_acak"
```

### 4. Siapkan Database & Isi Data Demo
```bash
# Push skema SQLite lokal
bun run db:push

# Isi data awal (SMP 2026: 4 Paslon, 90 Token Pemilih Bersih Siap Pakai)
bun run seed
```

### 5. Jalankan Server Development
```bash
bun run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🔑 Kredensial Default

- **URL Admin**: Klik tab **Admin** di bilah navigasi atau buka `/` lalu navigasikan ke panel admin.
- **Password Panitia**: Default adalah `MGMPINFBWI` (atau nilai dari `ADMIN_PASSWORD` di `.env`). Panitia dapat mengubah password ini kapan saja secara langsung melalui menu **Pengaturan > Keamanan & Password Panitia** di panel admin.

---

## 🛠️ Perintah Berguna (Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run dev` | Menjalankan server development Next.js (port 3000) |
| `bun run build` | Melakukan kompilasi production build lokal |
| `bun run verify` | Menjalankan typecheck TypeScript (`tsc`) dan linter (`eslint`) |
| `bun run smoke` | Menjalankan 21 automated smoke tests untuk seluruh API |
| `bun run seed` | Mengisi ulang data demo pemilihan SMP 2026 |
| `bun run db:push` | Sinkronisasi skema Prisma ke database SQLite lokal |

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Bebas digunakan, dimodifikasi, dan disebarluaskan untuk kebutuhan sekolah, organisasi, maupun edukasi.
