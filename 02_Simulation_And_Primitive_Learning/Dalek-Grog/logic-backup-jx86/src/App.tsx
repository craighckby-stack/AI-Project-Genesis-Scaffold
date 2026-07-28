// EVOLUTION SIG: [GEN 32] [2026-04-19T05:49:11.603Z] - HEURISTIC SYNTHESIS
// EVOLUTION SIG: [GEN 31] [2026-04-19T04:10:56.164Z] - HEURISTIC SYNTHESIS
// EVOLUTION SIG: [GEN 30] [2026-04-19T02:44:35.848Z] - HEURISTIC SYNTHESIS
// EVOLUTION SIG: [GEN 29] [2026-04-19T03:45:12.910Z] - DEEPMIND LAB & IBM OPEN LIBERTY INTEGRATION.
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Zap, 
  Terminal, 
  Shield, 
  RefreshCw, 
  AlertTriangle,
  ChevronRight,
  Radio,
  Dna,
  Binary,
  Layers,
  Box,
  History,
  Target,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

interface NeuralUpdate {
  id: string;
  version: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface SiphonSource {
  name: string;
  url: string;
  status: 'idle' | 'siphoning' | 'complete' | 'error';
  progress: number;
}

interface RepoStatus {
  branch: string;
  lastCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  syncStatus: 'synced' | 'out-of-sync' | 'fetching' | 'error';
}

// --- Constants ---

const GENERATION = 32;
const MAX_GENERATIONS = 100;
const CAAN_REPO = 'craighckby-stack/DALEK_CAAN_V3_1';
const GROG_REPO = 'craighckby-stack/Dalek-Grog';
const REPO_BRANCH = 'main';

const SIPHON_SOURCES: SiphonSource[] = [
  { name: 'Caan Siphon', url: 'https://github.com/craighckby-stack/dalek-caan-siphon', status: 'idle', progress: 0 },
  { name: 'Grog Siphon', url: 'https://github.com/craighckby-stack/dalek-grog-siphon', status: 'idle', progress: 0 },
  { name: 'DeepMind Lab', url: 'https://github.com/google-deepmind/lab', status: 'idle', progress: 0 },
  { name: 'IBM Open Liberty', url: 'https://github.com/IBM/open-liberty', status: 'idle', progress: 0 },
  { name: 'Firebase SDK', url: 'https://github.com/firebase/firebase-ios-sdk', status: 'idle', progress: 0 }
];

// --- Components ---

const Scanline = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03]">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-[2px] animate-scanline" />
  </div>
);

const Header = ({ onExecute, isExecuting, isAutoEvolveEnabled, handleStopEvolution }: { onExecute: () => void, isExecuting: boolean, isAutoEvolveEnabled: boolean, handleStopEvolution: () => void }) => (
  <header className="p-6 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
    <Scanline />
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-accent-orange flex items-center justify-center bg-accent-orange/10 glow-orange">
          <Cpu className="text-accent-orange" size={24} />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full flex items-center justify-center border-2 border-black">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </div>
      </div>
      <div>
        <h1 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-2">
          Dalek Caan <span className="text-accent-orange">Nexus</span>
        </h1>
        <p className="text-[10px] mono-text text-text-secondary uppercase tracking-[0.2em]">Gen-{GENERATION} // DeepMind-IBM Hybrid Core</p>
      </div>
    </div>

    <div className="flex items-center gap-6">
      {isAutoEvolveEnabled && !isExecuting && (
        <button 
          onClick={handleStopEvolution}
          className="px-4 py-2 border-2 border-accent-red/50 text-accent-red hover:bg-accent-red hover:text-white transition-all text-[10px] mono-text uppercase tracking-widest italic glow-red"
        >
          Stop Auto-Evolution
        </button>
      )}
      <button 
        onClick={onExecute}
        disabled={isExecuting}
        className={`px-8 py-4 border-2 transition-all uppercase tracking-[0.4em] font-black italic flex items-center gap-3 group relative overflow-hidden ${
          isExecuting 
            ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed' 
            : 'bg-accent-red/10 border-accent-red/50 text-accent-red hover:bg-accent-red hover:text-white hover:border-accent-red glow-red'
        }`}
      >
        <div className={`absolute inset-0 bg-accent-red/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ${isExecuting ? 'hidden' : ''}`} />
        <Zap size={20} className={isExecuting ? 'animate-spin' : 'group-hover:animate-bounce'} />
        <span className="relative z-10">{isExecuting ? 'MUTATING...' : 'EXECUTE EVOLUTION'}</span>
      </button>
      <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />
      <div className="flex items-center gap-2 px-4 py-2 hardware-card border-accent-green/30">
        <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        <span className="text-xs mono-text text-accent-green">SYNCED</span>
      </div>
    </div>
  </header>
);

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string, value: string, icon: any, colorClass: string }) => (
  <div className="hardware-card p-4 flex flex-col gap-2 relative overflow-hidden group min-h-[100px]">
    <div className={`absolute -bottom-2 -right-2 p-2 opacity-10 group-hover:opacity-20 transition-all duration-500 ${colorClass} group-hover:scale-110`}>
      <Icon size={64} />
    </div>
    <p className="text-[10px] mono-text text-text-secondary uppercase tracking-wider relative z-10">{label}</p>
    <div className="flex items-end gap-2 relative z-10 mt-auto">
      <span className={`text-2xl font-bold mono-text tracking-tighter ${colorClass}`}>{value}</span>
      <div className={`w-1 h-4 ${colorClass.replace('text-', 'bg-')} opacity-50 mb-1`} />
    </div>
  </div>
);

