/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: next.config.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "localhost:3000",
    "ais-dev-amubz4v3czr3772fnvrcru-483535245139.asia-southeast1.run.app",
    "ais-pre-amubz4v3czr3772fnvrcru-483535245139.asia-southeast1.run.app"
  ]
} as any;

export default nextConfig as NextConfig;
