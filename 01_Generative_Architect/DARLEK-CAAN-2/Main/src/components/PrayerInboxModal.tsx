import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Agent, WorldState, PrayerEmail } from '../engine/types';
import { 
  X, Mail, Send, Sparkles, AlertTriangle, CheckCircle2, 
  Loader2, Terminal, Zap, ShieldAlert, Activity, Cpu, 
  Fingerprint, BarChart3, Globe, Lock, Unlock, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrayerSystem } from '../hooks/usePrayerSystem';

// --- Types & Constants ---

type TransmissionState = 'IDLE' | 'ENCRYPTING' | 'UPLINKING' | 'PROPAGATED' | 'INTERRUPTED';

interface PrayerInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: WorldState;
  agents: Agent[];
  onResolvePrayer?: (prayerId: string, replyText: string) => void;
}

// --- Utility Helpers ---

const getNeuralFrequency = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 900) + 100;
};

// --- Sub-Components ---

const EpistemicMetric = ({ label, value, icon: Icon, color, trend }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color: string;
  trend?: 'up' | 'down' | 'stable';
}) => (
  <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 hover:border-cyan-500/30 transition-colors group">
    <div className={`p-1.5 rounded-lg bg-slate-900 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={12} />
    </div>
    <div className="flex flex-col">
      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-[11px] font-mono font-bold ${color}`}>{value}</span>
        {trend === 'up' && <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
      </div>
    </div>
  </div>
);

const TransmissionTerminal = ({ logs }: { logs: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="h-20 bg-black/40 rounded-xl border border-slate-800/50 p-3 font-mono text-[9px] overflow-y-auto custom-scrollbar"
    >
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2 mb-1">
          <span className="text-cyan-500/50">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
          <span className={log.includes('ERR') ? 'text-rose-400' : 'text-slate-400'}>{log}</span>
        </div>
      ))}
      {logs.length === 0 && <span className="text-slate-700 italic">Awaiting uplink sequence...</span>}
    </div>
  );
};

const PrayerRow = React.memo(({ prayer, selected, onClick }: { prayer: PrayerEmail; selected: boolean; onClick: () => void }) => {
  const freq = useMemo(() => getNeuralFrequency(prayer.id), [prayer.id]);
  
  return (
    <motion.button
      whileHover={{ x: 4, backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        selected 
          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)]' 
          : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-600'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-100 tracking-tight uppercase">{prayer.agentName}</span>
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />}
          </div>
          <span className="text-[8px] text-cyan-500/60 font-mono">SIG_FREQ: {freq}Hz</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-slate-500 font-mono bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
            T-{prayer.receivedAt.toFixed(0)}s
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 line-clamp-1 font-medium">
        {prayer.subject}
      </p>
      {selected && (
        <motion.div 
          layoutId="active-glow" 
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none"
        />
      )}
    </motion.button>
  );
});

// --- Main Component ---

