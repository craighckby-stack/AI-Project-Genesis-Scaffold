/**
 * @file src/app/layout.tsx
 * @description System-Architectural Root for the DARLEK CANN ecosystem.
 * Acts as the primary orchestration entry point, providing global context,
 * error boundary containment, and SEO-compliant metadata for the application.
 * 
 * Integration: Connects to 'globals.css' for theme variables and 'ThemeProvider' 
 * for state persistence across the agentic UI.
 */

'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import './globals.css';

/**
 * SystemErrorBoundary: Ensures the application fails gracefully during 
 * agentic state transitions or rendering failures.
 */
class SystemErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DARLEK CANN System Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-red-500">System Critical Failure: Containment Breach.</div>;
    }
    return this.props.children;
  }
}

/**
 * RootLayout: The primary container for the DARLEK CANN application.
 * Implements fluid typography and theme-aware styling via CSS variables.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="DARLEK CANN: Supreme Code Evolution Controller" />
      </head>
      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen font-sans transition-colors duration-300">
        <SystemErrorBoundary>
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
        </SystemErrorBoundary>
      </body>
    </html>
  );
}