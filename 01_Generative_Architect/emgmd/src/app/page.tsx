"use client";

import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { Activity, Cpu, Sliders, Terminal, Play, Square, Layers, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: string;
  timestamp: string;
  input: string;
  status: 'SUCCESS' | 'ABORTED';
  output: string;
  entropy: number;
}

interface SystemState {
  entropy: number;
  recursiveDepth: number;
  isAutoSimulating: boolean;
  logs: LogEntry[];
}

type Action = 
  | { type: 'ADD_LOG'; payload: LogEntry }
  | { type: 'TOGGLE_SIM' }
  | { type: 'UPDATE_ENTROPY'; payload: number };

const systemReducer = (state: SystemState, action: Action): SystemState => {
  switch (action.type) {
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs].slice(0, 50) };
    case 'TOGGLE_SIM':
      return { ...state, isAutoSimulating: !state.isAutoSimulating };
    case 'UPDATE_ENTROPY':
      return { ...state, entropy: action.payload };
    default:
      return state;
  }
};

export default function EMGCoreDashboard() {
  const [state, dispatch] = useReducer(systemReducer, {
    entropy: 0.15,
    recursiveDepth: 29,
    isAutoSimulating: false,
    logs: []
  });

  const calculateHash = useCallback((str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + ((hash ^ state.recursiveDepth) >>> 0).toString(16).toUpperCase();
  }, [state.recursiveDepth]);

  const handleSynthesize = useCallback((signal: string) => {
    const delta = Math.abs(signal.length * 0.001);
    const isAborted = delta > 0.05;
    
    dispatch({
      type: 'ADD_LOG',
      payload: {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        input: signal,
        status: isAborted ? 'ABORTED' : 'SUCCESS',
        output: isAborted ? 'NULL_ERR_0x404' : calculateHash(signal),
        entropy: state.entropy
      }
    });
  }, [state.entropy, calculateHash]);

  useEffect(() => {
    if (!state.isAutoSimulating) return;
    const interval = setInterval(() => {
      const presets = ["SIG_ALPHA", "PULSE_WAVE", "SYS_PING", "EMG_NODE_77", "RPC_TEST"];
      handleSynthesize(presets[Math.floor(Math.random() * presets.length)]);
    }, 1200);
    return () => clearInterval(interval);
  }, [state.isAutoSimulating, handleSynthesize]);

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 p-8 font-mono selection:bg-emerald-900">
      <header className="flex justify-between items-end border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-500 tracking-tighter">EMG_CORE_V3.0</h1>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Dalek Caan Evolution Engine // Quantum State Active</p>
        </div>
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_SIM' })}
          className={`px-6 py-2 rounded-sm border transition-all ${state.isAutoSimulating ? 'border-amber-500 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'}`}>
          {state.isAutoSimulating ? <Square className="inline mr-2 w-4 h-4" /> : <Play className="inline mr-2 w-4 h-4" />}
          {state.isAutoSimulating ? 'TERMINATE_STREAM' : 'INITIATE_CORE'}
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-6">
          <div className="bg-[#0b1120] p-6 rounded border border-slate-800">
            <h2 className="text-xs mb-4 flex items-center text-slate-400"><Sliders className="mr-2 w-4 h-4" /> ENTROPY_CONTROL</h2>
            <input type="range" min="0" max="1" step="0.01" value={state.entropy} onChange={(e) => dispatch({ type: 'UPDATE_ENTROPY', payload: parseFloat(e.target.value) })} className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] mt-2 text-slate-500"><span>0.00</span><span>{state.entropy.toFixed(2)}</span><span>1.00</span></div>
          </div>
          <div className="bg-[#0b1120] p-6 rounded border border-slate-800 text-[10px] space-y-2">
            <p className="text-emerald-500">[STATUS] SYSTEM_STABLE</p>
            <p>DEPTH: {state.recursiveDepth}</p>
            <p>NODES: 1024</p>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <div className="bg-[#0b1120] p-6 rounded border border-slate-800 h-[600px] flex flex-col">
            <h2 className="text-xs mb-4 flex items-center text-slate-400"><Terminal className="mr-2 w-4 h-4" /> EXECUTION_STREAM</h2>
            <div className="overflow-y-auto flex-1 space-y-1 pr-2">
              <AnimatePresence initial={false}>
                {state.logs.map(log => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] grid grid-cols-[100px,1fr,100px] gap-4 border-b border-slate-900 py-1">
                    <span className="text-slate-600">{log.timestamp}</span>
                    <span className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-500'}>{log.status} :: {log.input}</span>
                    <span className="text-right font-bold">{log.output}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}




























































































