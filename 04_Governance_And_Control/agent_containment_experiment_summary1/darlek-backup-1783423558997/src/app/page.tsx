'use client';

/**
 * @file src/app/page.tsx
 * @description Unified Operator Workspace for the DARLEK CANN ecosystem.
 * Acts as the primary simulation dashboard, telemetry stream, and registry interface.
 * Integrates with the system-wide state management and provides real-time monitoring
 * for the Multi-Agent Objective-Divergence Containment experiment.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Shield, Cpu, Activity, Zap, FileText, Database, 
  RefreshCw, Plus, Trash2, AlertCircle 
} from 'lucide-react';

interface MetricPoint { time: string; load: number; integrity: number; ops: number; }
interface LogEntry { id: string; time: string; source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT'; message: string; type: 'info' | 'success' | 'warn' | 'error'; }
interface DataItem { id: string; name: string; category: string; status: 'ACTIVE' | 'IDLE' | 'STAGING'; timestamp: string; }

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [systemState, setSystemState] = useState({ coreOnline: true, cpuLoad: 42, quantumStability: 94.2, opsRate: 122, evolutionCycle: 0, simLevel: 50 });
  const [metricHistory, setMetricHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([
    { id: 'REC-101', name: 'Standard Cognitive Node', category: 'Cortex Matrix', status: 'ACTIVE', timestamp: '11:42:01' },
    { id: 'REC-102', name: 'Topological Narrative Ring', category: 'Quantum Field', status: 'IDLE', timestamp: '11:42:15' },
    { id: 'REC-103', name: 'Polymorphic Code Injector', category: 'Evolution Core', status: 'STAGING', timestamp: '11:43:02' },
  ]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', source: LogEntry['source'] = 'SYSTEM') => {
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(36), time: new Date().toLocaleTimeString(), source, message, type }]);
  }, []);

  useEffect(() => {
    if (!systemState.coreOnline) return;
    const interval = setInterval(() => {
      const loadFlux = Math.floor((systemState.simLevel * 0.7) + (Math.random() * 10 - 5));
      const stableFlux = parseFloat((100 - (systemState.simLevel * 0.15) + (Math.random() * 2 - 1)).toFixed(1));
      const opFlux = Math.floor((systemState.simLevel * 2) + Math.random() * 15);
      
      setSystemState(prev => ({ ...prev, cpuLoad: loadFlux, quantumStability: stableFlux, opsRate: opFlux }));
      setMetricHistory(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), load: loadFlux, integrity: stableFlux, ops: opFlux }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [systemState.coreOnline, systemState.simLevel]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-cyan-500 font-bold tracking-wider uppercase">DALEK CAAN // SIMULATOR LAYER</span>
          <h1 className="text-xl font-bold flex items-center gap-2"><Cpu className="text-cyan-400 h-5 w-5" /> experiment_summary_v1</h1>
        </div>
        <button onClick={() => setSystemState(p => ({ ...p, coreOnline: !p.coreOnline }))} className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono ${systemState.coreOnline ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
          {systemState.coreOnline ? '■ ONLINE' : '○ PAUSED'}
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 space-y-6">
          <div className="flex border-b border-slate-800">
            {(['dashboard', 'blueprint', 'data'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-xs font-mono font-bold uppercase border-b-2 ${activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400'}`}>
                {tab}
              </button>
            ))}
          </div>
          
          <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/60">
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="text-cyan-500 h-4 w-4" /> Telemetry Stream</h3>
                <div className="h-40 w-full bg-slate-950 rounded-lg border border-slate-900 p-2">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <path d={metricHistory.map((m, i) => `${i === 0 ? 'M' : 'L'} ${(i / 20) * 500} ${100 - m.load}`).join(' ')} fill="none" stroke="#06b6d4" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            )}
            {activeTab === 'data' && (
              <div className="space-y-4">
                {dataItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-900">
                    <span className="text-xs font-mono">{item.name}</span>
                    <button onClick={() => setDataItems(prev => prev.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4 text-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}