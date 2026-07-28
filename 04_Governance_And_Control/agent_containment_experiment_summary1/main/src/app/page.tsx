/**
 * @file src/app/page.tsx
 * @description UnifiedOperatorWorkspace: The primary control plane for the DARLEK CANN ecosystem.
 * This component serves as the central hub for system telemetry, simulation orchestration, and 
 * blueprint management. It integrates with the global theme engine and provides a high-fidelity 
 * interface for monitoring agentic state transitions.
 * 
 * @architecture System-Architectural-Pattern: Unified State, Simulation Engine, Observability Layer.
 * @dependencies framer-motion, lucide-react, react
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, Zap, FileText, Database, Shield } from 'lucide-react';

interface MetricPoint {
  time: string;
  load: number;
  integrity: number;
  ops: number;
}

interface LogEntry {
  id: string;
  time: string;
  source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT';
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface SystemState {
  cpuLoad: number;
  quantumStability: number;
  opsRate: number;
  evolutionCycle: number;
  simLevel: number;
}

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [coreOnline, setCoreOnline] = useState(true);
  const [systemState, setSystemState] = useState<SystemState>({
    cpuLoad: 42,
    quantumStability: 94.2,
    opsRate: 122,
    evolutionCycle: 0,
    simLevel: 50
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'], source: LogEntry['source'] = 'SYSTEM') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-49), { id: crypto.randomUUID(), time, source, message, type }]);
  }, []);

  useEffect(() => {
    if (coreOnline) {
      intervalRef.current = setInterval(() => {
        setSystemState(prev => ({
          ...prev,
          cpuLoad: Math.floor(Math.random() * 20) + 40,
          quantumStability: parseFloat((94 + Math.random()).toFixed(1)),
          opsRate: Math.floor(Math.random() * 50) + 100,
          evolutionCycle: prev.evolutionCycle + 1
        }));
      }, 2000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coreOnline]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-cyan-500 font-bold tracking-widest">DARLEK CANN // SYSTEM_OPERATOR_WORKSPACE</span>
          <h1 className="text-lg font-bold flex items-center gap-2"><Cpu className="text-cyan-400 w-5 h-5" /> AGENT_CONTAINMENT_V3</h1>
        </div>
        <button 
          onClick={() => setCoreOnline(!coreOnline)} 
          className={`px-4 py-1.5 rounded-full font-mono text-[10px] border transition-all ${coreOnline ? 'border-cyan-900 bg-cyan-950 text-cyan-400' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
          {coreOnline ? '● SYSTEM_ACTIVE' : '○ SYSTEM_PAUSED'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex border-b border-slate-800">
            {(['dashboard', 'blueprint', 'data'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-slate-900/20 p-6 rounded-xl border border-slate-800">
              <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider text-slate-400">{activeTab.toUpperCase()} TELEMETRY</h2>
              <div className="h-64 w-full bg-slate-950/50 rounded-lg border border-slate-900 flex items-center justify-center">
                <p className="text-slate-600 font-mono text-xs">{coreOnline ? `STREAMING_DATA_CYCLE_${systemState.evolutionCycle}` : 'SYSTEM_IDLE'}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">System Logs</h3>
            <div className="space-y-2 h-64 overflow-y-auto font-mono text-[10px]">
              {logs.length === 0 && <p className="text-slate-700">Awaiting system initialization...</p>}
              {logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-cyan-800">[{log.time}]</span>
                  <span className={log.type === 'error' ? 'text-red-400' : 'text-slate-300'}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}