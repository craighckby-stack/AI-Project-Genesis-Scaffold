/**
 * @file src/app/page.tsx
 * @description System-Orchestration-Dashboard: The primary visual interface for the DARLEK-CANN stack.
 * This component acts as the entry point for system telemetry, iteration monitoring, and state evolution.
 * 
 * @architecture
 * - State Management: Atomic reducer-based state machine with strict type-safety.
 * - Animation Engine: Framer Motion for high-fidelity UI state synchronization.
 * - Design System: Tailwind CSS (Fluent/Vercel hybrid token architecture).
 * 
 * @integration
 * - Connects to: src/app/layout.tsx (Root Orchestration)
 * - Dependencies: motion, lucide-react
 */

"use client";

import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Plus, Activity, ShieldCheck, Database, Terminal } from 'lucide-react';

interface SystemState {
  iteration: number;
  status: 'ACTIVE' | 'EVOLVING' | 'STABLE' | 'SYNCING';
  lastSync: number;
  health: number;
  integrity: 'OPTIMAL' | 'DEGRADED';
}

type Action = 
  | { type: 'MUTATE' } 
  | { type: 'STABILIZE' } 
  | { type: 'SYNC_HEARTBEAT' };

const initialState: SystemState = {
  iteration: 0,
  status: 'ACTIVE',
  lastSync: Date.now(),
  health: 100,
  integrity: 'OPTIMAL',
};

function systemReducer(state: SystemState, action: Action): SystemState {
  switch (action.type) {
    case 'MUTATE':
      return {
        ...state,
        iteration: state.iteration + 1,
        status: 'EVOLVING',
        health: Math.min(100, state.health + 2),
      };
    case 'STABILIZE':
      return {
        ...state,
        status: 'STABLE',
        lastSync: Date.now(),
        integrity: state.health > 50 ? 'OPTIMAL' : 'DEGRADED',
      };
    case 'SYNC_HEARTBEAT':
      return {
        ...state,
        lastSync: Date.now(),
      };
    default:
      return state;
  }
}

export default function SystemDashboard() {
  const [state, dispatch] = useReducer(systemReducer, initialState);

  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'SYNC_HEARTBEAT' }), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleIteration = useCallback(() => {
    dispatch({ type: 'MUTATE' });
    const timer = setTimeout(() => dispatch({ type: 'STABILIZE' }), 800);
    return () => clearTimeout(timer);
  }, []);

  const formattedTime = useMemo(() => 
    new Date(state.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
  [state.lastSync]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-cyan-500/30 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]"
      >
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <Zap className="text-cyan-400" size={18} />
            <h1 className="text-xs font-mono text-cyan-400 uppercase tracking-[0.2em]">System Pulse</h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${state.status === 'EVOLVING' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-mono text-slate-300">{state.status}</span>
          </div>
        </header>

        <div className="text-center mb-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={state.iteration}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-8xl font-black text-white tracking-tighter tabular-nums"
            >
              {state.iteration}
            </motion.div>
          </AnimatePresence>
          <p className="text-slate-500 mt-4 text-[10px] uppercase tracking-[0.3em]">Evolutionary Iteration</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleIteration}
            className="col-span-2 flex items-center justify-center gap-3 py-4 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] transition-all rounded-2xl font-bold text-slate-950 shadow-lg shadow-cyan-900/20"
          >
            <Plus size={20} />
            EXECUTE MUTATION
          </button>
          
          <div className="flex flex-col gap-1 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity size={14} />
              <span className="text-[9px] font-mono uppercase">Health</span>
            </div>
            <span className="text-sm font-bold text-white">{state.health}%</span>
          </div>
          
          <div className="flex flex-col gap-1 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-mono uppercase">Integrity</span>
            </div>
            <span className={`text-sm font-bold ${state.integrity === 'OPTIMAL' ? 'text-emerald-400' : 'text-red-400'}`}>{state.integrity}</span>
          </div>
        </div>

        <footer className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-2 text-slate-600">
             <Database size={12} />
             <span className="text-[9px] font-mono">DARLEK-CANN-V3.0</span>
           </div>
           <div className="flex items-center gap-2 text-slate-600">
             <Terminal size={12} />
             <span className="text-[9px] font-mono">{formattedTime}</span>
           </div>
        </footer>
      </motion.div>
    </main>
  );
}













