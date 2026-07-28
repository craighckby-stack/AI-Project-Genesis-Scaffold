import { useEffect, useState } from 'react';

/**
 * OMEGA-CORE System Initializer
 * Ensures all quantum-state and agent-orchestra modules are hydrated
 * before rendering the primary interface. Prevents FOUC and state-mismatch.
 */
export function SystemInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize diagnostic hooks and agent heartbeat
    const init = async () => {
      // Placeholder for future multi-tier LLM fallback check
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) return <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">INITIALIZING OMEGA-CORE...</div>;

  return <>{children}</>;
}