import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'N-Body Gravitational Simulator | Dalek Caan System',
  description: 'Interactive real-time cosmic gravity simulator with live energy metrics.',
};

export default function RootLayout({
  children,
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}