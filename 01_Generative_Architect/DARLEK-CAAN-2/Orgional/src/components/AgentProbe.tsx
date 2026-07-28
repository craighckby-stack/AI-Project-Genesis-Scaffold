import React, { useState } from "react";
import { Agent, WorldState, Archetype } from "../engine/types";
import { X, Brain, Zap, Shield, HeartPulse, History, Globe, Crown, Sparkles, Users, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AgentProbeProps {
  agent: Agent | null;
  world: WorldState;
  agents?: Agent[];
  onClose: () => void;
  onTriggerAwarenessSpike?: (agentId: number) => void;
}

const StatBlock = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-2">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="uppercase tracking-wider">{label}</span>
    </div>
    <span className={`font-mono font-bold ${color}`}>{value}</span>
  </div>
);

const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[9px] text-slate-400 uppercase">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${value * 100}%` }} />
    </div>
  </div>
);

export const AgentProbe: React.FC<AgentProbeProps> = ({ agent, world, agents = [], onClose, onTriggerAwarenessSpike }) => {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!agent) return null;

  const handleExtractNarrative = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentData: { ...agent, epoch: world.epoch }, worldState: { complexity: Math.floor(world.complexity), integrity: world.integrity } }),
      });
      const data = await response.json();
      setNarrative(data.narrative);
    } catch { setNarrative("Transmission failed."); } finally { setLoading(false); }
  };

  const getArchetypeColor = (arch: Archetype) => {
    const colors: Record<string, string> = { [Archetype.MESSIAH]: "text-yellow-400", [Archetype.ANGEL]: "text-cyan-300", [Archetype.DEMON]: "text-red-500", [Archetype.PROPHET]: "text-purple-400", [Archetype.ZEALOT]: "text-fuchsia-400", [Archetype.HERETIC]: "text-red-700", [Archetype.GLITCH]: "text-emerald-400" };
    return colors[arch] || "text-indigo-400";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col sm:flex-row">
          <div className="w-full sm:w-72 bg-slate-950/50 border-r border-slate-800 p-6 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold text-white">{agent.name}</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 space-y-4">
              <StatBlock label="Archetype" value={agent.archetype} icon={<Brain size={12} />} color={getArchetypeColor(agent.archetype)} />
              <StatBlock label="Order" value={agent.order.toFixed(2)} icon={<Shield size={12} />} color="text-emerald-400" />
              <StatBlock label="Awareness" value={`${(agent.awareness * 100).toFixed(0)}%`} icon={<Sparkles size={12} />} color="text-cyan-400" />
            </div>
            <button onClick={handleExtractNarrative} className="mt-6 w-full py-3 bg-indigo-600 rounded-xl text-xs font-bold uppercase">{loading ? "Decrypting..." : "Decrypt Narrative"}</button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto bg-slate-900/40">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4">Subjective Narrative</h3>
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl min-h-[160px]">
              {narrative ? <p className="text-sm text-slate-200 italic">{narrative}</p> : <p className="text-slate-600 text-xs">Waiting for decryption...</p>}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};