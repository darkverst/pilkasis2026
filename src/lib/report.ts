// Report generator for the OSIS election app.
// Builds a formal, print-ready Berita Acara & Laporan Hasil Pemilihan HTML
// document adhering to official Indonesian school election standards.
// Fully self-contained (inline CSS, embedded photos, offline-ready).

import type { ElectionResults, Settings, TokenStats } from "@/lib/types";

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function fmtTime(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return (
      d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  } catch {
    return String(iso);
  }
}

function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  } catch {
    return String(iso);
  }
}

export function generateElectionReportHTML(
  results: ElectionResults,
  settings: Settings | null,
  stats?: TokenStats | null,
): string {
  const schoolName = settings?.schoolName || "SMP / SMA Negeri 1";
  const electionTitle = settings?.electionTitle || "Pemilihan Ketua & Wakil Ketua OSIS";
  const electionDesc = settings?.electionDescription || "";
  const schoolLogo = settings?.schoolLogo || "";
  const now = new Date();
  const currentYear = now.getFullYear();

  // Candidates sorted by vote count descending
  const candidatesList = Array.isArray(results?.candidates)
    ? [...results.candidates].sort((a, b) => {
        if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
        return a.order - b.order;
      })
    : [];

  const winner = candidatesList[0];
  const hasVotes = (results?.totalVotes ?? 0) > 0 && !!winner && winner.voteCount > 0;

  // Total voters (DPT) and turnout calculation
  const totalDPT =
    stats?.total ||
    settings?.totalVoters ||
    results?.totalVoters ||
    candidatesList.reduce((acc, c) => acc + c.voteCount, 0);

  const totalSuaraMasuk = results?.totalVotes ?? 0;
  const turnOutPct =
    totalDPT > 0
      ? Math.round((totalSuaraMasuk / totalDPT) * 100)
      : results?.turnOut ?? 0;

  const totalGolput = Math.max(0, totalDPT - totalSuaraMasuk);
  const golputPct = totalDPT > 0 ? Math.max(0, 100 - turnOutPct) : 0;

  // Breakdown statistics (students & teachers) if available
  const hasBreakdown = !!stats && (stats.students.total > 0 || stats.teachers.total > 0);
  const studentTotal = stats?.students.total ?? 0;
  const studentVoted = stats?.students.voted ?? 0;
  const studentPct = studentTotal > 0 ? Math.round((studentVoted / studentTotal) * 100) : 0;

  const teacherTotal = stats?.teachers.total ?? 0;
  const teacherVoted = stats?.teachers.voted ?? 0;
  const teacherPct = teacherTotal > 0 ? Math.round((teacherVoted / teacherTotal) * 100) : 0;

  // Candidate rows
  const candidateRows = candidatesList
    .map((c, idx) => {
      const isWinner = hasVotes && idx === 0;

      // Photo rendering (single or pair side-by-side)
      let photoHtml = "";
      if (c.isPair && c.partnerPhoto) {
        photoHtml = `
          <div class="photo-pair">
            <div class="photo-box">
              <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" onerror="this.style.display='none'" />
            </div>
            <span class="photo-amp">&amp;</span>
            <div class="photo-box">
              <img src="${escapeHtml(c.partnerPhoto)}" alt="${escapeHtml(c.partnerName)}" onerror="this.style.display='none'" />
            </div>
          </div>
        `;
      } else if (c.photo) {
        photoHtml = `
          <div class="photo-single">
            <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" onerror="this.style.display='none'" />
          </div>
        `;
      } else {
        photoHtml = `<div class="photo-placeholder">No. ${c.order || idx + 1}</div>`;
      }

      // Name & Pair details
      let nameDetails = `<div class="cand-name">${escapeHtml(c.name)} <span class="cand-class">(${escapeHtml(c.class || "-")})</span></div>`;
      if (c.isPair && c.partnerName) {
        nameDetails += `
          <div class="cand-partner">
            <span class="badge-role">Wakil:</span> ${escapeHtml(c.partnerName)}
            <span class="cand-class">(${escapeHtml(c.partnerClass || "-")})</span>
          </div>
        `;
      }

      return `
        <tr class="${isWinner ? "row-winner" : ""}">
          <td class="col-center col-num">${c.order || idx + 1}</td>
          <td class="col-center col-photo">${photoHtml}</td>
          <td class="col-name">
            ${nameDetails}
          </td>
          <td class="col-right col-votes">
            <strong>${c.voteCount.toLocaleString("id-ID")}</strong>
          </td>
          <td class="col-right col-pct">
            <strong>${c.percentage}%</strong>
          </td>
          <td class="col-bar">
            <div class="progress-wrap">
              <div class="progress-fill" style="width: ${Math.min(100, Math.max(2, c.percentage))}%; background-color: ${c.color || "#1e40af"};"></div>
            </div>
          </td>
          <td class="col-center col-status">
            ${
              isWinner
                ? `<span class="badge-winner">&#9733; Terpilih</span>`
                : `<span class="badge-regular">-</span>`
            }
          </td>
        </tr>
      `;
    })
    .join("");

  // Winner Announcement Section
  const winnerAnnouncement = hasVotes && winner
    ? `
      <div class="winner-box">
        <div class="winner-title">&#127942; PASANGAN CALON TERPILIH</div>
        <div class="winner-content">
          <div class="winner-main-name">
            Nomor Urut ${winner.order || 1}: ${escapeHtml(winner.name)}
            ${winner.isPair && winner.partnerName ? ` &amp; ${escapeHtml(winner.partnerName)}` : ""}
          </div>
          <div class="winner-details">
            Perolehan: <strong>${winner.voteCount.toLocaleString("id-ID")} suara (${winner.percentage}%)</strong>
            dari total ${totalSuaraMasuk.toLocaleString("id-ID")} suara sah yang masuk.
          </div>
        </div>
      </div>
    `
    : `
      <div class="winner-box winner-pending">
        <div class="winner-title">STATUS PEMILIHAN</div>
        <div class="winner-details">Pemungutan suara masih berlangsung atau belum ada suara yang tercatat.</div>
      </div>
    `;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laporan Hasil Pemilihan — ${escapeHtml(electionTitle)}</title>
  <style>
    /* Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Screen-only Action Bar */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .action-bar-title {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-bar-hint {
      font-size: 12px;
      color: #94a3b8;
    }
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .btn-close {
      background: #334155;
      color: #f8fafc;
    }
    .btn-close:hover {
      background: #475569;
    }

    /* Document Sheet (A4 Simulation) */
    .sheet-wrapper {
      padding: 24px 16px 40px;
      display: flex;
      justify-content: center;
    }
    .sheet {
      width: 100%;
      max-width: 820px;
      background: #ffffff;
      padding: 36px 44px;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
    }

    /* Kop Surat Resmi */
    .kop-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      text-align: center;
      padding-bottom: 12px;
    }
    .kop-logo {
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kop-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .kop-logo-placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1e40af;
      color: #ffffff;
      font-size: 26px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kop-text {
      flex: 1;
    }
    .kop-org {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #1e3a8a;
      margin: 0;
    }
    .kop-school {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #0f172a;
      margin: 2px 0;
    }
    .kop-committee {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #334155;
      margin: 0;
    }
    .kop-address {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }

    /* Kop Separator Line (Double Line) */
    .kop-divider {
      border-top: 3px solid #0f172a;
      border-bottom: 1px solid #0f172a;
      height: 3px;
      margin: 10px 0 20px;
    }

    /* Document Title */
    .doc-title-container {
      text-align: center;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-decoration: underline;
      margin: 0;
      color: #0f172a;
    }
    .doc-subtitle {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 4px 0 2px;
      color: #1e40af;
    }
    .doc-meta {
      font-size: 11px;
      color: #64748b;
    }

    /* Paragraph Narration */
    .narration {
      font-size: 12.5px;
      text-align: justify;
      margin-bottom: 18px;
      line-height: 1.6;
    }

    /* Section Headings */
    .section-title {
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #0f172a;
      border-left: 3px solid #1e40af;
      padding-left: 8px;
      margin: 20px 0 10px;
      letter-spacing: 0.02em;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    table.data-table th,
    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      vertical-align: middle;
    }
    table.data-table th {
      background-color: #f8fafc;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
    }
    table.data-table tr.row-winner {
      background-color: #fefce8;
    }

    /* Column Utilities */
    .col-center { text-align: center; }
    .col-right { text-align: right; }
    .col-num { width: 36px; font-weight: 700; }
    .col-photo { width: 84px; }
    .col-name { min-width: 180px; }
    .col-votes { width: 80px; }
    .col-pct { width: 70px; }
    .col-bar { width: 110px; }
    .col-status { width: 80px; }

    /* Photos */
    .photo-single img,
    .photo-box img {
      width: 36px;
      height: 48px;
      object-fit: cover;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
      display: block;
    }
    .photo-pair {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
    }
    .photo-amp {
      font-size: 10px;
      font-weight: 900;
      color: #2563eb;
    }
    .photo-placeholder {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 3px;
      padding: 6px 2px;
      text-align: center;
    }

    /* Candidate Info */
    .cand-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 13px;
    }
    .cand-partner {
      font-size: 11.5px;
      color: #1e293b;
      margin-top: 2px;
    }
    .cand-class {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .cand-vision {
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.4;
      font-style: italic;
    }
    .badge-role {
      font-size: 10px;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      padding: 1px 4px;
      border-radius: 3px;
    }

    /* Badges */
    .badge-winner {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      background: #fef08a;
      color: #854d0e;
      border: 1px solid #facc15;
      border-radius: 9999px;
    }
    .badge-regular {
      color: #94a3b8;
    }

    /* Progress bar */
    .progress-wrap {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }

    /* Rekap Grid Table */
    .rekap-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .rekap-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
    }
    .rekap-label {
      background: #f8fafc;
      font-weight: 600;
      width: 55%;
    }
    .rekap-value {
      text-align: right;
      font-weight: 700;
      width: 45%;
    }

    /* Winner Box */
    .winner-box {
      border: 2px solid #ca8a04;
      background: #fefce8;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 18px 0;
      text-align: center;
    }
    .winner-box.winner-pending {
      border-color: #cbd5e1;
      background: #f8fafc;
    }
    .winner-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #854d0e;
      margin-bottom: 4px;
    }
    .winner-main-name {
      font-size: 15px;
      font-weight: 900;
      color: #1e3a8a;
    }
    .winner-details {
      font-size: 12px;
      color: #475569;
      margin-top: 3px;
    }

    /* Signatures Section */
    .signatures-section {
      margin-top: 32px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sig-date {
      text-align: right;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 28px 40px;
      text-align: center;
    }
    .sig-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sig-role {
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 50px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 12.5px;
      text-decoration: underline;
      color: #0f172a;
    }
    .sig-id {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Footer Note */
    .doc-footer {
      margin-top: 36px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #64748b;
    }

    /* Print Specific Rules */
    @media print {
      @page {
        size: A4 portrait;
        margin: 12mm 15mm 15mm 15mm;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .no-print {
        display: none !important;
      }
      .sheet-wrapper {
        padding: 0 !important;
      }
      .sheet {
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      .page-break-avoid {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      table.data-table th {
        background-color: #f1f5f9 !important;
      }
      .badge-winner {
        background: #fef9c3 !important;
        border-color: #000000 !important;
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen-only Floating Action Bar -->
  <div class="action-bar no-print">
    <div class="action-bar-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <span>Pratinjau Laporan &amp; Berita Acara Pemilihan</span>
      <span class="action-bar-hint">(Pilih "Save as PDF" di menu cetak untuk menyimpan arsip PDF)</span>
    </div>
    <div class="action-buttons">
      <button onclick="window.print()" class="btn btn-print">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>Cetak Laporan / PDF</span>
      </button>
      <button onclick="window.close()" class="btn btn-close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span>Tutup</span>
      </button>
    </div>
  </div>

  <div class="sheet-wrapper">
    <div class="sheet">

      <!-- Kop Surat -->
      <div class="kop-container">
        <div class="kop-logo">
          ${
            schoolLogo
              ? `<img src="${escapeHtml(schoolLogo)}" alt="Logo Sekolah" />`
              : `<div class="kop-logo-placeholder">${escapeHtml(schoolName.charAt(0) || "S")}</div>`
          }
        </div>
        <div class="kop-text">
          <p class="kop-org">ORGANISASI SISWA INTRA SEKOLAH (OSIS)</p>
          <h1 class="kop-school">${escapeHtml(schoolName)}</h1>
          <p class="kop-committee">PANITIA PEMILIHAN KETUA DAN WAKIL KETUA OSIS</p>
          <div class="kop-address">${escapeHtml(electionDesc || "Sistem Pemilihan Umum OSIS Digital")}</div>
        </div>
      </div>

      <div class="kop-divider"></div>

      <!-- Judul Dokumen -->
      <div class="doc-title-container">
        <h2 class="doc-title">BERITA ACARA &amp; LAPORAN HASIL PEMILIHAN</h2>
        <div class="doc-subtitle">${escapeHtml(electionTitle)}</div>
        <div class="doc-meta">Tahun Ajaran ${currentYear}/${currentYear + 1} &middot; Nomor: 001/PAN-OSIS/BA-HASIL/${currentYear}</div>
      </div>

      <!-- Narasi Berita Acara -->
      <p class="narration">
        Pada hari ini <strong>${fmtDate(now)}</strong>, telah diselenggarakan rekapitulasi hasil penghitungan suara 
        <strong>${escapeHtml(electionTitle)}</strong> ${escapeHtml(schoolName)} yang dilaksanakan secara langsung, umum, 
        bebas, rahasia, jujur, dan adil menggunakan Sistem Pemilihan OSIS Digital. Berdasarkan data pemungutan suara yang 
        tercatat secara otomatis di dalam sistem, diperoleh hasil sebagai berikut:
      </p>

      <!-- Bagian 1: Rekapitulasi Pemilih -->
      <div class="section-title">I. Rekapitulasi Pemilih dan Penggunaan Hak Suara</div>
      <table class="rekap-table">
        <tbody>
          <tr>
            <td class="rekap-label">Total Pemilih Terdaftar (DPT)</td>
            <td class="rekap-value">${totalDPT.toLocaleString("id-ID")} Orang</td>
          </tr>
          ${
            hasBreakdown
              ? `
              <tr>
                <td class="rekap-label" style="padding-left: 24px;">&bull; Pemilih Siswa Terdaftar</td>
                <td class="rekap-value" style="font-weight: normal;">${studentTotal.toLocaleString("id-ID")} Orang</td>
              </tr>
              <tr>
                <td class="rekap-label" style="padding-left: 24px;">&bull; Pemilih Guru / Staf Terdaftar</td>
                <td class="rekap-value" style="font-weight: normal;">${teacherTotal.toLocaleString("id-ID")} Orang</td>
              </tr>
              `
              : ""
          }
          <tr>
            <td class="rekap-label">Jumlah Suara Masuk (Partisipasi)</td>
            <td class="rekap-value" style="color: #1e3a8a;">
              ${totalSuaraMasuk.toLocaleString("id-ID")} Suara (${turnOutPct}%)
            </td>
          </tr>
          ${
            hasBreakdown
              ? `
              <tr>
                <td class="rekap-label" style="padding-left: 24px;">&bull; Suara Masuk Siswa</td>
                <td class="rekap-value" style="font-weight: normal;">${studentVoted.toLocaleString("id-ID")} Suara (${studentPct}%)</td>
              </tr>
              <tr>
                <td class="rekap-label" style="padding-left: 24px;">&bull; Suara Masuk Guru / Staf</td>
                <td class="rekap-value" style="font-weight: normal;">${teacherVoted.toLocaleString("id-ID")} Suara (${teacherPct}%)</td>
              </tr>
              `
              : ""
          }
          <tr>
            <td class="rekap-label">Tidak Menggunakan Hak Suara (Golput)</td>
            <td class="rekap-value">${totalGolput.toLocaleString("id-ID")} Orang (${golputPct}%)</td>
          </tr>
          <tr>
            <td class="rekap-label">Total Suara Sah</td>
            <td class="rekap-value" style="color: #047857;">${totalSuaraMasuk.toLocaleString("id-ID")} Suara (100%)</td>
          </tr>
          <tr>
            <td class="rekap-label">Total Suara Tidak Sah / Rusak</td>
            <td class="rekap-value" style="color: #64748b;">0 Suara (0%)</td>
          </tr>
        </tbody>
      </table>

      <!-- Bagian 2: Hasil Perolehan Suara Pasangan Calon -->
      <div class="section-title">II. Perolehan Suara Pasangan Calon</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-center col-num">No.</th>
            <th class="col-center col-photo">Foto</th>
            <th class="col-name">Pasangan Calon</th>
            <th class="col-right col-votes">Suara</th>
            <th class="col-right col-pct">%</th>
            <th class="col-bar">Grafik</th>
            <th class="col-center col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            candidateRows ||
            `<tr><td colspan="7" class="col-center" style="padding: 20px; color: #94a3b8;">Belum ada data pasangan calon yang terdaftar.</td></tr>`
          }
        </tbody>
      </table>

      <!-- Pengumuman Pemenang -->
      <div class="page-break-avoid">
        ${winnerAnnouncement}
      </div>

      <!-- Bagian Penutup -->
      <p class="narration page-break-avoid" style="margin-top: 14px;">
        Demikian Berita Acara dan Laporan Hasil Pemilihan Ketua dan Wakil Ketua OSIS ini dibuat dengan sebenar-benarnya 
        berdasarkan hasil rekapitulasi data digital yang sah, transparan, dan dapat dipertanggungjawabkan untuk dipergunakan 
        sebagaimana mestinya.
      </p>

      <!-- Lembar Tanda Tangan Pengesahan -->
      <div class="signatures-section page-break-avoid">
        <div class="sig-date">
          Ditetapkan di: <strong>${escapeHtml(schoolName)}</strong><br />
          Pada tanggal: <strong>${fmtDate(now)}</strong>
        </div>

        <div class="sig-grid">
          <div class="sig-cell">
            <div class="sig-role">Ketua Panitia Pemilihan OSIS,</div>
            <div class="sig-name">( ............................................ )</div>
            <div class="sig-id">NIS. ........................................</div>
          </div>
          <div class="sig-cell">
            <div class="sig-role">Sekretaris Panitia,</div>
            <div class="sig-name">( ............................................ )</div>
            <div class="sig-id">NIS. ........................................</div>
          </div>
          <div class="sig-cell">
            <div class="sig-role">Mengetahui,<br />Pembina OSIS,</div>
            <div class="sig-name">( ............................................ )</div>
            <div class="sig-id">NIP. ........................................</div>
          </div>
          <div class="sig-cell">
            <div class="sig-role">Mengetahui / Menyetujui,<br />Kepala Sekolah,</div>
            <div class="sig-name">( ............................................ )</div>
            <div class="sig-id">NIP. ........................................</div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="doc-footer page-break-avoid">
        <div>Sistem Pemilihan OSIS Digital &middot; Dokumen Sah Hasil Pemilihan</div>
        <div>Waktu Cetak: ${fmtDateTime(now)} &middot; Data Terakhir: ${fmtDateTime(results.lastUpdated)}</div>
      </div>

    </div>
  </div>

  <script>
    // Automatically trigger print dialog on page load (after short delay for render)
    window.addEventListener("load", function() {
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.error(e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;
}

/** Open the report or document in a new browser tab/window for printing or saving as PDF using Blob URL. */
export function openReportInNewTab(html: string): void {
  if (typeof window === "undefined") return;
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      w.focus();
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    // Revoke blob URL after 2 minutes to free memory
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 120000);
  } catch (err) {
    console.error("Failed to open print tab:", err);
  }
}

