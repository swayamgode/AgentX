import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "puppeteer", "puppeteer-screen-recorder", "@ffmpeg-installer/ffmpeg"],
  // Legacy support for older Next.js versions (if needed)
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
