import { useEffect, useRef } from 'react';
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
  }, [stats.logs, isThinking]);

  return (
    <div id="terminal-panel" className="w-full bg-[#050000]/90 border border-red-950/45 rounded-xl p-4 shadow-2xl flex flex-col gap-2 transition-colors duration-1000">
      <div id="terminal-header" className="flex items-center justify-between border-b border-red-950/30 pb-1 px-0.5 transition-colors duration-1000">
        <span className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
          <span 
            id="term-status-dot" 
            className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-500 animate-ping' : 'bg-red-500'}`}
          />
          <span id="term-title">
            {isThinking ? 'Adversarial Debate Stream...' : 'Adversarial Debate Console'}
          </span>
        </span>
        <div className="flex gap-4 text-[10px] font-mono text-red-600/80 shrink-0">
          <span>DEPTH: <strong id="term-depth" className="text-red-400">{stats.depth.toString().padStart(2, '0')}</strong></span>
          <span>NODES: <strong id="term-nodes" className="text-red-400">{stats.nodesEvaluated.toLocaleString()}</strong></span>
          <span>NPS: <strong id="term-nps" className="text-red-400">{stats.nps >= 1000000 ? `${(stats.nps / 1000000).toFixed(1)}M` : stats.nps >= 1000 ? `${(stats.nps / 1000).toFixed(1)}K` : stats.nps}</strong></span>
        </div>
      </div>
      
      {/* Log Feed Container */}
      <div 
        ref={containerRef}
        id="terminal-feed" 
        className="h-28 overflow-y-auto font-mono text-[11px] text-red-500/70 space-y-0.5 cyber-scroll select-none leading-tight"
        aria-hidden="true"
      >
        {stats.logs.length === 0 ? (
          <div className="text-red-700/60 italic">[SYSTEM]: Ready. Waiting for tactical placement...</div>
        ) : (
          stats.logs.map((log, index) => {
            const isEvaluation = log.startsWith('[Minimax]') || log.startsWith('[Darlek Cann]');
            return (
              <div 
                key={index} 
                className={`${isEvaluation ? 'text-red-400 font-semibold' : 'text-slate-400'}`}
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





