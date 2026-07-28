/**
 * @file src/app/layout.tsx
 * @description Primary System-Architectural Root for the DARLEK CANN ecosystem.
 * Orchestrates global providers, metadata, and viewport configurations.
 * Integrates with: src/app/globals.css (Theme Engine), Next.js 15+ App Router.
 * 
 * @role Orchestration Entry Point
 * @version 3.0.0
 */

'use client';

import React, { ErrorInfo } from 'react';
import './globals.css';

/**
 * ErrorBoundary: Captures runtime exceptions to prevent total system collapse.
 * Siphoned from Microsoft/Playwright diagnostic patterns.
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DARLEK CANN System Fault:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-red-500">System Critical Failure: Check Console.</div>;
    }
    return this.props.children;
  }
}

/**
 * Metadata configuration for SEO and PWA compliance.
 */
export const metadata = {
  title: 'DARLEK CANN | System Evolution Engine',
  description: 'Autonomous agentic framework for self-refactoring code evolution.',
};

/**
 * Viewport configuration for responsive cross-device consistency.
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500/30">
        <ErrorBoundary>
          <main className="relative flex flex-col min-h-screen">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}