// Seed script for the OSIS election app.
// Run with: bun run seed-assets/seed.ts
//
// Populates:
//   • settings (school name = "SMP Negeri 1 Nusantara", with school logo)
//   • 4 candidates (photo, vision, numbered mission, accent color).
//       Candidate 1 (Andi) is a PAIR — partner = "Dewi Lestari Anggraini" (IX A).
//       Partner photo reuses candidate-2.png.
//   • 80 student tokens + 10 teacher tokens (90 total)
//   • 9 + 6 + 4 + 3 = 22 sample votes across candidates
//
// The candidate create loop loads the partner photo and passes the pair
// fields (isPair, partnerName, partnerClass, partnerPhoto) through to
// `db.candidate.create`.

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
  partnerPhotoFile: string; // loaded from seed-assets/ if present
}

const SCHOOL_NAME = "SMP Negeri 1 Nusantara";

async function main() {
  console.log("🌱 Seeding OSIS election database...");

  // 1. Reset existing data (votes -> voters -> candidates). Settings preserved.
  await db.vote.deleteMany({});
  await db.voter.deleteMany({});
  await db.candidate.deleteMany({});

  // 2. Settings with school logo
  const logoPath = path.join(__dirname, "school-logo.png");
  const logo = fs.existsSync(logoPath) ? toDataUrl(logoPath) : "";

  await db.settings.upsert({
    where: { id: "default" },
    update: {
      schoolName: SCHOOL_NAME,
      schoolLogo: logo,
      electionTitle: "Pemilihan Ketua & Wakil OSIS 2025",
      electionDescription:
        "Suarakan pilihanmu untuk pemimpin OSIS periode 2025/2026. Satu token, satu suara, untuk masa depan sekolah yang lebih baik.",
      isActive: true,
      totalVoters: 90,
      resultsPublic: true,
    },
    create: {
      id: "default",
      schoolName: SCHOOL_NAME,
      schoolLogo: logo,
      electionTitle: "Pemilihan Ketua & Wakil OSIS 2025",
      electionDescription:
        "Suarakan pilihanmu untuk pemimpin OSIS periode 2025/2026. Satu token, satu suara, untuk masa depan sekolah yang lebih baik.",
      isActive: true,
      totalVoters: 90,
      resultsPublic: true,
    },
  });
  console.log(`✓ Settings updated — school: ${SCHOOL_NAME}`);

  // 3. Candidates (4 — IX A through IX D)
  //    Candidate 1 (Andi) is a PAIR; partner = "Dewi Lestari Anggraini" (IX A).
  //    Partner photo reuses candidate-2.png.
  const candidatesData: CandidateSeed[] = [
    {
      name: "Andi Pratama Wijaya",
      class: "IX A",
      photo: "candidate-1.png",
      vision:
        "Mewujudkan OSIS yang aktif, kreatif, dan aspiratif sebagai wadah pengembangan minat dan bakat seluruh siswa SMP Negeri 1 Nusantara.",
      mission:
        "Menghidupkan kembali kegiatan ekstrakurikuler yang sempat vakum\nMenyelenggarakan festival seni dan olahraga tahunan\nMembuka kotak aspirasi digital untuk siswa\nMeningkatkan solidaritas antar angkatan melalui program mentoring",
      order: 1,
      color: "#3b82f6",
      isPair: true,
      partnerName: "Dewi Lestari Anggraini",
      partnerClass: "IX A",
      partnerPhotoFile: "candidate-2.png",
    },
    {
      name: "Salsabila Kirana Putri",
      class: "IX B",
      photo: "candidate-2.png",
      vision:
        "Membangun OSIS yang inklusif dan berorientasi pada kesejahteraan siswa serta lingkungan sekolah yang nyaman.",
      mission:
        "Program literasi dan pojok baca di setiap kelas\nKampanye go-green dan pengelolaan sampah sekolah\nKonseling sebaya untuk kesehatan mental siswa\nKolaborasi dengan wali murid dalam setiap kegiatan",
      order: 2,
      color: "#0ea5e9",
      isPair: false,
      partnerName: "",
      partnerClass: "",
      partnerPhotoFile: "",
    },
    {
      name: "Rizky Maulana Akbar",
      class: "IX C",
      photo: "candidate-3.png",
      vision:
        "Menjadikan OSIS sebagai motor penggerak inovasi dan prestasi sekolah di tingkat regional maupun nasional.",
      mission:
        "Membentuk tim riset dan klub sains sekolah\nMengadakan kompetisi internal lintas kelas\nMembangun media sosial OSIS yang informatif\nProgram beasiswa internal bagi siswa kurang mampu",
      order: 3,
      color: "#6366f1",
      isPair: false,
      partnerName: "",
      partnerClass: "",
      partnerPhotoFile: "",
    },
    {
      name: "Aisyah Nurrahmawati",
      class: "IX D",
      photo: "candidate-4.png",
      vision:
        "Menciptakan OSIS yang transparan, kolaboratif, dan mendengar suara setiap siswa tanpa terkecuali.",
      mission:
        "Rapat terbuka bulanan OSIS yang dapat dihadiri semua siswa\nProgram pertukaran budaya antar sekolah\nPelatihan kepemimpinan untuk kelas VII dan VIII\nPeningkatan fasilitas kantin dan toilet sekolah",
      order: 4,
      color: "#14b8a6",
      isPair: false,
      partnerName: "",
      partnerClass: "",
      partnerPhotoFile: "",
    },
  ];

  const createdCandidates: Awaited<ReturnType<typeof db.candidate.create>>[] = [];
  for (const c of candidatesData) {
    const photoPath = path.join(__dirname, c.photo);
    const photo = fs.existsSync(photoPath) ? toDataUrl(photoPath) : "";

    // Load partner photo only if this candidate is a pair
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
    const pairLabel = c.isPair ? ` (pair w/ ${c.partnerName})` : "";
    console.log(`✓ Candidate created: ${c.name}${pairLabel}`);
  }

  // 4. Generate voter tokens: 80 students + 10 teachers (90 total)
  const studentTokens = generateBatch(80);
  const teacherTokens = generateBatch(10);

  await db.voter.createMany({
    data: studentTokens.map((token) => ({
      token,
      role: "student",
      batch: "Siswa 2025",
    })),
  });
  await db.voter.createMany({
    data: teacherTokens.map((token) => ({
      token,
      role: "teacher",
      batch: "Guru 2025",
    })),
  });
  console.log(
    `✓ Created ${studentTokens.length} student tokens + ${teacherTokens.length} teacher tokens (${studentTokens.length + teacherTokens.length} total)`
  );

  // 5. Cast sample votes so the live results look alive.
  //    Distribution: 9 + 6 + 4 + 3 = 22 votes.
  const voteDistribution = [9, 6, 4, 3];
  const votesNeeded = voteDistribution.reduce((s, n) => s + n, 0);
  const allVoters = await db.voter.findMany({
    where: { hasVoted: false },
    take: votesNeeded,
  });

  let voterIdx = 0;
  for (let i = 0; i < createdCandidates.length; i++) {
    const candidate = createdCandidates[i];
    const count = voteDistribution[i] || 0;
    for (let v = 0; v < count; v++) {
      const voter = allVoters[voterIdx++];
      if (!voter) break;
      await db.vote.create({
        data: {
          candidateId: candidate.id,
          voterId: voter.id,
        },
      });
      await db.voter.update({
        where: { id: voter.id },
        data: {
          hasVoted: true,
          votedAt: new Date(Date.now() - Math.random() * 3600000),
          usedToken: true,
        },
      });
    }
    console.log(`✓ ${count} votes cast for ${candidate.name}`);
  }

  // Print a few sample tokens for testing
  const sampleTokens = await db.voter.findMany({ where: { hasVoted: false }, take: 5 });
  console.log("\n🎫 Sample unused tokens for testing:");
  for (const t of sampleTokens) {
    console.log(`   ${t.token} (${t.role})`);
  }

  const totalVotes = await db.vote.count();
  const totalVoters = await db.voter.count();
  const pct = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0;
  console.log(
    `\n🎉 Seed complete! ${totalVotes} votes / ${totalVoters} voters (${pct}% turnout)`
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
