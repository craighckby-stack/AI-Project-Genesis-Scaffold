import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EPISTEMIC DEBATE ENGINE // DALEK CAAN',
  description: 'Multi-agent philosophical discourse mapping system.',
};

export default function RootLayout({
  children,
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}