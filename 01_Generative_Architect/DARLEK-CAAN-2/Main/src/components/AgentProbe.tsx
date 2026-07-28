import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Agent, WorldState, Archetype } from "../engine/types";
import { X, Brain, Shield, Sparkles, Loader2, AlertTriangle, Activity, Database, Zap, Cpu, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * @interface AgentProbeProps
 * @description Orchestrates the diagnostic visualization of autonomous agents within the simulation.
 * Siphoned from: Microsoft/Semantic-Kernel & Vercel/SWR patterns.
 */
interface AgentProbeProps {
  agent: Agent | null;
  world: WorldState;
  onClose: () => void;
}

const ARCHETYPE_COLORS: Record<Archetype, string> = {
  [Archetype.MESSIAH]: "text-yellow-400",
  [Archetype.ANGEL]: "text-cyan-300",
  [Archetype.DEMON]: "text-red-500",
  [Archetype.PROPHET]: "text-purple-400",
  [Archetype.ZEALOT]: "text-fuchsia-400",
  [Archetype.HERETIC]: "text-red-700",
  [Archetype.GLITCH]: "text-emerald-400"
};

const StatBlock = React.memo(({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <div className="flex items-center justify-between text-[10px] border-b border-slate-800 py-3">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="uppercase tracking-widest">{label}</span>
    </div>
    <span className={`font-mono font-bold ${color}`}>{value}</span>
  </div>
));
StatBlock.displayName = 'StatBlock';

export const AgentProbe: React.FC<AgentProbeProps> = ({ agent, world, onClose }) => {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup logic: Ensures no dangling promises or memory leaks on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleExtractNarrative = useCallback(async () => {
    if (!agent) return;
    
    // Reset state and abort previous pending requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, epoch: world.epoch }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) throw new Error("Signal degradation detected");
      const data = await response.json();
      setNarrative(data.narrative);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError("Neural link interrupted: " + (err.message || "Unknown Error"));
      }
    } finally {
      setLoading(false);
    }
  }, [agent, world.epoch]);

  const archetypeColor = useMemo(() => 
    agent ? (ARCHETYPE_COLORS[agent.archetype] || "text-indigo-400") : "text-indigo-400", 
  [agent]);

  if (!agent) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="w-full max-w-5xl h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex shadow-2xl"
        >
          <aside className="w-80 bg-slate-950 p-8 flex flex-col border-r border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[10px] font-bold tracking-widest text-indigo-500">PROBE_CORE_V3.0</h2>
              <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><X size={14} /></button>
            </div>
            
            <div className="space-y-1 flex-1">
              <StatBlock label="Identity" value={agent.name} icon={<Cpu size={12} />} color="text-white" />
              <StatBlock label="Archetype" value={agent.archetype} icon={<Brain size={12} />} color={archetypeColor} />
              <StatBlock label="Coherence" value={`${(agent.order * 100).toFixed(1)}%`} icon={<Shield size={12} />} color="text-emerald-400" />
              <StatBlock label="Entropy" value={`${((1 - agent.order) * 100).toFixed(0)}%`} icon={<Zap size={12} />} color="text-amber-500" />
            </div>

            <button 
              onClick={handleExtractNarrative} 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />} 
              {loading ? "Syncing..." : "Initialize Stream"}
            </button>
          </aside>

          <main className="flex-1 p-12 overflow-y-auto bg-slate-900">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={16} className="text-indigo-500" />
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subjective Narrative Stream</h3>
            </div>
            
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl min-h-[300px] flex items-center justify-center relative">
              {error ? (
                <div className="text-red-400 flex flex-col items-center gap-2">
                  <AlertTriangle size={32} />
                  <p className="text-xs font-mono">{error}</p>
                </div>
              ) : narrative ? (
                <p className="text-slate-300 leading-relaxed font-mono text-sm">{narrative}</p>
              ) : (
                <p className="text-slate-700 text-xs uppercase tracking-widest">Awaiting handshake...</p>
              )}
            </div>
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};



