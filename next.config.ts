import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Types now pass clean — let the build enforce it instead of skipping.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;