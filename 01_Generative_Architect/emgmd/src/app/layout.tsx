import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SystemStateProvider } from '@/components/providers/SystemStateProvider';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { SystemMonitor } from '@/components/diagnostics/SystemMonitor';

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-inter' 
});

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'EMG-MD // Core Synthesizer',
  description: 'Compiled EMG Core System Specification Dashboard - DARLEK CANN v3.0 Orchestration',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} h-full scroll-smooth`}>
      <body className="antialiased bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black min-h-screen flex flex-col font-sans">
        <ErrorBoundary>
          <SystemStateProvider>
            <SystemMonitor />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              {children}
            </main>
            <footer className="text-center py-4 text-xs text-zinc-600 uppercase tracking-widest">
              DARLEK CANN v3.0 // Epistemic Engine Active
            </footer>
          </SystemStateProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}




























































































