/**
 * @file src/app/layout.tsx
 * @description System-Architectural Root for the DARLEK CANN v3.0 ecosystem.
 * Acts as the primary entry point, providing global context, error boundaries,
 * and theme orchestration for the entire agentic application stack.
 * 
 * Integration: Connects to src/app/globals.css for CSS variable injection.
 * Siphoned Patterns: Vercel/SWR (Provider Context), Microsoft/Playwright (Error Resilience).
 */

import React, { ReactNode, ErrorInfo, createContext, useEffect } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * System Initialization Context for global state persistence.
 */
const SystemContext = createContext<{ version: string; status: string; bootTimestamp: number }>({
  version: '3.0.0',
  status: 'OPERATIONAL',
  bootTimestamp: Date.now(),
});

export const metadata: Metadata = {
  title: 'DARLEK CANN v3.0 | System-Architectural Root',
  description: 'High-performance agentic simulation and orchestration engine.',
  applicationName: 'DARLEK-CANN-ENGINE',
  authors: [{ name: 'DARLEK CANN' }],
  generator: 'Next.js 15',
  referrer: 'origin-when-cross-origin',
};

export const viewport: Viewport = {
  themeColor: '#020617',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * SystemErrorBoundary: Ensures the application maintains a stable state
 * even if a child component fails during agentic simulation cycles.
 */
class SystemErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DARLEK-CANN] System Resilience Layer Triggered:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-red-500 font-mono p-8">
          <h1 className="text-2xl font-bold tracking-tighter">SYSTEM_CRITICAL_FAILURE</h1>
          <p className="mt-4 opacity-70">RECOVERY_PROTOCOL_INITIATED: REFRESH_REQUIRED</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-3 border border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95"
          >
            REBOOT_SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * RootLayout: Orchestrates the application shell.
 * Implements viewport meta-constraints and global provider wrapping.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log('[DARLEK-CANN] System Initialization Complete. Status: OPERATIONAL');
  }, []);

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased selection:bg-indigo-500/30">
        <SystemContext.Provider value={{ version: '3.0.0', status: 'OPERATIONAL', bootTimestamp: Date.now() }}>
          <SystemErrorBoundary>
            <main className="relative flex flex-col min-h-screen">
              {children}
            </main>
          </SystemErrorBoundary>
        </SystemContext.Provider>
      </body>
    </html>
  );
}