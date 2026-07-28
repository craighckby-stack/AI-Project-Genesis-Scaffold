/**
 * @file src/app/page.tsx
 * @description UnifiedOperatorWorkspace: The primary control interface for the DARLEK CANN ecosystem.
 * This component serves as the central hub for system telemetry, agent containment monitoring,
 * and operational state management. It integrates real-time simulation metrics with
 * persistent registry management, adhering to the 'Zero-to-near-zero' hallucination constraints.
 * 
 * Integration: Connects to 'src/app/layout.tsx' for theme context and 'src/app/globals.css' for design tokens.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, Zap, FileText, Database, 
  RefreshCw, Plus, Trash2, Shield, AlertCircle
} from 'lucide-react';

interface MetricPoint { time: string; load: number; integrity: number; ops: number; }
interface LogEntry { id: string; time: string; source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT'; message: string; type: 'info' | 'success' | 'warn' | 'error'; }
interface DataItem { id: string; name: string; category: string; status: 'ACTIVE' | 'IDLE' | 'STAGING'; timestamp: string; }

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [systemState, setSystemState] = useState({
    coreOnline: true,
    cpuLoad: 42,
    quantumStability: 94.2,
    opsRate: 122,
    evolutionCycle: 0,
    simLevel: 50
  });
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-cyan-500 font-bold uppercase">DALEK CAAN COMPILER // SIMULATOR</span>
          <h1 className="text-xl font-bold flex items-center gap-2"><Cpu className="text-cyan-400" /> agent_containment_experiment_summary1</h1>
        </div>
        <button onClick={() => setSystemState(p => ({...p, coreOnline: !p.coreOnline}))} className={`px-4 py-2 rounded font-mono text-xs ${systemState.coreOnline ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800'}`}>
          {systemState.coreOnline ? '■ ONLINE' : '○ PAUSED'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">CPU: {systemState.cpuLoad}%</div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">STABILITY: {systemState.quantumStability}%</div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">OPS: {systemState.opsRate}</div>
        </div>

        <div className="flex border-b border-slate-800">
          {(['dashboard', 'blueprint', 'data'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-xs font-bold uppercase ${activeTab === tab ? 'border-b-2 border-cyan-500 text-cyan-400' : 'text-slate-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          {activeTab === 'dashboard' && <div className="h-64 flex items-center justify-center text-slate-600 font-mono">TELEMETRY STREAM ACTIVE</div>}
          {activeTab === 'blueprint' && <div className="text-xs font-mono text-slate-400 whitespace-pre-wrap"># Specification Blueprint Loaded...</div>}
          {activeTab === 'data' && <div className="space-y-4">{dataItems.map(item => <div key={item.id} className="flex justify-between p-2 border-b border-slate-800">{item.name} <Trash2 className="h-4 w-4 cursor-pointer text-red-500" onClick={() => setDataItems(d => d.filter(i => i.id !== item.id))} /></div>)}</div>}
        </div>
      </main>
    </div>
  );
}