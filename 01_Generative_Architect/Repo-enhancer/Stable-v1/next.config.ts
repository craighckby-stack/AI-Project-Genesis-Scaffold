import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "ais-dev-r54pprcg5tog5pmutezscl-483535245139.asia-southeast1.run.app",
    "ais-pre-r54pprcg5tog5pmutezscl-483535245139.asia-southeast1.run.app"
  ],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
