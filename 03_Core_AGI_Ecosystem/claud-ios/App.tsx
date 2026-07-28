import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE, POLL_INTERVAL } from './constants';
import type { FullState, SystemStatus } from './types';

type Tab = 'simulation' | 'conversation' | 'logs' | 'source';

const formatUptime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const STATUS_STYLES: Record<SystemStatus, { color: string; dot: string }> = {
  online: { color: 'text-emerald-400', dot: 'bg-emerald-400' },
  loading: { color: 'text-yellow-400', dot: 'bg-yellow-400' },
  offline: { color: 'text-red-500', dot: 'bg-red-500' },
  crashing: { color: 'text-red-400 animate-pulse', dot: 'bg-red-400 animate-ping' },
  rebuilding: { color: 'text-blue-400 animate-pulse', dot: 'bg-blue-400 animate-ping' },
};

export default function App() {
  const [state, setState] = useState<FullState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('simulation');

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/state`);
      if (!response.ok) throw new Error('Bridge connection failed');
      const data = await response.json();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-500 p-6 font-sans">
      <header className="mb-8 border-b border-emerald-900/50 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-emerald-400">DARLEK CANN</h1>
          <p className="text-[10px] uppercase tracking-widest text-emerald-700">Neural Evolution Controller</p>
        </div>
        <nav className="flex gap-2">
          {(['simulation', 'conversation', 'logs'] as Tab[]).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-colors ${activeTab === tab ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-emerald-800 hover:text-emerald-600'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && <div className="p-4 mb-4 border border-red-900/50 text-red-400 text-xs">ERROR: {error}</div>}
        
        {isLoading && !state ? (
          <div className="text-emerald-700 animate-pulse">INITIALIZING NEURAL BRIDGE...</div>
        ) : state && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-emerald-900/50 bg-slate-900/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[state.system.status].dot}`} />
                  <span className={`text-sm font-black ${STATUS_STYLES[state.system.status].color}`}>{state.system.status.toUpperCase()}</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-700">UPTIME: {formatUptime(state.system.uptime)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="border border-emerald-900/50 bg-slate-900/40 p-4 h-[400px] overflow-y-auto">
                <h2 className="text-xs font-bold mb-4">NEURAL TRACES</h2>
                {state.facts.map(f => <div key={f.id} className="text-xs mb-2 p-2 bg-black/20">{f.fact}</div>)}
              </section>
              <section className="border border-emerald-900/50 bg-slate-900/40 p-4 h-[400px] overflow-y-auto">
                <h2 className="text-xs font-bold mb-4">DIRECTIVES</h2>
                {state.directives.map(d => <div key={d.id} className="text-xs mb-2 p-2 border-l-2 border-blue-500">{d.directive}</div>)}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}















