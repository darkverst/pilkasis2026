// Seed script for the OSIS election app.
// Run with: bun run seed-assets/seed.ts
//
// Populates data for SMP (Tahun 2026):
//   • settings (school name = "SMP Negeri 1 Nusantara", with school logo, tahun 2026)
//   • 4 paired candidate teams (ketua & wakil kelas VII & VIII SMP, visi-misi terstruktur, foto paslon).
//   • 80 student tokens + 10 teacher tokens (90 total, batch tahun 2026)
//   • 10 + 7 + 5 + 3 = 25 sample votes across candidates for realistic live turnout demo.

import { db } from "../src/lib/db";
import { generateBatch } from "../src/lib/auth";
import fs from "fs";
import path from "path";

function toDataUrl(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ext;
  const b64 = fs.readFileSync(filePath).toString("base64");
  return `data:image/${mime};base64,${b64}`;
}

interface CandidateSeed {
  name: string;
  class: string;
  photo: string;
  vision: string;
  mission: string;
  order: number;
  color: string;
  isPair: boolean;
  partnerName: string;
  partnerClass: string;
  partnerPhotoFile: string;
}

const SCHOOL_NAME = "SMP Negeri 1 Nusantara";

async function main() {
  console.log("🌱 Seeding OSIS SMP election database (Tahun 2026)...");

  // 1. Reset existing data (votes -> voters -> candidates).
  await db.vote.deleteMany({});
  await db.voter.deleteMany({});
  await db.candidate.deleteMany({});

  // 2. Settings with school logo (SMP Tahun 2026/2027)
  const logoPath = path.join(__dirname, "school-logo.png");
  const logo = fs.existsSync(logoPath) ? toDataUrl(logoPath) : "";

  await db.settings.upsert({
    where: { id: "default" },
    update: {
      schoolName: SCHOOL_NAME,
      schoolLogo: logo,
      electionTitle: "Pemilihan Ketua & Wakil Ketua OSIS 2026",
      electionDescription:
        "Suarakan pilihanmu untuk pasangan calon pemimpin OSIS SMP Negeri 1 Nusantara periode 2026/2027. Satu token rahasia, satu suara, demi kemajuan dan prestasi sekolah.",
      isActive: true,
      totalVoters: 90,
      resultsPublic: true,
      bgBlur: 12,
      bgOpacity: 60,
    },
    create: {
      id: "default",
      schoolName: SCHOOL_NAME,
      schoolLogo: logo,
      electionTitle: "Pemilihan Ketua & Wakil Ketua OSIS 2026",
      electionDescription:
        "Suarakan pilihanmu untuk pasangan calon pemimpin OSIS SMP Negeri 1 Nusantara periode 2026/2027. Satu token rahasia, satu suara, demi kemajuan dan prestasi sekolah.",
      isActive: true,
      totalVoters: 90,
      resultsPublic: true,
      bgBlur: 12,
      bgOpacity: 60,
    },
  });
  console.log(`✓ Settings updated — school: ${SCHOOL_NAME} (Tahun 2026)`);

  // 3. Candidates (4 Pasangan Calon SMP untuk Tahun 2026/2027)
  const candidatesData: CandidateSeed[] = [
    {
      name: "Andi Pratama Wijaya",
      class: "VIII A",
      photo: "candidate-1.png",
      vision:
        "Mewujudkan OSIS SMP Negeri 1 Nusantara yang aktif, berprestasi, berkarakter santun, dan menjunjung tinggi nilai gotong royong.",
      mission:
        "1. Mengembangkan minat bakat siswa di bidang akademik, seni, dan olahraga\n2. Meluncurkan kotak aspirasi digital untuk suara siswa yang terbuka dan solutif\n3. Menghidupkan program mentoring belajar bersama antar angkatan (kelas 7, 8, dan 9)\n4. Membudayakan literasi dan gerakan sekolah ramah lingkungan bebas sampah plastik",
      order: 1,
      color: "#2563eb",
      isPair: true,
      partnerName: "Dewi Lestari Anggraini",
      partnerClass: "VII B",
      partnerPhotoFile: "candidate-2.png",
    },
    {
      name: "Salsabila Kirana Putri",
      class: "VIII C",
      photo: "candidate-2.png",
      vision:
        "Membangun lingkungan sekolah SMP yang inklusif, kreatif, ramah anak, serta peduli kesehatan mental dan solidaritas antarsiswa.",
      mission:
        "1. Membentuk ruang konseling sebaya dan gerakan kampanye anti-perundungan (Stop Bullying)\n2. Menyelenggarakan festival kreasi mading, poster digital, dan pentas seni mingguan\n3. Pengelolaan bank sampah kelas dan taman edukasi hijau sekolah\n4. Mempererat kolaborasi kegiatan positif antar seluruh ekstrakurikuler sekolah",
      order: 2,
      color: "#0284c7",
      isPair: true,
      partnerName: "Muhammad Fadhil Ramadhan",
      partnerClass: "VII A",
      partnerPhotoFile: "candidate-3.png",
    },
    {
      name: "Rizky Maulana Akbar",
      class: "VIII B",
      photo: "candidate-3.png",
      vision:
        "Menjadikan OSIS SMP sebagai wadah inovasi teknologi, sains, dan kepemimpinan muda yang berjiwa kompetitif serta berakhlak mulia.",
      mission:
        "1. Mengadakan pekan sains, olimpiade matematika internal, dan pengenalan coding dasar\n2. Modernisasi media komunikasi OSIS dan sistem voting digital yang transparan\n3. Pelatihan kepemimpinan dan public speaking bagi pengurus kelas VII dan VIII\n4. Gerakan berbagi buku bacaan dan perlengkapan sekolah bagi siswa yang membutuhkan",
      order: 3,
      color: "#4f46e5",
      isPair: true,
      partnerName: "Zahra Amelia Putri",
      partnerClass: "VIII D",
      partnerPhotoFile: "candidate-4.png",
    },
    {
      name: "Aisyah Nurrahmawati",
      class: "VIII E",
      photo: "candidate-4.png",
      vision:
        "Menciptakan OSIS yang tanggap menyerap aspirasi, berjiwa wirausaha muda, serta menjunjung tinggi transparansi dan kedisiplinan.",
      mission:
        "1. Menyelenggarakan bazar kewirausahaan siswa dan pelatihan kerajinan daur ulang\n2. Forum musyawarah perwakilan kelas bulanan bersama pembina OSIS dan guru\n3. Program bakti sosial rutin dan kepedulian lingkungan sekitar sekolah\n4. Peningkatan kenyamanan sarana ibadah, fasilitas kantin sehat, dan kebersihan toilet sekolah",
      order: 4,
      color: "#0d9488",
      isPair: true,
      partnerName: "Bintang Putra Perdana",
      partnerClass: "VII C",
      partnerPhotoFile: "candidate-1.png",
    },
  ];

  const createdCandidates: Awaited<ReturnType<typeof db.candidate.create>>[] = [];
  for (const c of candidatesData) {
    const photoPath = path.join(__dirname, c.photo);
    const photo = fs.existsSync(photoPath) ? toDataUrl(photoPath) : "";

    let partnerPhoto = "";
    if (c.isPair && c.partnerPhotoFile) {
      const partnerPath = path.join(__dirname, c.partnerPhotoFile);
      partnerPhoto = fs.existsSync(partnerPath) ? toDataUrl(partnerPath) : "";
    }

    const created = await db.candidate.create({
      data: {
        name: c.name,
        class: c.class,
        photo,
        vision: c.vision,
        mission: c.mission,
        order: c.order,
        color: c.color,
        isPair: c.isPair,
        partnerName: c.partnerName,
        partnerClass: c.partnerClass,
        partnerPhoto,
      },
    });
    createdCandidates.push(created);
    const pairLabel = c.isPair ? ` (Pasangan: ${c.partnerName} - ${c.partnerClass})` : "";
    console.log(`✓ Paslon ${c.order} created: ${c.name} (${c.class})${pairLabel}`);
  }

  // 4. Generate voter tokens: 80 students + 10 teachers (90 total) batch tahun 2026
  const studentTokens = generateBatch(80);
  const teacherTokens = generateBatch(10);

  await db.voter.createMany({
    data: studentTokens.map((token) => ({
      token,
      role: "student",
      batch: "Siswa SMP 2026",
    })),
  });
  await db.voter.createMany({
    data: teacherTokens.map((token) => ({
      token,
      role: "teacher",
      batch: "Guru SMP 2026",
    })),
  });
  console.log(
    `✓ Created ${studentTokens.length} student tokens (Siswa SMP 2026) + ${teacherTokens.length} teacher tokens (Guru SMP 2026)`
  );

  // 5. Clean state: 0 sample votes (ready for official election)
  console.log("✓ Status pemilihan bersih: 0 suara awal (seluruh token pemilih siap digunakan)");

  // Print sample tokens for manual testing
  const sampleTokens = await db.voter.findMany({ where: { hasVoted: false }, take: 5 });
  console.log("\n🎫 Sample unused tokens for testing (Tahun 2026):");
  for (const t of sampleTokens) {
    console.log(`   ${t.token} (${t.role} - ${t.batch})`);
  }

  const totalVotes = await db.vote.count();
  const totalVoters = await db.voter.count();
  const pct = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0;
  console.log(
    `\n🎉 Seed complete! ${totalVotes} votes / ${totalVoters} voters (${pct}% turnout) - SMP 2026`
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
