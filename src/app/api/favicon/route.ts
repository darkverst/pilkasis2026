import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await db.settings.findUnique({
      where: { id: "default" },
      select: { schoolLogo: true },
    });

    if (s?.schoolLogo) {
      // Handle base64 data URL
      if (s.schoolLogo.startsWith("data:")) {
        const match = s.schoolLogo.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const buffer = Buffer.from(match[2], "base64");
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=60, s-maxage=60",
            },
          });
        }
      }

      // Handle external or relative URL
      if (s.schoolLogo.startsWith("http://") || s.schoolLogo.startsWith("https://")) {
        return NextResponse.redirect(s.schoolLogo);
      }
    }
  } catch (err) {
    console.error("[GET /api/favicon] error:", err);
  }

  // Fallback to public/logo.svg
  try {
    const defaultLogoPath = path.join(process.cwd(), "public", "logo.svg");
    if (fs.existsSync(defaultLogoPath)) {
      const svg = fs.readFileSync(defaultLogoPath);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch {}

  return new NextResponse(null, { status: 404 });
}
