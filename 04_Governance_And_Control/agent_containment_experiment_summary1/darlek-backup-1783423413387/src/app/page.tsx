/**
 * @file src/app/page.tsx
 * @description Unified Operator Workspace for the DALEK CAAN system.
 * This component serves as the primary control interface for the agent containment experiment.
 * It integrates real-time telemetry, system diagnostics, and administrative controls.
 * 
 * Architecture: Next.js 14+ (App Router), Framer Motion, Tailwind CSS.
 * Dependencies: Framer Motion, Lucide React.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Shield, Cpu, Activity, Zap, FileText, Database, 
  RefreshCw, Plus, Trash2, AlertCircle 
} from 'lucide-react';

// --- Types ---
interface MetricPoint { time: string; load: number; integrity: number; ops: number; }
interface LogEntry { id: string; time: string; source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT'; message: string; type: 'info' | 'success' | 'warn' | 'error'; }
interface DataItem { id: string; name: string; category: string; status: 'ACTIVE' | 'IDLE' | 'STAGING'; timestamp: string; }

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [coreOnline, setCoreOnline] = useState(true);
  const [systemState, setSystemState] = useState({ cpuLoad: 42, quantumStability: 94.2, opsRate: 122 });
  const [metricHistory, setMetricHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([
    { id: 'REC-101', name: 'Standard Cognitive Node', category: 'Cortex Matrix', status: 'ACTIVE', timestamp: '11:42:01' },
    { id: 'REC-102', name: 'Topological Narrative Ring', category: 'Quantum Field', status: 'IDLE', timestamp: '11:42:15' }
  ]);

  // --- Logic ---
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', source: LogEntry['source'] = 'SYSTEM') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(36), time, source, message, type }]);
  }, []);

  useEffect(() => {
    if (!coreOnline) return;
    const interval = setInterval(() => {
      const load = Math.floor(Math.random() * 20 + 30);
      const integrity = parseFloat((90 + Math.random() * 8).toFixed(1));
      const ops = Math.floor(Math.random() * 50 + 100);
      
      setSystemState({ cpuLoad: load, quantumStability: integrity, opsRate: ops });
      setMetricHistory(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), load, integrity, ops }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [coreOnline]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full bg-cyan-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">DALEK CAAN // OPERATOR</h1>
            <p className="text-xs text-slate-500 font-mono">SYSTEM_CONTAINMENT_V3.0</p>
          </div>
        </div>
        <button 
          onClick={() => setCoreOnline(!coreOnline)}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono ${coreOnline ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
          {coreOnline ? '■ ONLINE' : '○ PAUSED'}
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex border-b border-slate-800">
            {['dashboard', 'blueprint', 'data'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-xs font-bold uppercase ${activeTab === tab ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-500'}`}>
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Activity className="text-cyan-500"/> Telemetry Stream</h2>
                <div className="h-48 w-full bg-slate-950 rounded-lg border border-slate-900 flex items-end p-2 gap-1">
                  {metricHistory.map((m, i) => (
                    <div key={i} className="flex-1 bg-cyan-500/20" style={{ height: `${m.load}%` }} />
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'data' && (
              <div className="space-y-4">
                {dataItems.map(item => (
                  <div key={item.id} className="flex justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <span>{item.name}</span>
                    <button onClick={() => setDataItems(prev => prev.filter(d => d.id !== item.id))}><Trash2 className="h-4 w-4 text-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">System Logs</h3>
            <div className="space-y-2 h-64 overflow-y-auto font-mono text-[10px]">
              {logs.map(log => (
                <div key={log.id} className="text-slate-300">[{log.time}] {log.message}</div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}