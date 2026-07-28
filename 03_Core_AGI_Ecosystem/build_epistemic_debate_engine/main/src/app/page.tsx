'use client';

import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Database, Activity, Cpu, ShieldAlert, Zap, Terminal } from 'lucide-react';

type SystemStatus = 'IDLE' | 'PROCESSING' | 'SYNTHESIZING' | 'CRITICAL';
type Severity = 'INFO' | 'CRITICAL' | 'WARN';

interface LogEntry { id: string; timestamp: number; message: string; severity: Severity; }
interface Agent { id: string; load: number; status: 'ACTIVE' | 'IDLE'; }

interface State {
  logs: LogEntry[];
  status: SystemStatus;
  round: number;
  entropy: number;
  agents: Agent[];
}

const AGENT_IDS = ['SKEPTIC', 'RATIONALIST', 'EMPIRICIST', 'QUANTUM_OBSERVER', 'SYNTHESIS_ENGINE'];

const reducer = (state: State, action: any): State => {
  switch (action.type) {
    case 'EXECUTE':
      return { ...state, round: state.round + 1, status: 'PROCESSING', entropy: Math.random() };
    case 'STATUS':
      return { ...state, status: action.payload };
    case 'LOG':
      return { ...state, logs: [{ id: crypto.randomUUID(), timestamp: Date.now(), ...action.payload }, ...state.logs].slice(0, 50) };
    case 'TICK':
      return { ...state, agents: AGENT_IDS.map(id => ({ id, load: Math.random(), status: Math.random() > 0.3 ? 'ACTIVE' : 'IDLE' })) };
    case 'RESET':
      return { logs: [], status: 'IDLE', round: 0, entropy: 0, agents: AGENT_IDS.map(id => ({ id, load: 0, status: 'IDLE' })) };
    default: return state;
  }
};

export default function OmegaCoreEngine() {
  const [state, dispatch] = useReducer(reducer, { logs: [], status: 'IDLE', round: 0, entropy: 0, agents: AGENT_IDS.map(id => ({ id, load: 0, status: 'IDLE' })) });
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK' }), 3000);
    return () => {
      clearInterval(interval);
      timerRef.current.forEach(clearTimeout);
    };
  }, []);

  const run = useCallback(() => {
    dispatch({ type: 'EXECUTE' });
    dispatch({ type: 'LOG', payload: { message: 'Quantum handshake initiated...', severity: 'INFO' } });
    
    const t1 = setTimeout(() => {
      dispatch({ type: 'STATUS', payload: 'SYNTHESIZING' });
      dispatch({ type: 'LOG', payload: { message: 'Consensus matrix converging.', severity: 'INFO' } });
      const t2 = setTimeout(() => dispatch({ type: 'STATUS', payload: 'IDLE' }), 1200);
      timerRef.current.push(t2);
    }, 800);
    timerRef.current.push(t1);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-emerald-500 p-8 font-mono selection:bg-emerald-900/30">
      <header className="flex justify-between items-end mb-12 border-b border-emerald-900/50 pb-6">
        <div>
          <h1 className="text-3xl font-black text-emerald-400 flex items-center gap-3 tracking-tighter">
            <Terminal className="text-emerald-600" /> OMEGA_CORE_V4.0
          </h1>
          <div className="flex gap-6 text-[10px] mt-4 opacity-60 uppercase tracking-[0.2em]">
            <span>Status: {state.status}</span>
            <span>Cycle: {state.round}</span>
            <span>Entropy: {state.entropy.toFixed(6)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={run} className="bg-emerald-950/50 border border-emerald-700 px-8 py-2 rounded text-[10px] hover:bg-emerald-900 transition-all flex items-center gap-2">
            <Play size={12} /> EXECUTE_SEQUENCE
          </button>
          <button onClick={() => dispatch({ type: 'RESET' })} className="border border-emerald-900 px-4 py-2 rounded hover:border-emerald-500 transition-all">
            <RotateCcw size={12} />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 border border-emerald-900/30 p-6 rounded bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-bold flex items-center gap-2 text-emerald-700 uppercase tracking-widest">
              <Activity size={12} /> Telemetry_Stream
            </h2>
            <Zap size={12} className="text-emerald-800 animate-pulse" />
          </div>
          <div className="h-[400px] overflow-y-auto space-y-2 pr-2">
            <AnimatePresence initial={false}>
              {state.logs.map((l) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 bg-emerald-950/20 border-l-2 border-emerald-800 text-[11px] flex gap-4">
                  <span className="opacity-40 font-mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span className={l.severity === 'CRITICAL' ? 'text-red-400' : 'text-emerald-300'}>{l.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-8">
          <div className="p-6 border border-emerald-900/30 bg-black/20">
            <h3 className="text-[10px] font-bold mb-6 text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
              <Database size={12} /> Agent_Orchestra
            </h3>
            {state.agents.map((a) => (
              <div key={a.id} className="mb-4">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className={a.status === 'ACTIVE' ? 'text-emerald-300' : 'opacity-40'}>{a.id}</span>
                  <span className="opacity-50">{(a.load * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1 bg-emerald-950 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${a.load * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border border-emerald-900/30 bg-emerald-950/5">
            <h3 className="text-[10px] font-bold mb-3 text-emerald-700 flex items-center gap-2 uppercase tracking-widest">
              <ShieldAlert size={12} /> System_Integrity
            </h3>
            <p className="text-[10px] opacity-60 leading-relaxed">OMEGA_CORE_V4.0: Recursive synthesis active. All nodes synchronized. Entropy threshold: 0.882.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}





























