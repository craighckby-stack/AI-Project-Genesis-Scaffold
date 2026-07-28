/**
 * @file src/app/page.tsx
 * @description Unified Operator Workspace for DARLEK CANN System-Architectural Root.
 * This component serves as the primary dashboard for multi-agent objective-divergence containment.
 * It integrates real-time telemetry, simulation controls, and registry management.
 * 
 * @architecture
 * - State: Centralized via React hooks with cleanup-safe simulation loops.
 * - Styling: Tailwind CSS with variable-driven theme engine.
 * - Integration: Connects to the 'agent_containment_experiment_summary' blueprint.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, Zap, FileText, Database, RefreshCw, 
  Shield, Plus, Trash2, AlertCircle 
} from 'lucide-react';

interface MetricPoint { time: string; load: number; integrity: number; ops: number; }
interface LogEntry { id: string; time: string; source: string; message: string; type: 'info' | 'success' | 'warn' | 'error'; }
interface DataItem { id: string; name: string; category: string; status: 'ACTIVE' | 'IDLE' | 'STAGING'; timestamp: string; }

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [system, setSystem] = useState({ online: true, load: 42, stability: 94.2, ops: 122, cycle: 0, simLevel: 50 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [metricHistory, setMetricHistory] = useState<MetricPoint[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', source: string = 'SYSTEM') => {
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(36), time: new Date().toLocaleTimeString(), source, message, type }]);
  }, []);

  useEffect(() => {
    setDataItems([
      { id: 'REC-101', name: 'Standard Cognitive Node', category: 'Cortex Matrix', status: 'ACTIVE', timestamp: '11:42:01' },
      { id: 'REC-102', name: 'Topological Narrative Ring', category: 'Quantum Field', status: 'IDLE', timestamp: '11:42:15' }
    ]);
    addLog('Hyper-Heuristic Compiler Initialized.', 'info', 'SYSTEM');
  }, [addLog]);

  useEffect(() => {
    if (!system.online) return;
    const interval = setInterval(() => {
      const load = Math.floor((system.simLevel * 0.7) + (Math.random() * 10));
      setSystem(prev => ({ ...prev, load, ops: Math.floor(prev.simLevel * 2) }));
      setMetricHistory(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), load, integrity: 95, ops: 120 }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [system.online, system.simLevel]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500">
      <header className="border-b border-slate-800 bg-slate-900/60 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Cpu className="text-cyan-400" /> DALEK CAAN // EXPERIMENT</h1>
          <p className="text-xs text-slate-500 font-mono">SYSTEM_ARCHITECTURAL_ROOT_V3</p>
        </div>
        <button onClick={() => setSystem(s => ({ ...s, online: !s.online }))} className={`px-4 py-2 rounded font-mono text-xs ${system.online ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800'}`}>
          {system.online ? '■ ONLINE' : '○ PAUSED'}
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <nav className="col-span-12 flex gap-4 border-b border-slate-800">
          {(['dashboard', 'blueprint', 'data'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-xs font-bold uppercase ${activeTab === tab ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-500'}`}>
              {tab}
            </button>
          ))}
        </nav>

        <section className="col-span-12 lg:col-span-8">
          {activeTab === 'dashboard' && (
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Activity className="text-cyan-500" /> Telemetry Stream</h2>
              <div className="h-48 bg-slate-950 rounded border border-slate-900 flex items-end p-2 gap-1">
                {metricHistory.map((m, i) => (
                  <div key={i} className="flex-1 bg-cyan-500/20" style={{ height: `${m.load}%` }} />
                ))}
              </div>
            </div>
          )}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {dataItems.map(item => (
                <div key={item.id} className="flex justify-between p-4 bg-slate-900 rounded border border-slate-800">
                  <span>{item.name}</span>
                  <button onClick={() => setDataItems(prev => prev.filter(i => i.id !== item.id))}><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-mono text-slate-400 mb-2">SYSTEM STATUS</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 p-2 rounded">Load: {system.load}%</div>
              <div className="bg-slate-950 p-2 rounded">Ops: {system.ops}</div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}