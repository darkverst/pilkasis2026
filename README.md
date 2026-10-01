# 🗳️ PILKASIS - Sistem Pemilihan OSIS Digital Modern

[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Parallax-black?style=flat&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

**PILKASIS** adalah aplikasi web pemilihan umum ketua & wakil ketua OSIS digital modern yang dirancang untuk sekolah (SMP/SMA/SMK). Dilengkapi dengan efek latar belakang 3D interaktif Three.js, visualisasi hasil *real-time*, validasi token sekali pakai (*single-use token*), manajemen password panitia terenkripsi, favicon dinamis sesuai logo sekolah, cetak laporan formal Berita Acara A4, dan panel admin yang komprehensif.

Aplikasi ini dikembangkan dan didukung oleh **MGMP Informatika Banyuwangi 2026**.

---

## ✨ Fitur Unggulan

- **🗳️ Bilik Suara Digital Cepat & Aman**: Pemungutan suara berbasis token acak unik sekali pakai (*single-use token*) yang mencegah kecurangan atau pemungutan suara ganda.
- **🌐 Latar Belakang 3D Interaktif (Three.js)**: Efek paralaks 3D *real-time* yang responsif terhadap gerakan kursor *mouse* dan *scroll*, menampilkan surat suara melayang, kotak suara pintar berpendar, koin kehormatan OSIS, serta teks dinamis yang terhubung langsung dengan nama sekolah dan tahun pemilihan.
- **🎛️ Kontrol Tampilan & Kontras 3D di Panel Admin**: Pengaturan tingkat keburaman (*backdrop blur*) dan kepekatan lapisan penutup (*dimming opacity*) agar animasi 3D tetap menarik tanpa mengurangi keterbacaan teks dan kartu konten.
- **🎨 Favicon Dinamis Otomatis**: Ikon tab browser secara otomatis menyesuaikan dengan logo sekolah yang diunggah melalui panel admin via endpoint `/api/favicon` dan pembaruan reaktif langsung di sisi klien tanpa perlu *reload* halaman.
- **🔐 Manajemen Keamanan & Password Panitia**: Kata sandi panitia tersimpan terenkripsi dengan aman (`scrypt` + random salt) di skema database. Panitia dapat mengubah kata sandi atau meresetnya kembali ke default kapan saja langsung dari Panel Admin.
- **📊 Hasil Real-Time 2D & 3D**: Grafik perolehan suara *real-time* dengan visualisasi podium 3D dan statistik persentase kehadiran pemilih (*turnout*).
- **🖨️ Cetak Berita Acara & Rekapitulasi (Standar Sekolah)**: Ekspor dokumen resmi Berita Acara Pemilihan dan Hasil Perhitungan Suara berformat A4 lengkap dengan kop surat, rincian DPT siswa/guru, dan 4 kolom tanda tangan legal.
- **🎫 Manajemen Token & Cetak Kartu Suara**: Pembuatan batch token massal, pencetakan kartu token pemilih rapi siap potong, dan filter status voting.
- **⚙️ Konfigurasi Identitas Sekolah Dinamis**: Pengaturan nama sekolah, logo, judul pemilihan, deskripsi, batas waktu pemilihan, dan visibilitas hasil pemilu.

---

## 🚀 Panduan Fork & Deploy ke Vercel

Aplikasi ini siap di-*deploy* langsung ke **Vercel** dengan database PostgreSQL *cloud* gratis (seperti **Neon.tech** atau **Supabase**).

### Langkah 1: Fork Repositori di GitHub
1. Klik tombol **Fork** di pojok kanan atas repositori ini di GitHub: [`https://github.com/darkverst/pilkasis2026.git`](https://github.com/darkverst/pilkasis2026.git).
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
| `ADMIN_PASSWORD` | `MGMPINFBWI` | Password default awal untuk masuk ke panel admin panitia |
| `ADMIN_SESSION_SECRET` | *(string acak 32+ karakter)* | Kunci rahasia enkripsi cookie sesi admin |

> 💡 *Catatan Teknis*: File `vercel.json` dan skrip `vercel-build` dalam repositori ini sudah secara otomatis menjalankan migrasi skema tabel PostgreSQL (`prisma/schema.prod.prisma`) saat proses build berjalan di Vercel.

6. Klik tombol **Deploy** dan tunggu proses build selesai (sekitar 1-2 menit).
7. 🎉 Aplikasi Pilkasis Anda sekarang sudah live di domain Vercel (misal: `https://pilkasis-anda.vercel.app`)!

---

### Langkah 4: Seeding Data Awal (Opsional)

Jika ingin mengisi data awal (Pasangan Calon, Pengaturan SMP 2026, dan 90 Token Pemilih Sampel Siap Pakai) ke database production Anda:

1. Di komputer lokal Anda, buka terminal di folder proyek:
   ```bash
   # Buat file .env atau set DATABASE_URL ke database Postgres production
   DATABASE_URL="postgresql://username:password@your-db-host/neondb?sslmode=require"
   ```
2. Jalankan perintah:
   ```bash
   # 1. Sinkronkan skema ke database Postgres
   bunx prisma db push --schema=./prisma/schema.prod.prisma

   # 2. Generate Prisma Client untuk PostgreSQL
   bunx prisma generate --schema=./prisma/schema.prod.prisma

   # 3. Jalankan pengisian data awal SMP 2026
   DATABASE_URL="postgresql://username:password@your-db-host/neondb?sslmode=require" bun run seed-assets/seed.ts

   # 4. Kembalikan Prisma Client lokal ke SQLite (jika mengembangkan secara lokal)
   bunx prisma generate --schema=./prisma/schema.prisma
   ```
3. Data paslon dan token sudah terisi ke database production Anda dengan kondisi bersih (0 suara awal).

---

## 💻 Panduan Menjalankan di Lokal (Development)

Untuk pengembangan lokal, proyek ini menggunakan **SQLite** secara default (tanpa perlu install database server):

### 1. Kloning Repositori
```bash
git clone https://github.com/darkverst/pilkasis2026.git
cd pilkasis2026
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

## 🔑 Kredensial & Keamanan Admin

- **Akses Panel Admin**: Klik tombol **Admin** di bilah navigasi kanan atas atau navigasikan ke `/` dan pilih menu Admin.
- **Password Default**: **`MGMPINFBWI`** (Musyawarah Guru Mata Pelajaran Informatika Banyuwangi).
- **Mengubah Password**: Masuk ke **Panel Admin** → tab **Pengaturan** → kartu **"Keamanan & Password Panitia"**. Masukkan password saat ini dan password baru (minimal 6 karakter).
- **Reset Password**: Jika password kustom aktif dan ingin dikembalikan ke default, klik tombol **"Reset ke Default (MGMPINFBWI)"** di kartu keamanan.

---

## 🛠️ Perintah Berguna (Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run dev` | Menjalankan server development Next.js (port 3000) |
| `bun run build` | Melakukan kompilasi production build lokal |
| `bun run verify` | Menjalankan typecheck TypeScript (`tsc`) dan linter (`eslint`) |
| `bun run smoke` | Menjalankan 21 automated smoke tests untuk seluruh API |
| `bun run seed` | Mengisi ulang data demo pemilihan SMP 2026 (0 suara awal) |
| `bun run db:push` | Sinkronisasi skema Prisma ke database SQLite lokal |

---

## 👥 Kredit & Kontributor

Aplikasi ini dikembangkan dan disempurnakan bersama:
- **MGMP Informatika Banyuwangi 2026** — Inisiator, pengarah kurikulum, dan pengembang sistem pemilihan sekolah digital.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Bebas digunakan, dimodifikasi, dan disebarluaskan untuk kebutuhan sekolah, organisasi, maupun edukasi.