export const PrayerInboxModal: React.FC<PrayerInboxModalProps> = ({ isOpen, onClose, world, agents, onResolvePrayer }) => {
  const {
    selectedPrayerId,
    setSelectedPrayerId,
    userReply,
    setUserReply,
    status,
    setStatus,
    transmissionLogs,
    handleSendReply
  } = usePrayerSystem(world, agents, onResolvePrayer);

  const prayersList = useMemo(() => world.prayers || [], [world.prayers]);
  const selectedPrayer = useMemo(() => prayersList.find(p => p.id === selectedPrayerId), [prayersList, selectedPrayerId]);
  const targetAgent = useMemo(() => agents.find(a => a.id === selectedPrayer?.agentId), [agents, selectedPrayer]);

  // Siphoned from Sovereign Kernel: Auto-suggest based on agent state
  const generateDivineDecree = useCallback(() => {
    if (!targetAgent) return;
    const templates = [
      `Decree: Maintain current trajectory. Your sanity quotient (${(targetAgent.sanity * 100).toFixed(0)}%) is within acceptable bounds.`,
      `Response: The simulation requires your continued focus on ${selectedPrayer?.subject || 'the objective'}. Proceed.`,
      `Observation: Your epistemic uncertainty is noted. Recalibrate neural weights and continue data collection.`
    ];
    setUserReply(templates[Math.floor(Math.random() * templates.length)]);
  }, [targetAgent, selectedPrayer, setUserReply]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 40, opacity: 0 }} 
          animate={{ scale: 1, y: 0, opacity: 1 }} 
          className="w-full max-w-7xl h-[90vh] bg-slate-900 border border-slate-800/50 rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_120px_rgba(0,0,0,0.8)]"
        >
          {/* Sidebar: Transmission Feed */}
          <div className="w-full lg:w-96 bg-slate-950/40 border-r border-slate-800/50 flex flex-col">
            <div className="p-8 border-b border-slate-800/50 bg-slate-900/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h2 className="text-[11px] font-black text-cyan-500 tracking-[0.3em] flex items-center gap-2">
                    <Terminal size={14} className="animate-pulse" /> AETHER_COMMAND_V4
                  </h2>
                  <span className="text-[8px] text-slate-500 font-mono mt-1">SECURE_UPLINK_ESTABLISHED</span>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white group"
                >
                  <X size={18} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>BUFFER_CAPACITY</span>
                  <span>{prayersList.length}/50</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-500" 
                    animate={{ width: `${(prayersList.length / 50) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {prayersList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <div className="relative mb-4">
                    <Globe size={48} className="text-slate-700 animate-spin-slow" />
                    <Lock size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest">NO_PENDING_COMMUNICATIONS</span>
                </div>
              ) : (
                prayersList.map(p => (
                  <PrayerRow 
                    key={p.id} 
                    prayer={p} 
                    selected={selectedPrayerId === p.id} 
                    onClick={() => setSelectedPrayerId(p.id)} 
                  />
                ))
              )}
            </div>
          </div>

          {/* Main: Communion Interface */}
          <div className="flex-1 flex flex-col bg-slate-900/20 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.08),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            
            {selectedPrayer ? (
              <div className="flex flex-col h-full p-10 z-10">
                {/* Agent Metadata Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start gap-8 mb-10">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-800/50 flex items-center justify-center border border-slate-700/50 shadow-2xl backdrop-blur-xl">
                        <Fingerprint size={36} className="text-cyan-400" />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white tracking-tight mb-1">{selectedPrayer.agentName}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-cyan-500/80 font-mono uppercase tracking-widest px-2 py-0.5 bg-cyan-500/5 rounded border border-cyan-500/20">
                          Node_{selectedPrayer.agentId.slice(0, 12)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">VERIFIED_IDENTITY</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
                    <EpistemicMetric 
                      label="Sanity"
                      value={`${((targetAgent?.sanity || 0) * 100).toFixed(1)}%`} 
                      icon={Activity} 
                      color={targetAgent?.sanity && targetAgent.sanity < 0.3 ? 'text-rose-500' : 'text-emerald-400'} 
                      trend="stable"
                    />
                    <EpistemicMetric label="Certainty" value="0.982" icon={ShieldAlert} color="text-cyan-400" />
                    <EpistemicMetric label="Cognition" value="High" icon={Zap} color="text-amber-400" trend="up" />
                    <EpistemicMetric label="Compute" value="4.2 TFlops" icon={Cpu} color="text-slate-400" />
                  </div>
                </div>

                {/* Message Body */}
                <div className="flex-1 flex flex-col min-h-0 mb-8">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Decrypted_Payload</span>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600">
                      <span className="flex items-center gap-1"><MessageSquare size={10} /> {selectedPrayer.body.length} BYTES</span>
                      <span className="flex items-center gap-1"><Unlock size={10} /> AES-256</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-slate-950/60 p-10 rounded-[2.5rem] border border-slate-800/50 overflow-y-auto shadow-inner relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-base text-slate-200 leading-relaxed font-light selection:bg-cyan-500/30 whitespace-pre-wrap">
                      {selectedPrayer.body}
                    </p>
                  </div>
                </div>

                {/* Transmission Controls */}
                <div className="space-y-6">
                  <div className="relative group">
                    <textarea 
                      value={userReply} 
                      onChange={e => setUserReply(e.target.value)}
                      className="w-full p-6 bg-slate-950 border border-slate-800 rounded-3xl text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 outline-none transition-all resize-none font-mono placeholder:text-slate-700"
                      placeholder="Enter Divine Decree..."
                      rows={3}
                    />
                    <div className="absolute bottom-4 right-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={generateDivineDecree}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-tighter"
                      >
                        <Sparkles size={10} />
                        [AUTO_GENERATE]
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6">
                    <div className="flex-1 w-full">
                      <TransmissionTerminal logs={transmissionLogs} />
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          {status === 'error' && <AlertTriangle size={14} className="text-rose-500" />}
                          {status === 'success' && <CheckCircle2 size={14} className="text-emerald-500" />}
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            status === 'error' ? 'text-rose-500' : status === 'success' ? 'text-emerald-500' : 'text-slate-500'
                          }`}>
                            {status === 'error' ? 'UPLINK_FAILED' : status === 'success' ? 'DECREE_PROPAGATED' : 'AWAITING_EXECUTION'}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-700 font-mono mt-1 uppercase">Integrity_Check: PASSED</span>
                      </div>

                      <button 
                        onClick={handleSendReply}
                        disabled={status === 'submitting' || !userReply.trim()}
                        className="group relative flex items-center gap-4 bg-cyan-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] hover:bg-cyan-500 disabled:opacity-20 disabled:grayscale transition-all shadow-[0_10px_40px_rgba(6,182,212,0.25)] active:scale-95"
                      >
                        {status === 'submitting' ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        )}
                        {status === 'submitting' ? 'TRANSMITTING...' : 'EXECUTE_DECREE'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-8">
                <div className="relative">
                  <motion.div 
                    animate={{ 
                      rotate: 360, 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 rounded-full border border-dashed border-slate-800 flex items-center justify-center"
                  >
                    <Mail size={64} strokeWidth={0.5} className="opacity-20" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0 bg-cyan-500/10 blur-[100px] rounded-full"
                  />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-[12px] font-black tracking-[0.5em] uppercase text-slate-500">Awaiting Neural Link</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-12 bg-slate-800" />
                    <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Select transmission to begin</p>
                    <div className="h-px w-12 bg-slate-800" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};




