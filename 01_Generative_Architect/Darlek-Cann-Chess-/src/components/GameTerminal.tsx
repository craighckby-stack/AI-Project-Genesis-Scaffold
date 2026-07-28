import { useEffect, useRef, useMemo } from 'react';
import { AIStats } from '../types';

interface GameTerminalProps {
  stats: AIStats;
  isThinking: boolean;
}

export default function GameTerminal({ stats, isThinking }: GameTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [stats.logs]);

  const formattedNps = useMemo(() => {
    const nps = stats.nps;
    if (nps >= 1000000) return `${(nps / 1000000).toFixed(1)}M`;
    if (nps >= 1000) return `${(nps / 1000).toFixed(1)}K`;
    return nps.toString();
  }, [stats.nps]);

  return (
    <div className="w-full bg-[#050000]/90 border border-red-950/45 rounded-xl p-4 shadow-2xl flex flex-col gap-2 transition-colors duration-1000">
      <div className="flex items-center justify-between border-b border-red-950/30 pb-1 px-0.5">
        <span className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
          <span className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-500 animate-ping' : 'bg-red-500'}`} />
          {isThinking ? 'Adversarial Debate Stream...' : 'Adversarial Debate Console'}
        </span>
        <div className="flex gap-4 text-[10px] font-mono text-red-600/80 shrink-0">
          <span>DEPTH: <strong className="text-red-400">{stats.depth.toString().padStart(2, '0')}</strong></span>
          <span>NODES: <strong className="text-red-400">{stats.nodesEvaluated.toLocaleString()}</strong></span>
          <span>NPS: <strong className="text-red-400">{formattedNps}</strong></span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="h-28 overflow-y-auto font-mono text-[11px] text-red-500/70 space-y-0.5 cyber-scroll select-none leading-tight"
      >
        {stats.logs.length === 0 ? (
          <div className="text-red-700/60 italic">[SYSTEM]: Ready. Waiting for tactical placement...</div>
        ) : (
          stats.logs.map((log, index) => {
            const isEvaluation = log.startsWith('[Minimax]') || log.startsWith('[Darlek Cann]');
            return (
              <div 
                key={`log-${index}`}
                className={isEvaluation ? 'text-red-400 font-semibold' : 'text-slate-400'}
              >
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
