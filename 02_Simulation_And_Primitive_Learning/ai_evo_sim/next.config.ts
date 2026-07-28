/**
 * @file next.config.ts
 * @description DARLEK CANN System Orchestration Manifest.
 * This file governs the Next.js build pipeline, security headers, and environment integration.
 * It acts as the primary interface between the Agent Orchestra and the underlying Vercel/Node.js runtime.
 * 
 * Integration Context:
 * - Siphoned patterns from Vercel/Next.js production standards.
 * - Aligned with Microsoft/Semantic-Kernel security protocols.
 * - Linked to the global 'System Integrity Manifest' (missing_files.json).
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-grade output optimization
  output: "standalone",
  
  // Security & Performance Hardening
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // Compiler & Build Optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Type Safety Enforcement
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
  },

  // Environment-based Origin Configuration
  // Replaces hardcoded dev origins with secure environment-injected variables
  env: {
    DEPLOYMENT_ENV: process.env.NODE_ENV,
    SYSTEM_VERSION: "3.0.0-DARLEK-CANN",
  },

  // Experimental Features for Agent Orchestra Velocity
  experimental: {
    turbopack: true,
    optimizePackageImports: ["@vercel/ai", "lucide-react"],
  },

  // Image Optimization for Agent UI
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
    ],
  },

  // Headers for Cross-Origin Security (CSP)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;





