import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TelemetryProvider } from '@/components/providers/telemetry-provider';
import { SystemStateProvider } from '@/components/providers/system-state-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import '@/styles/globals.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: {
    default: 'DARLEK CANN | Sovereign Kernel',
    template: '%s | DARLEK CANN',
  },
  description: 'Advanced AI agent orchestration and self-refactoring framework.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 text-foreground">
        <ErrorBoundary>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="dark" 
            enableSystem={false} 
            disableTransitionOnChange
          >
            <SystemStateProvider>
              <TelemetryProvider>
                <main className="relative flex min-h-screen flex-col">
                  {children}
                </main>
                <Analytics />
                <SpeedInsights />
              </TelemetryProvider>
            </SystemStateProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}





























