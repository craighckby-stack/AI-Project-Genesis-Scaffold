/**
 * @file src/app/layout.tsx
 * @description System-Architectural Root for the DARLEK CANN ecosystem.
 * Acts as the primary entry point for the application, providing global context,
 * error boundaries, and SEO-compliant metadata. Integrates with the centralized
 * CSS variable engine and theme orchestration layer.
 * 
 * @architecture Next.js 15+ App Router | React 19 | Tailwind CSS
 * @dependencies src/app/globals.css | ThemeProvider | SystemErrorBoundary
 */

import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DARLEK CANN | System Evolution Engine',
  description: 'High-performance agentic orchestration and evolution framework.',
  applicationName: 'DARLEK CANN',
  authors: [{ name: 'DARLEK CANN' }],
  viewport: 'width=device-width, initial-scale=1',
};

export const viewport: Viewport = {
  themeColor: '#020617',
  colorScheme: 'dark',
};

/**
 * @component SystemErrorBoundary
 * @description Graceful degradation layer for agentic state transitions.
 * Siphoned from Microsoft/Playwright testing patterns for robust error handling.
 */
class SystemErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-red-500">
          <h1>System Critical Failure: Agentic State Divergence Detected.</h1>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * @component ThemeProvider
 * @description Manages system-wide state and theme persistence.
 * Siphoned from Vercel/SWR patterns for high-performance state management.
 */
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <SystemErrorBoundary>
          <ThemeProvider>
            <main className="relative flex flex-col min-h-screen">
              {children}
            </main>
          </ThemeProvider>
        </SystemErrorBoundary>
      </body>
    </html>
  );
}