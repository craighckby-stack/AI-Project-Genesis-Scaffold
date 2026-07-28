'use client';

/**
 * @fileoverview Unified Operator Workspace for DARLEK CANN ecosystem.
 * Acts as the primary simulation and orchestration dashboard for the agent_containment_experiment.
 * Integrates with the system-wide state engine and provides real-time telemetry visualization.
 * 
 * Architecture: Next.js 15+ / Framer-Motion / Tailwind CSS
 * Role: Orchestration Entry Point
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, Zap, FileText, Database, Plus, Trash2, RefreshCw, Shield
} from 'lucide-react';

interface MetricPoint { time: string; load: number; integrity: number; ops: number; }
interface LogEntry { id: string; time: string; source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT'; message: string; type: 'info' | 'success' | 'warn' | 'error'; }
interface DataItem { id: string; name: string; category: string; status: 'ACTIVE' | 'IDLE' | 'STAGING'; timestamp: string; }

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [coreOnline, setCoreOnline] = useState(true);
  const [simLevel, setSimLevel] = useState(50);
  const [metrics, setMetrics] = useState({ load: 42, integrity: 94.2, ops: 122 });
  const [metricHistory, setMetricHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([
    { id: 'REC-101', name: 'Standard Cognitive Node', category: 'Cortex Matrix', status: 'ACTIVE', timestamp: '11:42:01' },
    { id: 'REC-102', name: 'Topological Narrative Ring', category: 'Quantum Field', status: 'IDLE', timestamp: '11:42:15' }
  ]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', source: LogEntry['source'] = 'SYSTEM') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(36), time, source, message, type }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!coreOnline) return;
    const interval = setInterval(() => {
      const load = Math.max(5, Math.min(100, Math.floor((simLevel * 0.7) + (Math.random() * 10 - 5))));
      const integrity = parseFloat((100 - (simLevel * 0.15) + (Math.random() * 2 - 1)).toFixed(1));
      const ops = Math.max(0, Math.floor((simLevel * 2) + Math.random() * 15));
      
      setMetrics({ load, integrity, ops });
      setMetricHistory(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), load, integrity, ops }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [coreOnline, simLevel]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-xs font-mono text-cyan-500 font-bold tracking-wider">DALEK CANN COMPILER // SIMULATOR</span>
          <h1 className="text-xl font-bold flex items-center gap-2"><Cpu className="text-cyan-400" /> agent_containment_experiment</h1>
        </div>
        <button onClick={() => setCoreOnline(!coreOnline)} className={`px-4 py-2 rounded-lg font-mono text-xs ${coreOnline ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
          {coreOnline ? '■ ONLINE' : '○ PAUSED'}
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[ { label: 'SYS CPU', val: metrics.load + '%' }, { label: 'STABILITY', val: metrics.integrity + '%' }, { label: 'THROUGHPUT', val: metrics.ops + ' ops' } ].map(m => (
            <div key={m.label} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-center">
              <span className="block text-9xs text-slate-500 uppercase">{m.label}</span>
              <span className="text-xl font-bold font-mono text-cyan-400">{m.val}</span>
            </div>
          ))}
        </div>

        <div className="flex border-b border-slate-800">
          {(['dashboard', 'blueprint', 'data'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-xs font-bold uppercase border-b-2 ${activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-semibold mb-4">Dynamic Telemetry Stream</h3>
              <div className="h-48 w-full bg-slate-950 rounded-lg border border-slate-900 p-2">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <path d={metricHistory.map((m, i) => `${i === 0 ? 'M' : 'L'} ${(i / 19) * 500} ${100 - m.load}`).join(' ')} fill="none" stroke="#06b6d4" strokeWidth="2" />
                </svg>
              </div>
            </motion.div>
          )}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {dataItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-900 rounded-lg border border-slate-800">
                  <div><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-slate-500">{item.category}</p></div>
                  <button onClick={() => setDataItems(prev => prev.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4 text-red-500" /></button>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}