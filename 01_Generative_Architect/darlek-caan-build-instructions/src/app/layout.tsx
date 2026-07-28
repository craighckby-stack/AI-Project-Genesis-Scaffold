import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DARLEK CAAN - Gödel Self-Validation',
  description: 'Autonomous constraint-gap exploitation simulator',
};

export default function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#030712] text-gray-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
















