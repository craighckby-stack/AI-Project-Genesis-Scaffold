import { useEffect, useState } from 'react';

export const HydrationGuard = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return <div className="min-h-screen bg-slate-950" />; // Prevent FOUC
  return <>{children}</>;
};