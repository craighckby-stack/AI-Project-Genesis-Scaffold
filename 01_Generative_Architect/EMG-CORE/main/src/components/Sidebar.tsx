import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Activity, Cpu, Database, ShieldAlert, Zap } from 'lucide-react';
import { CoreIdentity, BackupData } from '../types';
import { geneticSiphon } from '../lib/ai';

interface SidebarProps {
  identity: CoreIdentity;
  authStatus: 'Online' | 'Offline' | 'Syncing';
  onSiphonComplete: (insights: any[]) => void;
}

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

const TelemetryCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800 flex items-center gap-3 hover:border-slate-600 transition-colors">
    <div className={`p-2 rounded bg-slate-900 ${color}`}>{icon}</div>
    <div>
      <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">{label}</div>
      <div className="font-mono text-xs font-bold text-slate-200">{value}</div>
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ identity, authStatus, onSiphonComplete }) => {
  const [systemStatus, setSystemStatus] = useState<{ msg: string; type: 'idle' | 'active' | 'error' | 'success' }>({ msg: 'CORE_READY', type: 'idle' });
  const [isSiphoning, setIsSiphoning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const handleGeneticSiphon = useCallback(async () => {
    if (!GITHUB_TOKEN) return setSystemStatus({ msg: 'ERR: AUTH_TOKEN_MISSING', type: 'error' });
    
    setIsSiphoning(true);
    setSystemStatus({ msg: 'SIPHONING_QUANTUM_NODES...', type: 'active' });
    
    abortControllerRef.current = new AbortController();
    
    try {
      const insights = await geneticSiphon(GITHUB_TOKEN);
      if (insights?.length) {
        onSiphonComplete(insights);
        setSystemStatus({ msg: `SYNC_COMPLETE: ${insights.length}_NODES`, type: 'success' });
      } else {
        setSystemStatus({ msg: 'NO_EVOLUTIONARY_DELTA', type: 'idle' });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setSystemStatus({ msg: 'CRITICAL_SIPHON_FAILURE', type: 'error' });
    } finally {
      setIsSiphoning(false);
    }
  }, [onSiphonComplete]);

  return (
    <aside className="w-72 h-screen flex flex-col gap-6 p-6 bg-slate-950 border-r border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-indigo-500 font-black tracking-tighter flex items-center gap-2 text-sm">
          <Cpu size={18} className="text-indigo-400" /> DARLEK_CANN_v3
        </h1>
        <div className={`w-2 h-2 rounded-full ${authStatus === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'} animate-pulse`} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <TelemetryCard label="Evolutionary Index" value={(identity.evolutionHistory.length * 1.5).toFixed(1)} icon={<Sparkles size={14} />} color="text-sky-400" />
        <TelemetryCard label="Epistemic Nodes" value={identity.learningLog.length} icon={<Database size={14} />} color="text-lime-400" />
        <TelemetryCard label="Agency State" value={identity.agencyStatus || 'NULL'} icon={<Activity size={14} />} color="text-indigo-400" />
      </div>

      <div className="mt-auto space-y-4">
        <button 
          onClick={handleGeneticSiphon}
          disabled={isSiphoning}
          className="w-full bg-indigo-950/50 border border-indigo-500/30 hover:bg-indigo-900 text-indigo-200 py-3 rounded font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSiphoning ? <Zap size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isSiphoning ? 'EXECUTING_SIPHON' : 'EXECUTE_EVOLUTION'}
        </button>
        <div className={`p-3 rounded border font-mono text-[9px] flex items-center gap-2 ${systemStatus.type === 'error' ? 'bg-red-950/20 border-red-900 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          {systemStatus.type === 'error' ? <ShieldAlert size={12} /> : <div className="w-1 h-1 bg-current rounded-full" />}
          {systemStatus.msg}
        </div>
      </div>
    </aside>
  );
};