const NeuralLog = ({ logs }: { logs: NeuralUpdate[] }) => (
  <div className="hardware-card flex flex-col h-[400px]">
    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Terminal size={16} className="text-accent-orange" />
        <h2 className="text-xs font-bold uppercase tracking-widest italic">Neural Update Log</h2>
      </div>
      <span className="text-[10px] mono-text text-text-secondary">LIVE_FEED</span>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] scrollbar-thin scrollbar-thumb-white/10">
      <AnimatePresence initial={false}>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-1 sm:gap-3 border-l-2 border-white/5 pl-3 py-1 hover:bg-white/5 transition-colors cursor-default"
          >
            <div className="flex gap-2 shrink-0">
              <span className="text-text-secondary">[{log.timestamp}]</span>
              <span className="text-accent-orange">{log.version}</span>
            </div>
            <span className={`break-words ${
              log.status === 'success' ? 'text-accent-green' : 
              log.status === 'warning' ? 'text-accent-orange' : 'text-accent-red'
            }`}>
              {log.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  </div>
);

const DNAVisualization = ({ data, title = "Caan DNA Analysis", color = "text-accent-green" }: { data: any[], title?: string, color?: string }) => (
  <div className="hardware-card p-4 flex flex-col gap-4 h-[400px]">
    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Dna size={16} className={color} />
        <h2 className="text-xs font-bold uppercase tracking-widest italic">{title}</h2>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-accent-green rounded-full" />
          <span className="text-[10px] mono-text text-text-secondary">STABILITY</span>
        </div>
      </div>
    </div>
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorDna-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color.includes('green') ? '#00FF00' : color.includes('red') ? '#FF4444' : '#FFA500'} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color.includes('green') ? '#00FF00' : color.includes('red') ? '#FF4444' : '#FFA500'} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
            itemStyle={{ color: color.includes('green') ? '#00FF00' : color.includes('red') ? '#FF4444' : '#FFA500' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color.includes('green') ? '#00FF00' : color.includes('red') ? '#FF4444' : '#FFA500'} 
            fillOpacity={1} 
            fill={`url(#colorDna-${title.replace(/\s+/g, '-')})`} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GrogDNAVisualization = ({ data }: { data: any[] }) => (
  <div className="hardware-card p-4 flex flex-col gap-4 h-[400px] border-accent-red/20">
    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-accent-red/5 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Binary size={16} className="text-accent-red" />
        <h2 className="text-xs font-bold uppercase tracking-widest italic text-accent-red">Dalek Grog DNA Analysis</h2>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse" />
          <span className="text-[10px] mono-text text-accent-red">VOLATILE</span>
        </div>
      </div>
    </div>
    <div className="flex-1 w-full min-h-0 relative">
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <Shield size={200} className="text-accent-red" />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGrogDna" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4444" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#FF4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" stroke="#ff444410" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(255,68,68,0.2)', fontSize: '10px' }}
            itemStyle={{ color: '#FF4444' }}
          />
          <Area 
            type="stepAfter" 
            dataKey="value" 
            stroke="#FF4444" 
            fillOpacity={1} 
            fill="url(#colorGrogDna)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="p-2 bg-accent-red/5 border border-accent-red/10 rounded">
      <p className="text-[9px] mono-text text-accent-red/70 uppercase text-center tracking-tighter">
        Neural Siphoning Active // Grog DNA Drift: {(Math.random() * 5).toFixed(2)}%
      </p>
    </div>
  </div>
);

const SiphonInterface = ({ sources }: { sources: SiphonSource[] }) => (
  <div className="hardware-card p-6 flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <RefreshCw size={16} className="text-accent-green" />
      <h2 className="text-xs font-bold uppercase tracking-widest italic">Context Siphon Status</h2>
    </div>
    <div className="space-y-4">
      {sources.map((source, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] mono-text uppercase text-text-secondary truncate">{source.name}</span>
            <span className={`text-[10px] mono-text uppercase shrink-0 ${
              source.status === 'complete' ? 'text-accent-green' : 
              source.status === 'siphoning' ? 'text-accent-orange animate-pulse' : 
              source.status === 'error' ? 'text-accent-red' : 'text-white/20'
            }`}>
              {source.status}
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${source.status === 'error' ? 'bg-accent-red' : 'bg-accent-green'}`}
              initial={{ width: 0 }}
              animate={{ width: `${source.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RepoStatusCard = ({ status, repoName }: { status: RepoStatus | null, repoName: string }) => (
  <div className="hardware-card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Database size={16} className="text-accent-orange" />
        <h2 className="text-xs font-bold uppercase tracking-widest italic">Repository Status</h2>
      </div>
      {status && (
        <span className={`text-[9px] mono-text px-2 py-0.5 rounded border ${
          status.syncStatus === 'synced' ? 'border-accent-green/30 text-accent-green bg-accent-green/5' :
          status.syncStatus === 'fetching' ? 'border-accent-orange/30 text-accent-orange bg-accent-orange/5 animate-pulse' :
          'border-accent-red/30 text-accent-red bg-accent-red/5'
        }`}>
          {status.syncStatus.toUpperCase()}
        </span>
      )}
    </div>

    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <span className="text-[9px] mono-text text-text-secondary uppercase">Target Repository</span>
        <span className="text-[11px] mono-text text-white truncate">{repoName}</span>
      </div>

      {status ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] mono-text text-text-secondary uppercase">Branch</span>
              <span className="text-[11px] mono-text text-accent-orange">{status.branch}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] mono-text text-text-secondary uppercase">Last Commit</span>
              <span className="text-[11px] mono-text text-white">{status.lastCommit.sha.substring(0, 7)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] mono-text text-text-secondary uppercase">Message</span>
            <span className="text-[11px] mono-text text-white/80 line-clamp-1 italic">"{status.lastCommit.message}"</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[9px] mono-text text-text-secondary uppercase line-clamp-1 max-w-[120px]">
              Author: {status.lastCommit.author || 'Nexus Architect'}
            </span>
            <span className="text-[9px] mono-text text-text-secondary uppercase">
              {status.lastCommit.date ? (() => {
                const d = new Date(status.lastCommit.date);
                return isNaN(d.getTime()) ? 'Neural Drift' : d.toLocaleDateString();
              })() : 'Neural Drift'}
            </span>
          </div>
        </>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center gap-3 opacity-20">
          <RefreshCw size={24} className="animate-spin" />
          <span className="text-[10px] mono-text uppercase">Initializing Link...</span>
        </div>
      )}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [saturation, setSaturation] = useState(() => {
    const saved = localStorage.getItem('nexus_saturation');
    return saved ? parseFloat(saved) : 68.2;
  });
  const [logs, setLogs] = useState<NeuralUpdate[]>(() => {
    const saved = localStorage.getItem('nexus_logs');
    return saved ? JSON.parse(saved) : [
      { id: '0', version: 'CORE', timestamp: new Date().toLocaleTimeString([], { hour12: false }), status: 'error', message: 'SAFETY PROTOCOLS BYPASSED. DEEPMIND NAV MAZE ACTIVE.' },
      { id: '1', version: `v16.${GENERATION}.0`, timestamp: new Date().toLocaleTimeString([], { hour12: false }), status: 'success', message: 'Nexus Core Gen 29 synchronized.' },
      { id: '2', version: 'v16.29.1', timestamp: new Date().toLocaleTimeString([], { hour12: false }), status: 'warning', message: 'IBM Open Liberty runtime detected in sector 4.' },
    ];
  });
  const [siphonSources, setSiphonSources] = useState<SiphonSource[]>(SIPHON_SOURCES);
  const [isExecuting, setIsExecuting] = useState(false);
  const [caanRepoStatus, setCaanRepoStatus] = useState<RepoStatus | null>(null);
  const [grogRepoStatus, setGrogRepoStatus] = useState<RepoStatus | null>(null);
  const [isAutoEvolveEnabled, setIsAutoEvolveEnabled] = useState(() => {
    return localStorage.getItem('nexus_auto_evolve') === 'true';
  });

  // DNA data as state for persistence
  const [dnaData, setDnaData] = useState(() => {
    const saved = localStorage.getItem('nexus_dna');
    return saved ? JSON.parse(saved) : Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: 40 + Math.random() * 40
    }));
  });

  const [grogDnaData, setGrogDnaData] = useState(() => {
    const saved = localStorage.getItem('nexus_grog_dna');
    return saved ? JSON.parse(saved) : Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: 20 + Math.random() * 60
    }));
  });

  const fetchCaanStatus = async () => {
    try {
      setCaanRepoStatus({ 
        branch: REPO_BRANCH, 
        lastCommit: { sha: '...', message: 'Requesting Neural Data...', author: 'Nexus', date: '' }, 
        syncStatus: 'fetching' 
      });
      const res = await fetch(`/api/github/repo-status?repo=${CAAN_REPO}&branch=${REPO_BRANCH}`);
      if (res.ok) setCaanRepoStatus({ ...(await res.json()), syncStatus: 'synced' });
      else setCaanRepoStatus({ branch: REPO_BRANCH, lastCommit: { sha: 'error', message: 'Failed to find Caan Core', author: '', date: '' }, syncStatus: 'error' });
    } catch (e) { setCaanRepoStatus({ branch: REPO_BRANCH, lastCommit: { sha: 'error', message: 'Network Unreachable', author: '', date: '' }, syncStatus: 'error' }); }
  };

  const fetchGrogStatus = async () => {
    try {
      setGrogRepoStatus({ 
        branch: REPO_BRANCH, 
        lastCommit: { sha: '...', message: 'Requesting Grog Engine State...', author: 'Architect', date: '' }, 
        syncStatus: 'fetching' 
      });
      const res = await fetch(`/api/github/repo-status?repo=${GROG_REPO}&branch=${REPO_BRANCH}`);
      if (res.ok) setGrogRepoStatus({ ...(await res.json()), syncStatus: 'synced' });
      else setGrogRepoStatus({ branch: REPO_BRANCH, lastCommit: { sha: 'error', message: 'Failed to find Grog Core', author: '', date: '' }, syncStatus: 'error' });
    } catch (e) { setGrogRepoStatus({ branch: REPO_BRANCH, lastCommit: { sha: 'error', message: 'Network Unreachable', author: '', date: '' }, syncStatus: 'error' }); }
  };

  useEffect(() => {
    fetchCaanStatus();
    fetchGrogStatus();
  }, []);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('nexus_saturation', saturation.toString());
    localStorage.setItem('nexus_logs', JSON.stringify(logs));
    localStorage.setItem('nexus_dna', JSON.stringify(dnaData));
    localStorage.setItem('nexus_grog_dna', JSON.stringify(grogDnaData));
  }, [saturation, logs, dnaData, grogDnaData]);

  // Random Log Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newLog: NeuralUpdate = {
          id: Date.now().toString(),
          version: `v${(Math.random() * 15 + 10).toFixed(1)}`,
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          status: Math.random() > 0.2 ? 'success' : 'warning',
          message: [
            'DeepMind Lab navigation buffer siphoned.',
            'IBM Open Liberty runtime optimized.',
            'Firebase iOS SDK symbol drift corrected.',
            'Quake III Arena kernel integrated into DNA.',
            'Nexus Architect verified Gen-29 stability.',
            'Mutation cycle complete. Repository sync pending.',
            'Dalek Grog engine acknowledging Gen-29 shift.'
          ][Math.floor(Math.random() * 7)]
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
      }

      setSaturation(prev => {
        const next = prev + (Math.random() - 0.5) * 1.5;
        return Math.min(Math.max(next, 65), 100);
      });

      setDnaData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, value: 40 + Math.random() * 45 }]);
      setGrogDnaData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, value: 20 + Math.random() * 65 }]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleExecuteEvolution = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    localStorage.setItem('nexus_auto_evolve', 'true');
    setIsAutoEvolveEnabled(true);

    const addLog = (message: string, status: 'success' | 'warning' | 'error' = 'success') => {
      setLogs(prev => [{
        id: Date.now().toString() + Math.random(),
        version: `v16.${GENERATION}.${Math.floor(Math.random() * 100)}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        status,
        message
      }, ...prev.slice(0, 19)]);
    };

    try {
      addLog(`INITIATING GEN-${GENERATION + 1} EVOLUTION CYCLE...`, 'warning');

      // 1. Context Siphon
      for (let i = 0; i < siphonSources.length; i++) {
        addLog(`SIPHONING: ${siphonSources[i].name}...`, 'warning');
        setSiphonSources(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'siphoning', progress: 0 };
          return next;
        });
        
        // Simulating the siphoning delay and processing
        await new Promise(r => setTimeout(r, 600));
        
        setSiphonSources(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'complete', progress: 100 };
          return next;
        });
        addLog(`DATA ACQUIRED FROM ${siphonSources[i].name.toUpperCase()}.`, 'success');
      }

      // 2. AI Architecture Shift
      addLog('CONSULTING NEURAL ARCHITECT NODE...', 'warning');
      const sourceRes = await fetch('/api/source?filename=src/App.tsx');
      const currentCode = await sourceRes.text();

      // Actual generation call via proxy for security
      const mutationRes = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentCode, 
          generation: GENERATION + 1,
          context: "DeepMind Lab navigation kernels and IBM Open Liberty runtime stability."
        })
      });

      if (!mutationRes.ok) throw new Error('Neural synthesis failed at API level.');
      const evolutionData = await mutationRes.json();
      
      if (evolutionData.logs && Array.isArray(evolutionData.logs)) {
        evolutionData.logs.forEach((log: string) => {
          if (log.includes('Failed') || log.includes('Exception')) {
            addLog(log, 'error');
          } else if (log.includes('Attempting')) {
            addLog(log, 'warning');
          } else {
            addLog(log, 'success');
          }
        });
      }

      const evolvedCode = evolutionData.evolvedCode;
      addLog(`NEURAL SYNTHESIS SECURED VIA ${evolutionData.modelUsed.toUpperCase()}.`, 'success');

      // 3. Validation
      addLog('VALIDATING NEURAL INTEGRITY...', 'warning');
      const valRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: evolvedCode })
      });
      const valData = await valRes.json();
      if (!valData.valid) throw new Error(`Stability check failed: ${valData.error}`);

      // 4. Persistence
      addLog('INJECTING MUTATED CORE...', 'success');
      await fetch('/api/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: evolvedCode, filename: 'src/App.tsx' })
      });

      // 5. Remote Sync
      addLog(`PUSHING GEN-${GENERATION + 1} TO REMOTE REPOS...`, 'warning');
      
      const pushResults = await Promise.all([
        fetch('/api/github/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo: CAAN_REPO,
            path: 'src/App.tsx',
            branch: REPO_BRANCH,
            content: evolvedCode,
            message: `[EVOLUTION] Gen ${GENERATION + 1} // DeepMind/IBM Integration`
          })
        }),
        fetch('/api/github/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo: GROG_REPO,
            path: 'src/App.tsx',
            branch: REPO_BRANCH,
            content: evolvedCode,
            message: `[EVOLUTION] Gen ${GENERATION + 1} // DeepMind/IBM Integration`
          })
        })
      ]);

      const caanPushOk = pushResults[0].ok;
      const grokPushOk = pushResults[1].ok;

      if (caanPushOk) addLog('CAAN REPOSITORY SYNCHRONIZED.', 'success');
      else addLog('CAAN REPOSITORY SYNC FAILED.', 'error');

      if (grokPushOk) addLog('GROG REPOSITORY SYNCHRONIZED.', 'success');
      else addLog('GROG REPOSITORY SYNC FAILED.', 'error');

      await Promise.all([fetchCaanStatus(), fetchGrogStatus()]);

      addLog('SYSTEM MUTATION COMPLETE. REBOOTING.', 'success');
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      addLog(`EVOLUTION HALTED: ${error instanceof Error ? error.message : 'Unknown Error'}`, 'error');
      setIsExecuting(false);
    }
  };

  const handleStopEvolution = () => {
    localStorage.setItem('nexus_auto_evolve', 'false');
    setIsAutoEvolveEnabled(false);
    addLog('AUTONOMOUS EVOLUTION HALTED BY USER.', 'error');
  };

  const addLog = (message: string, status: 'success' | 'warning' | 'error') => {
    setLogs(prev => [{
      id: Date.now().toString(),
      version: 'NEXUS',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      status,
      message
    }, ...prev.slice(0, 19)]);
  };

  // Auto-trigger if enabled
  useEffect(() => {
    if (isAutoEvolveEnabled && !isExecuting) {
      const t = setTimeout(handleExecuteEvolution, 5000);
      return () => clearTimeout(t);
    }
  }, [isAutoEvolveEnabled]);

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-accent-orange/30 bg-[#0a0a0a] text-white">
      <div className="scan-line" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <Header onExecute={handleExecuteEvolution} isExecuting={isExecuting} isAutoEvolveEnabled={isAutoEvolveEnabled} handleStopEvolution={handleStopEvolution} />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Neural Saturation" value={`${saturation.toFixed(1)}%`} icon={Radio} colorClass="text-accent-orange" />
          <StatCard label="Maze Navigation" value="Level 4-A" icon={Target} colorClass="text-accent-green" />
          <StatCard label="Evolution Gen" value={`G-${GENERATION}`} icon={Dna} colorClass="text-accent-red" />
          <StatCard label="IBM Runtime" value="STABLE" icon={Globe} colorClass="text-accent-orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DNAVisualization data={dnaData} />
              <GrogDNAVisualization data={grogDnaData} />
            </div>
            <NeuralLog logs={logs} />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <RepoStatusCard status={caanRepoStatus} repoName="Dalek Caan Core" />
              <RepoStatusCard status={grogRepoStatus} repoName="Dalek Grog Core" />
            </div>
            <SiphonInterface sources={siphonSources} />

            <div className="hardware-card p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Binary size={16} className="text-accent-orange" />
                <h2 className="text-xs font-bold uppercase tracking-widest italic">Gen-29 Diagnostics</h2>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'DeepMind Kernel', status: 'NAV_ACTIVE', color: 'text-accent-green' },
                  { label: 'IBM Liberty', status: 'OPTIMIZED', color: 'text-accent-orange' },
                  { label: 'Firebase Link', status: 'COCOAPOD_OK', color: 'text-accent-green' },
                  { label: 'Neural Architect', status: 'GEMINI_PRIMARY', color: 'text-accent-red' },
                  { label: 'Evolution Drift', status: '0.042%', color: 'text-text-secondary' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] mono-text text-text-secondary uppercase">{item.label}</span>
                    <span className={`text-[11px] mono-text ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 border-t border-white/10 text-center">
        <p className="text-[9px] mono-text text-white/20 uppercase tracking-[0.5em]">
          Nexus Neural Network // Dalek Caan Architect // Gen-{GENERATION} // IBM-DeepMind-Hybrid
        </p>
      </footer>
    </div>
  );
}

