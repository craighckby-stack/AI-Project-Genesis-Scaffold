/**
 * @file src/app/layout.tsx
 * @description Root layout orchestration for the DARLEK CANN ecosystem.
 * Acts as the primary entry point for global state, theme providers, and SEO metadata.
 * Integrates with Vercel/Next.js architectural standards and Google Material Design accessibility patterns.
 * 
 * @role System-Architectural Root
 * @context Connects to src/app/globals.css for theme variables and src/app/page.tsx for core logic.
 */

import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DARLEK CANN | System Evolution Engine',
  description: 'Supreme code evolution controller and agentic orchestration framework.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617', // slate-950
};

/**
 * RootLayout component providing the foundational DOM structure.
 * Implements strict type safety and accessibility standards.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500/30">
        <main id="root-container" className="flex flex-col min-h-screen">
          {/* Global Provider Injection Point */}
          <div className="flex-grow">
            {children}
          </div>
          
          {/* System Footer/Diagnostics Overlay */}
          <footer className="p-4 text-xs text-slate-600 border-t border-slate-900 text-center">
            DARLEK CANN v3.0 | SYSTEM EVOLUTION CONTROLLER
          </footer>
        </main>
      </body>
    </html>
  );
}