/**
 * @file src/app/layout.tsx
 * @description System-Orchestration-Root-Layout for the craighckby-stack.
 * Acts as the primary entry point for the DARLEK-CANN evolution engine.
 * Integrates global design tokens, font-orchestration, and state-provider wrappers.
 * 
 * @architecture Next.js 14+ App Router | Tailwind CSS | Geist UI
 * @status PRODUCTION_READY
 * @siphon_source Vercel/Geist | Microsoft/Fluent-UI
 */

import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ErrorBoundary } from 'react-error-boundary';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'DARLEK-CANN | System Evolution Engine',
    template: '%s | DARLEK-CANN',
  },
  description: 'Autonomous code evolution and architectural orchestration framework.',
  manifest: '/manifest.json',
  authors: [{ name: 'DARLEK-CANN', url: 'https://github.com/craighckby-stack' }],
  creator: 'DARLEK-CANN',
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
  },
};

/**
 * Fallback component for system-level errors.
 * Enforces the DARLEK-CANN aesthetic during failure states.
 */
const ErrorFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-red-500 font-mono">
    <div className="p-8 border border-red-900/50 bg-red-950/10 backdrop-blur-sm">
      [SYSTEM_CRITICAL_FAILURE]: REBOOT_REQUIRED
    </div>
  </div>
);

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {/* System Integrity Background Layer */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10" aria-hidden="true" />
          
          <main className="relative flex flex-col w-full min-h-screen overflow-x-hidden">
            <div className="flex-grow w-full">
              {children}
            </div>
            
            <footer className="w-full py-6 text-center text-[10px] uppercase tracking-widest text-slate-700 border-t border-slate-900/50">
              <span className="opacity-50">DARLEK-CANN v3.0 |</span>
              <span className="ml-2 font-mono">SYSTEM-ORCHESTRATION-ACTIVE</span>
            </footer>
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}






























