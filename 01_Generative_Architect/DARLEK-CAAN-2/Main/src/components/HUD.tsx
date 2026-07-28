import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

/**
 * @file HUD.tsx
 * @description OMEGA-CORE Diagnostic HUD v3.0
 * @architecture Reactive State-Sync with Quantum Heartbeat (500ms cycle).
 * @siphon_context SN: OMEGA / unitary-core / Vercel AI SDK patterns
 */

interface HUDProps {
  agentId: string;
  status: 'active' | 'idle' | 'critical';
  telemetryData?: Record<string, string | number>;
  latency?: number;
}

export const HUD: React.FC<HUDProps> = ({ agentId, status, telemetryData = {}, latency = 0 }) => {
  const [frame, setFrame] = useState<number>(0);
  const [pulse, setPulse] = useState<boolean>(false);
  const requestRef = useRef<number>();
  const lastUpdate = useRef<number>(0);

  const animate = useCallback((time: number) => {
    if (time - lastUpdate.current > 500) {
      setFrame((prev) => (prev + 1) % 9999);
      setPulse((p) => !p);
      lastUpdate.current = time;
    }
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const theme = useMemo(() => {
    const base = 'fixed top-4 right-4 p-5 bg-black/95 border backdrop-blur-md font-mono text-[11px] transition-all duration-500 z-50 w-72';
    const variants = {
      critical: 'text-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      idle: 'text-amber-400 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]',
      active: 'text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
    };
    return `${base} ${variants[status] || variants.active}`;
  }, [status]);

  const formattedTelemetry = useMemo(() => 
    Object.entries(telemetryData).map(([k, v]) => ({
      key: k.toUpperCase(),
      value: v
    })), 
  [telemetryData]);

  return (
    <div className={theme} role="status" aria-live="polite">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <span className="font-bold tracking-[0.2em]">OMEGA_TELEMETRY</span>
        <div className={`w-2 h-2 rounded-full ${pulse ? 'bg-current animate-pulse' : 'bg-transparent'}`} />
      </div>
      
      <div className="space-y-2.5">
        <div className="flex justify-between">
          <span className="opacity-50">AGENT_ID:</span>
          <span className="font-bold">{agentId}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">SYNC_FRAME:</span>
          <span>{frame.toString().padStart(4, '0')}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">LATENCY:</span>
          <span className={latency > 100 ? 'text-red-400' : ''}>{latency}ms</span>
        </div>
        
        {formattedTelemetry.map(({ key, value }) => (
          <div key={key} className="flex justify-between border-t border-white/5 pt-2">
            <span className="opacity-50">{key}:</span>
            <span className="text-white/80">{value}</span>
          </div>
        ))}
      </div>

      <footer className="mt-6 pt-2 border-t border-white/10 text-[9px] opacity-30 flex justify-between uppercase tracking-widest">
        <span>DARLEK_CANN_V3.0</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
};



