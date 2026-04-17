import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".space.z.ai",
    ".z.ai",
    "localhost",
    "21.0.13.199",
  ],
};

export default nextConfig;
