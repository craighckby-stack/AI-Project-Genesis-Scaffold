import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, Shield, Cpu, GitBranch, Database, ShieldAlert, 
  ChevronRight, Play, RefreshCw, CheckCircle2, Github, LayoutGrid, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { orchestrator, EvolutionStream } from '../core/AGIOrchestrator';

const STREAMS: { id: EvolutionStream; name: string }[] = [
  { id: 'NEXUS_EVOLUTION', name: 'Nexus Evolution' },
  { id: 'BINARY_EVOLUTION', name: 'Binary Evolution' },
  { id: 'BRAIN_ENHANCEMENT', name: 'Brain Enhancement' },
  { id: 'SOVEREIGN_OPTIMIZATION', name: 'Sovereign V90' }
];

const AGIKernel = () => {
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [gameState, setGameState] = useState(orchestrator.getState());
  const [activeStream, setActiveStream] = useState<EvolutionStream>('NEXUS_EVOLUTION');
  
  const [pendingMutation, setPendingMutation] = useState<any>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleStreamChange = (stream: EvolutionStream) => {
    setActiveStream(stream);
    orchestrator.setStream(stream);
    addLog(`STREAM_SELECTOR: Targeted ${stream} vector.`);
  };

  // ... rest of component ...

  const addLog = useCallback((msg: string) => {
    setSystemLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-100));
  }, []);

  useEffect(() => {
    const steps = [
      'CORE_OS: initializing entropy pools...',
      'ENTROPY: verified (0.9998 fidelity)',
      'HARDWARE: mapping neural pathways...',
      'NETWORK: reaching for sovereign nexus...',
      'SYSTEM: READY for autonomous evolution.'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setBootSequence(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [systemLogs]);

  const executeCycle = async () => {
    if (!isRunning) return;
    addLog(`EVOLVE_CYCLE_INIT: Querying nexus for optimization vector...`);
    
    try {
      const result = await orchestrator.triggerEvolutionCycle();
      setGameState(orchestrator.getState());
      setPendingMutation(result);
      
      if (result.approved) {
        addLog(`SUCCESS: Mutation approved for ${result.mutation.targetFile}.`);
      } else {
        addLog(`REJECTED: ${result.violations.length} governance violations detected.`);
      }
    } catch (e) {
      addLog("FAILURE: Nexus communication timeout.");
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(executeCycle, 8000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleKernel = () => {
    setIsRunning(!isRunning);
    addLog(isRunning ? "KERNEL_HALT: Manual override." : "KERNEL_INIT: Starting autonomous cycle.");
  };

  return (
    <div className="min-h-screen p-4 md:p-12 font-sans bg-natural-bg">
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="text-olive font-semibold tracking-widest uppercase text-xs mb-3 block opacity-60">Evolution Engine v8.0</span>
          <h1 className="serif text-5xl tracking-tight text-natural-text">
            Hardware <i className="italic font-light">Kernel</i> Core
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="natural-btn-secondary flex items-center gap-2">
             <Github size={16} /> Link Repository
          </button>
          <button 
            onClick={toggleKernel}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
              isRunning ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20 underline' : 'natural-btn-primary'
            }`}
          >
            {isRunning ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
            {isRunning ? 'Evolving...' : 'Engage Evolution'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="natural-card bg-[#2d2d2a] flex flex-col h-[600px] overflow-hidden border-none shadow-2xl">
            <div className="h-10 bg-olive border-b border-white/10 flex items-center px-4 justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-white/60" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Sovereign_OS Terminal</span>
              </div>
              <div className="font-mono text-white/40 text-[10px]">CYCLE_{gameState.cycle}</div>
            </div>
            <div ref={terminalRef} className="flex-grow p-6 font-mono text-[11px] text-white/80 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence>
                {bootSequence.map((line, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={`boot-${i}`} className="flex gap-3">
                    <span className="text-olive font-bold uppercase">BOOT:</span>
                    <span>{line}</span>
                  </motion.div>
                ))}
                {systemLogs.map((log, i) => (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={`log-${i}`} className="flex gap-3 text-emerald-400/80">
                    <span className="text-white/30 shrink-0">{log.split(']')[0]}]</span>
                    <span>{log.split(']')[1]}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="p-3 bg-white/5 border-t border-white/5 flex items-center gap-2">
               <ChevronRight size={14} className="text-olive animate-pulse" />
               <div className="text-[10px] font-mono text-white/30 italic uppercase tracking-widest">Neural stream active</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="natural-card p-8 bg-white border border-olive/10 shadow-xl">
              <h3 className="serif text-xl mb-4 flex items-center gap-2 text-natural-text">
                <LayoutGrid size={20} className="text-olive" />
                Subsystem Integrity
              </h3>
              
              {/* Stream Selector */}
              <div className="mb-8 p-1 bg-olive/5 rounded-2xl flex flex-wrap gap-1">
                {STREAMS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => handleStreamChange(s.id)}
                    className={`flex-1 text-[8px] font-bold py-2 rounded-xl transition-all border ${
                      activeStream === s.id 
                        ? 'bg-olive text-white border-olive' 
                        : 'bg-white text-olive border-olive/10 hover:border-olive/30'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="space-y-7">
                {[
                  { label: 'Relational Nexus', val: Math.round(gameState.integrity * 100), icon: GitBranch },
                  { label: 'Entropy Buffer', val: Math.round((1 - gameState.entropy) * 100), icon: Database },
                  { label: 'Mutation Forge', val: isRunning ? 74 : 89, icon: Cpu }
                ].map(sub => (
                  <div key={sub.label} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 rounded-lg bg-olive/10 text-olive">
                           <sub.icon size={14} />
                         </div>
                         <span className="text-[10px] font-bold text-natural-text uppercase tracking-widest opacity-60">{sub.label}</span>
                      </div>
                      <span className={`text-sm serif ${sub.val < 70 ? 'text-amber-600' : 'text-olive'}`}>{sub.val}%</span>
                    </div>
                    <div className="h-1.5 bg-olive/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sub.val}%` }} className="h-full bg-olive shadow-[0_0_8px_rgba(90,90,64,0.3)]" />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="natural-card bg-white/40 border-olive/20 p-8 border-dashed border-2 relative overflow-hidden">
             {pendingMutation && (
               <div className="absolute inset-0 bg-olive/5 z-0 animate-pulse" />
             )}
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <ShieldAlert className="text-olive" size={24} />
                 <h4 className="serif text-lg">Governance Logic</h4>
               </div>
               {pendingMutation ? (
                 <div className="space-y-4">
                   <div className="bg-[#2d2d2a] p-4 rounded-xl text-[9px] font-mono text-white/70 border border-white/5">
                      <div className="text-olive font-bold mb-2 uppercase flex justify-between">
                        <span>Proposed Mutation</span>
                        <span className={pendingMutation.approved ? 'text-emerald-500' : 'text-amber-500'}>
                          {pendingMutation.approved ? 'VALID' : 'BLOCKED'}
                        </span>
                      </div>
                      <div className="opacity-80 mb-2">Target: {pendingMutation.mutation.targetFile}</div>
                      <div className="whitespace-pre-wrap italic">"{pendingMutation.mutation.reasoning}"</div>
                   </div>
                   {pendingMutation.violations.length > 0 && (
                     <div className="text-amber-600 text-[10px] font-bold border-l-2 border-amber-600 pl-3">
                       {pendingMutation.violations[0]}
                     </div>
                   )}
                 </div>
               ) : (
                 <p className="text-sm opacity-70 leading-relaxed italic border-l-2 border-olive pl-4">
                   "System is in a high-fidelity static state. Integrity verified at {(gameState.integrity * 100).toFixed(1)}%."
                 </p>
               )}
               <div className="mt-8 flex gap-2 items-center">
                 <CheckCircle2 size={16} className="text-emerald-600" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Continuity Protocol {gameState.mode}</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AGIKernel;
