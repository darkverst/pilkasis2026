// Report generator for the OSIS election app.
// Builds a standalone HTML document that can be opened in a browser, printed
// to PDF, or attached to an email. The HTML is fully self-contained (inline
// CSS, no external resources) so it works offline.

import type { ElectionResults, Settings } from "@/lib/types";

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateElectionReportHTML(
  results: ElectionResults,
  settings: Settings | null,
): string {
  const schoolName = settings?.schoolName || "SMP Negeri 1";
  const electionTitle = settings?.electionTitle || "Pemilihan Ketua & Wakil OSIS";
  const schoolLogo = settings?.schoolLogo || "";
  const now = new Date().toISOString();

  const sorted = [...(results.candidates || [])].sort(
    (a, b) => b.voteCount - a.voteCount,
  );
  const winner = sorted[0];
  const totalValid = results.totalVotes > 0 && winner ? winner.voteCount > 0 : false;

  const rows = sorted
    .map((c, i) => {
      const isWinner = totalValid && i === 0;
      const pairInfo = c.isPair
        ? `<div class="pair">Wakil: ${escapeHtml(c.partnerName || "-")}${
            c.partnerClass ? " (" + escapeHtml(c.partnerClass) + ")" : ""
          }</div>`
        : "";
      return `
        <tr class="${isWinner ? "winner" : ""}">
          <td class="num">${i + 1}</td>
          <td>
            <div class="name">${escapeHtml(c.name)}</div>
            ${pairInfo}
            <div class="cls">${escapeHtml(c.class || "")}</div>
          </td>
          <td class="votes">${c.voteCount}</td>
          <td class="pct">${c.percentage}%</td>
          <td>
            <div class="bar-track">
              <div class="bar-fill" style="width:${Math.min(100, c.percentage)}%;background:${
                c.color || "#3b82f6"
              }"></div>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  const winnerBlock = totalValid
    ? `<div class="winner-banner">
        <span class="crown">&#9733;</span>
        <div>
          <div class="winner-label">Pemenang Sementara</div>
          <div class="winner-name">${escapeHtml(winner!.name)}</div>
          <div class="winner-meta">${escapeHtml(winner!.class || "")} &middot; ${
            winner!.voteCount
          } suara &middot; ${winner!.percentage}%</div>
        </div>
      </div>`
    : `<div class="winner-banner muted"><span class="crown">&#9733;</span><div><div class="winner-label">Belum ada pemenang</div><div class="winner-meta">Pemilihan belum dimulai atau belum ada suara masuk.</div></div></div>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(electionTitle)} — Laporan Hasil</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f7fbff;
    color: #0a2540;
    margin: 0;
    padding: 32px 20px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report {
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(15, 60, 130, 0.12);
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #1f6feb 0%, #3b82f6 100%);
    color: #ffffff;
    padding: 28px 32px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .logo {
    width: 56px; height: 56px;
    border-radius: 12px;
    background: #ffffff;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  .logo-text { font-size: 22px; font-weight: 900; color: #1f6feb; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
  .header .school { font-size: 12px; opacity: 0.85; margin-top: 2px; }

  .body { padding: 24px 32px 32px; }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  .meta-card {
    background: #f1f6ff;
    border: 1px solid #d6e3ff;
    border-radius: 10px;
    padding: 14px;
  }
  .meta-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #4f7bbf; }
  .meta-card .value { font-size: 22px; font-weight: 900; color: #0a2540; margin-top: 4px; }

  .winner-banner {
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, #fff7e0 0%, #ffe9b0 100%);
    border: 1px solid #f1c653;
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 22px;
  }
  .winner-banner.muted { background: #f3f5f9; border-color: #d6dee9; }
  .winner-banner .crown { font-size: 32px; color: #f59e0b; }
  .winner-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #8b6d1f; }
  .winner-name { font-size: 20px; font-weight: 900; color: #0a2540; margin-top: 2px; }
  .winner-meta { font-size: 13px; color: #4a5568; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4f7bbf;
    padding: 10px 12px;
    border-bottom: 2px solid #d6e3ff;
  }
  tbody td { padding: 12px; border-bottom: 1px solid #eef2f9; vertical-align: top; font-size: 14px; }
  tbody tr.winner { background: #fffaf0; }
  .num { width: 36px; text-align: center; font-weight: 800; color: #1f6feb; }
  .name { font-weight: 700; color: #0a2540; }
  .pair { font-size: 12px; color: #4f7bbf; margin-top: 2px; }
  .cls { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .votes { font-size: 18px; font-weight: 900; color: #0a2540; text-align: right; }
  .pct { font-size: 14px; color: #1f6feb; font-weight: 700; text-align: right; }
  .bar-track { width: 100%; height: 8px; background: #eef2f9; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; }

  .footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid #eef2f9;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #6b7280;
  }

  @media print {
    body { background: #fff; padding: 0; }
    .report { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="report">
    <div class="header">
      <div class="logo">${
        schoolLogo
          ? `<img src="${escapeHtml(schoolLogo)}" alt="logo" />`
          : `<span class="logo-text">${escapeHtml(schoolName.charAt(0) || "S")}</span>`
      }</div>
      <div>
        <h1>${escapeHtml(electionTitle)}</h1>
        <p>Laporan Hasil Pemilihan</p>
        <p class="school">${escapeHtml(schoolName)}</p>
      </div>
    </div>
    <div class="body">
      <div class="meta-grid">
        <div class="meta-card">
          <div class="label">Total Suara</div>
          <div class="value">${results.totalVotes}</div>
        </div>
        <div class="meta-card">
          <div class="label">Total Pemilih</div>
          <div class="value">${results.totalVoters}</div>
        </div>
        <div class="meta-card">
          <div class="label">Partisipasi</div>
          <div class="value">${results.turnOut}%</div>
        </div>
        <div class="meta-card">
          <div class="label">Calon</div>
          <div class="value">${results.candidates.length}</div>
        </div>
      </div>

      ${winnerBlock}

      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Calon</th>
            <th style="text-align:right">Suara</th>
            <th style="text-align:right">Persentase</th>
            <th>Perolehan</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:24px">Belum ada data calon.</td></tr>`}
        </tbody>
      </table>

      <div class="footer">
        <div>Dibuat otomatis oleh Sistem Pemilihan OSIS Digital</div>
        <div> Dicetak: ${fmtDateTime(now)} &middot; Data per: ${fmtDateTime(
          results.lastUpdated,
        )}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Open the report in a new browser tab/window for printing or saving as PDF. */
export function openReportInNewTab(html: string): void {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
