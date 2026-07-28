import React, { useEffect, useRef, useState } from 'react';

/**
 * @interface LogEntry
 * @description Epistemic state transition record for agentic reasoning loops.
 */
interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'QUANTUM';
  message: string;
}

/**
 * @component EpistemicLog
 * @description High-fidelity diagnostic terminal for monitoring agentic epistemic debates.
 * Siphoned from DARLEK CANN v3.0 architecture.
 */
export const EpistemicLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulated ingestion stream - in production, this hooks into the Agent Orchestra event bus
    const initialLogs: LogEntry[] = [
      { id: '1', timestamp: Date.now(), level: 'INFO', message: 'Logic gate initialized.' },
      { id: '2', timestamp: Date.now(), level: 'QUANTUM', message: 'Querying multi-dimensional state...' }
    ];
    setLogs(initialLogs);

    const interval = setInterval(() => {
      setLogs((prev) => [
        ...prev.slice(-49),
        {
          id: Math.random().toString(36),
          timestamp: Date.now(),
          level: 'INFO',
          message: `Agent_0${Math.floor(Math.random() * 9)}: Processing epistemic node...`
        }
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col p-4 border border-slate-800 rounded bg-slate-950/80 h-full shadow-2xl font-mono">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Epistemic_Log_Stream</h2>
        <span className="text-[9px] text-emerald-500 animate-pulse">● LIVE</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 text-[11px] scrollbar-thin scrollbar-thumb-slate-800"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className={`opacity-70 ${log.level === 'QUANTUM' ? 'text-purple-400' : 'text-slate-600'}`}>
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </span>
            <span className={`font-medium ${log.level === 'CRITICAL' ? 'text-red-500' : 'text-slate-300'}`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};



