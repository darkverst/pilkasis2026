import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow the preview panel (which runs on a different origin like
  // *.space-z.ai) to load Next.js dev assets. Without this, Next.js 16
  // blocks cross-origin /_next/* requests and the preview shows a blank page.
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai", "localhost", "127.0.0.1"],
};

export default nextConfig;
