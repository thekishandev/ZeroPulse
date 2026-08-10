import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles everything needed to run Next.js into .next/standalone
  // so Zerops only needs to ship that folder + static assets — no node_modules required.
  output: "standalone",
};

export default nextConfig;
