// Seed script for the OSIS election app.
// Run with: bun run seed-assets/seed.ts
// It populates: settings (with school logo), 4 candidates (with photos),
// 60 voter tokens, and ~28 random votes so the live results look alive.

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

async function main() {
  console.log("🌱 Seeding OSIS election database...");

  // 1. Reset existing data (votes -> voters -> candidates)
  await db.vote.deleteMany({});
  await db.voter.deleteMany({});
  await db.candidate.deleteMany({});

  // 2. Settings with school logo
  const logoPath = path.join(__dirname, "school-logo.png");
  const logo = fs.existsSync(logoPath) ? toDataUrl(logoPath) : "";

  await db.settings.upsert({
    where: { id: "default" },
    update: {
      schoolName: "SMA Negeri 1 Nusantara",
      schoolLogo: logo,
      electionTitle: "Pemilihan Ketua & Wakil OSIS 2025",
      electionDescription:
        "Suarakan pilihanmu untuk pemimpin OSIS periode 2025/2026. Satu token, satu suara, untuk masa depan sekolah yang lebih baik.",
      isActive: true,
      totalVoters: 120,
    },
    create: {
      id: "default",
      schoolName: "SMA Negeri 1 Nusantara",
      schoolLogo: logo,
      electionTitle: "Pemilihan Ketua & Wakil OSIS 2025",
      electionDescription:
        "Suarakan pilihanmu untuk pemimpin OSIS periode 2025/2026. Satu token, satu suara, untuk masa depan sekolah yang lebih baik.",
      isActive: true,
      totalVoters: 120,
    },
  });
  console.log("✓ Settings updated with school logo");

  // 3. Candidates
  const candidatesData = [
    {
      name: "Andi Pratama Wijaya",
      class: "XI IPA 1",
      photo: "candidate-1.png",
      vision:
        "Mewujudkan OSIS yang aktif, kreatif, dan aspiratif sebagai wadah pengembangan minat dan bakat seluruh siswa.",
      mission:
        "Menghidupkan kembali kegiatan ekstrakurikuler yang sempat vakum\nMenyelenggarakan festival seni dan olahraga tahunan\nMembuka kotak aspirasi digital untuk siswa\nMeningkatkan solidaritas antar angkatan melalui program mentoring",
      order: 1,
      color: "#3b82f6",
    },
    {
      name: "Salsabila Kirana Putri",
      class: "XI IPS 2",
      photo: "candidate-2.png",
      vision:
        "Membangun OSIS yang inklusif dan berorientasi pada kesejahteraan siswa serta lingkungan sekolah yang nyaman.",
      mission:
        "Program literasi dan pojok baca di setiap kelas\nKampanye go-green dan pengelolaan sampah sekolah\nKonseling sebaya untuk kesehatan mental siswa\nKolaborasi dengan wali murid dalam setiap kegiatan",
      order: 2,
      color: "#0ea5e9",
    },
    {
      name: "Rizky Maulana Akbar",
      class: "XI IPA 3",
      photo: "candidate-3.png",
      vision:
        "Menjadikan OSIS sebagai motor penggerak inovasi dan prestasi sekolah di tingkat regional maupun nasional.",
      mission:
        "Membentuk tim riset dan klub sains sekolah\nMengadakan kompetisi internal lintas jurusan\nMembangun media sosial OSIS yang informatif\nProgram beasiswa internal bagi siswa kurang mampu",
      order: 3,
      color: "#6366f1",
    },
    {
      name: "Aisyah Nurrahmawati",
      class: "XI IPS 1",
      photo: "candidate-4.png",
      vision:
        "Menciptakan OSIS yang transparan, kolaboratif, dan mendengar suara setiap siswa tanpa terkecuali.",
      mission:
        "Rapat terbuka bulanan OSIS yang dapat dihadiri semua siswa\nProgram pertukaran budaya antar sekolah\nPelatihan kepemimpinan untuk kelas X\nPeningkatan fasilitas kantin dan toilet sekolah",
      order: 4,
      color: "#14b8a6",
    },
  ];

  const createdCandidates = [];
  for (const c of candidatesData) {
    const photoPath = path.join(__dirname, c.photo);
    const photo = fs.existsSync(photoPath) ? toDataUrl(photoPath) : "";
    const created = await db.candidate.create({
      data: {
        name: c.name,
        class: c.class,
        photo,
        vision: c.vision,
        mission: c.mission,
        order: c.order,
        color: c.color,
      },
    });
    createdCandidates.push(created);
    console.log(`✓ Candidate created: ${c.name}`);
  }

  // 4. Generate voter tokens: 100 students + 20 teachers
  const studentTokens = generateBatch(100);
  const teacherTokens = generateBatch(20);

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
  console.log(`✓ Created ${studentTokens.length} student tokens + ${teacherTokens.length} teacher tokens`);

  // 5. Cast some sample votes so the live results look alive.
  // Distribute ~28 votes across candidates (uneven, realistic).
  const voteDistribution = [11, 8, 6, 3]; // votes per candidate
  const allVoters = await db.voter.findMany({ where: { hasVoted: false }, take: 40 });
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
        data: { hasVoted: true, votedAt: new Date(Date.now() - Math.random() * 3600000), usedToken: true },
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
  console.log(`\n🎉 Seed complete! ${totalVotes} votes / ${totalVoters} voters (${Math.round((totalVotes/totalVoters)*100)}% turnout)`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
