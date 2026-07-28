/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * REFACTORED BY: Dalek Sovereign Splicer
 * PROTOCOL: Elite Performance / Neural Integrity / UTF-8 Preservation
 */

import React, { 
  useState, useEffect, useRef, useMemo, useCallback, useTransition 
} from 'react';
import { 
  Zap, Database, Cpu, ShieldCheck, Activity, Dna, AlertTriangle, Play, 
  Settings, History, Terminal, Github, Save, RefreshCw, Skull, LogIn, LogOut, 
  User as UserIcon, CheckCircle2, Trash2, Shield, X, MessageSquare, Bug, 
  Lightbulb, Send, Sun, Moon, Search, Heart, Key, FileCode, Compass, Star, 
  Coins, TrendingUp, Square 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import pLimit from 'p-limit';
import * as prettier from 'prettier/standalone';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginTypescript from 'prettier/plugins/typescript';

// Internal Logic
import { llmEngine, type LLMMode } from './lib/llm';
import { engineManager } from './lib/engine_manager';
import { authBridge } from './lib/auth_bridge';
import { GitHubService } from './lib/github';
import { NeuralCodec, minifyCode } from './lib/neural_codec';
import { BinaryShield } from './lib/binaryShield';

// Firebase
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { 
  doc, getDoc, setDoc, onSnapshot, collection, addDoc, 
  query, orderBy, limit 
} from 'firebase/firestore';

import { 
  BrainMeta, DeathRegistryEntry, BrainIntention, ArbitrageSignal 
} from './types';

// --- Constants ---
const DEFAULT_REPO_OWNER = 'craighckby-stack';
const DEFAULT_REPO_NAME = 'Test-1-';
const BRAIN_ID = 'main_brain';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-8 font-mono text-white">
          <AlertTriangle className="w-16 h-16 text-red-600 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black uppercase tracking-widest mb-2 text-red-500">Neural Sync Failure</h1>
          <p className="text-[10px] opacity-50 mb-8 max-w-sm text-center uppercase tracking-widest">Immediate isolation required. Protocol 0 has been initiated.</p>
          <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-lg mb-8 max-w-xl overflow-auto text-[10px] text-red-400">
            {this.state.error?.message}
          </div>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 font-black uppercase text-[10px] rounded-full hover:bg-red-500 transition-all">Emergency Reboot</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [isPending, startTransition] = useTransition();
  const stopEvolutionRef = useRef(false);
  const lastPayloadRef = useRef<string | null>(null);

  // --- Core State Logic ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('system_theme') as any) || 'dark');
  const [activeTab, setActiveTab] = useState('evolution');

  // --- Configuration persistence ---
  const [config, setConfig] = useState({
    token: localStorage.getItem('gh_token') || '',
    owner: localStorage.getItem('gh_owner') || DEFAULT_REPO_OWNER,
    repo: localStorage.getItem('gh_repo') || DEFAULT_REPO_NAME,
    masterKey: localStorage.getItem('gh_master_key') || '',
    gemini: localStorage.getItem('gemini_token') || '',
    zeroText: localStorage.getItem('gh_zero_text') === 'true',
    llmMode: (localStorage.getItem('llm_mode') as LLMMode) || 'cloud'
  });

  const updateConfig = (key: keyof typeof config, val: any) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem(`gh_${key}`, String(val));
      if (key === 'llmMode') llmEngine.mode = val;
      return next;
    });
  };

  // --- Real-time telemetry ---
  const [logs, setLogs] = useState<{msg: string, type: string}[]>([]);
  const [evolution, setEvolution] = useState({ active: false, current: 0, total: 0, phase: 'IDLE', file: '', code: '' });
  const [brainMeta, setBrainMeta] = useState<BrainMeta>({ chunks_count: 0, last_reboot: Date.now(), version: 4.0 });

  const addLog = useCallback((msg: string, type = 'info') => {
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 100));
  }, []);

  // --- Initialize Session ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        addLog(`Neural Bridge Established: ${u.email}`, "success");
        await setDoc(doc(db, 'users', u.uid), { uid: u.uid, role: 'splicer', lastActive: Date.now() }, { merge: true });
      }
    });
    return unsub;
  }, [addLog]);

  // --- Telemetry Sync ---
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'brains', BRAIN_ID), (snap) => {
      if (snap.exists()) setBrainMeta(snap.data().meta || brainMeta);
    });
  }, [user]);

  // --- Primary Evolution Engine ---
  const runEvolutionCycle = async () => {
    if (evolution.active) { stopEvolutionRef.current = true; return; }
    if (!config.token) { addLog("Token Required for Sequence", "error"); return; }

    setEvolution(v => ({ ...v, active: true, phase: 'SEQUENCING' }));
    stopEvolutionRef.current = false;

    try {
      const gh = new GitHubService(config.token, config.owner, config.repo);
      const shield = config.zeroText ? new BinaryShield(config.masterKey) : null;
      if (shield) await shield.initialize();

      const branch = await gh.getDefaultBranch();
      const target = config.zeroText ? 'binary-evolution' : 'evolved-sequence';
      
      try { await gh.createBranch(target, branch); } catch {}

      const all = await gh.getAllFiles(branch);
      const evolvable = all.filter(f => /\.(tsx?|jsx?|py|rs)$/.test(f.path));
      
      setEvolution(v => ({ ...v, total: evolvable.length }));

      for (let i = 0; i < evolvable.length; i++) {
        if (stopEvolutionRef.current) break;
        const file = evolvable[i];
        const raw = await gh.getFileContent(file.sha);
        
        setEvolution(v => ({ ...v, current: i + 1, file: file.path, code: raw, phase: 'MUTATING' }));

        const prompt = `SYSTEM: Optimize for Dalek-grade performance. Minimal footprint. Modern ES logic.
        FILE: ${file.path}
        CODE: ${raw}
        OUTPUT: JSON { "code": string }`;

        try {
          const res = await engineManager.generate(prompt, "Sovereign Splicer AI");
          const { code: mutated } = JSON.parse(res.replace(/```json|```/g, ''));
          
          const formatted = await prettier.format(mutated, {
            parser: 'typescript',
            plugins: [prettierPluginEstree, prettierPluginBabel, prettierPluginTypescript],
            singleQuote: true, semi: false
          });

          let currentSha;
          try { currentSha = (await gh.getFile(file.path, target)).sha; } catch {}

          if (config.zeroText && shield) {
            const packet = await shield.encryptPacket(minifyCode(formatted, file.path));
            const b64 = btoa(JSON.stringify(packet));
            await gh.updateFileRaw(file.path, b64, `Ã°Ã‚Ã‚Â DNA: ${file.path}`, target, currentSha);
          } else {
            await gh.updateFile(file.path, formatted, `Ã°Ã‚Ã‚Â¬ Mutation: ${file.path}`, target, currentSha);
          }
          addLog(`Sequence Stabilized: ${file.path}`, "success");
        } catch (e: any) {
          addLog(`Sequence Collapse: ${file.path}`, "error");
          await addDoc(collection(db, 'death_registry'), { path: file.path, error: e.message, timestamp: Date.now() });
        }
      }
    } catch (e: any) {
      addLog(`Critical Core Error: ${e.message}`, "error");
    } finally {
      setEvolution(v => ({ ...v, active: false, phase: 'IDLE' }));
    }
  };

  const UIHeader = useMemo(() => (
    <header className={cn(
      "h-14 border-b flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-md",
      theme === 'dark' ? "bg-black/80 border-[#111]" : "bg-white/80 border-[#eee]"
    )}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.4)]">
            <Dna size={16} className={cn("text-black transition-transform duration-1000", evolution.active && "rotate-[360deg]")} />
          </div>
          <span className="font-black text-xs uppercase tracking-tighter">Sovereign <span className="text-orange-500">Splicer</span></span>
        </div>
        <div className="h-4 w-[1px] bg-[#222]" />
        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/60 uppercase">
          <Activity size={10} className="animate-pulse" />
          <span>Core Link: 100%</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 opacity-50 hover:opacity-100">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-[#111]">
            <span className="text-[10px] font-bold uppercase opacity-50">{user.displayName || 'Operator'}</span>
            <button onClick={() => authBridge.logout()} className="p-2 text-red-900 hover:text-red-500"><LogOut size={16} /></button>
          </div>
        ) : (
          <button onClick={() => authBridge.login()} className="bg-white text-black text-[9px] font-black uppercase px-4 py-1.5 rounded-full">Authorize</button>
        )}
      </div>
    </header>
  ), [theme, evolution.active, user]);

  return (
    <div className={cn(
      "min-h-screen font-mono text-[11px] selection:bg-orange-500 selection:text-black",
      theme === 'dark' ? "bg-[#050505] text-[#ccc]" : "bg-[#f9f9f9] text-[#222]"
    )}>
      {UIHeader}

      <div className="grid grid-cols-[280px_1fr] h-[calc(100vh-56px)]">
        {/* Navigation / Status */}
        <aside className="border-r border-[#111] p-6 flex flex-col gap-8 bg-[#080808]/50">
          <button 
            onClick={runEvolutionCycle}
            className={cn(
              "w-full py-6 rounded-2xl flex flex-col items-center gap-3 transition-all relative overflow-hidden",
              evolution.active ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-white text-black hover:scale-[1.02] shadow-xl"
            )}
          >
            {evolution.active ? <Square size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
            <span className="font-black uppercase tracking-widest text-[10px]">{evolution.active ? 'Terminate' : 'Engage Core'}</span>
            {evolution.active && (
              <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${(evolution.current / evolution.total) * 100}%` }}
              />
            )}
          </button>

          <nav className="flex flex-col gap-1">
            {[
              { id: 'evolution', icon: Zap, label: 'Control' },
              { id: 'brain', icon: BrainMeta, label: 'Neural' },
              { id: 'config', icon: Settings, label: 'Synapse' }
            ].map((btn: any) => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all uppercase font-bold tracking-widest text-[10px]",
                  activeTab === btn.id ? "bg-orange-600/10 text-orange-500" : "opacity-30 hover:opacity-100"
                )}
              >
                <btn.icon size={14} /> {btn.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
             <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <span className="text-[8px] opacity-30 uppercase font-black">Memory Density</span>
                <div className="flex items-end gap-1 h-8">
                  {[40, 70, 45, 90, 65, 80, 30].map((h, i) => (
                    <div key={i} className="flex-1 bg-orange-600/40 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>DNA_V{brainMeta.version}</span>
                  <span className="text-orange-500">{brainMeta.chunks_count} PACKETS</span>
                </div>
             </div>
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'evolution' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-12">
                  <header>
                    <span className="text-orange-600 text-[10px] font-black uppercase tracking-[0.5em]">Active Mutation Stream</span>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mt-2">
                      {evolution.file || 'SYSTEM_READY'}
                    </h2>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[550px]">
                    <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                      <div className="px-6 py-3 border-b border-[#111] flex items-center justify-between bg-black/40">
                        <span className="text-[9px] uppercase font-bold opacity-30 tracking-widest">Source DNA</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500/20" />
                          <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                          <div className="w-2 h-2 rounded-full bg-green-500/20" />
                        </div>
                      </div>
                      <pre className="flex-1 p-6 text-[10px] overflow-auto text-white/30 whitespace-pre-wrap font-mono custom-scrollbar">
                        {evolution.code || '// WAITING FOR SEQUENCE INITIATION...'}
                      </pre>
                    </div>

                    <div className="bg-[#0A0A0A] border border-orange-600/20 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
                      <div className="px-6 py-3 border-b border-orange-600/10 flex items-center justify-between bg-orange-600/5">
                        <span className="text-[9px] uppercase font-bold text-orange-500 tracking-widest">Mutated Sequence</span>
                        <Activity size={12} className="text-orange-600 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-600/5 to-transparent pointer-events-none" />
                      <pre className="flex-1 p-6 text-[10px] overflow-auto text-orange-500/80 whitespace-pre-wrap font-mono custom-scrollbar">
                        {evolution.active ? `// ANALYZING ENZYMES...\n// INJECTING LOGIC...\n// MUTATING: ${evolution.file}` : '// IDLE...'}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'config' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-8 pt-12">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Synapse Configuration</h3>
                    <p className="text-[9px] opacity-40 uppercase tracking-[0.3em]">Calibrate the link to the external repositories.</p>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#111] p-8 rounded-[40px] space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-30 ml-2">GitHub Key</label>
                      <input 
                        type="password" 
                        value={config.token} 
                        onChange={e => updateConfig('token', e.target.value)}
                        className="w-full bg-black border border-[#222] p-4 rounded-2xl focus:border-orange-600 transition-all outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase opacity-30 ml-2">Owner</label>
                        <input type="text" value={config.owner} onChange={e => updateConfig('owner', e.target.value)} className="w-full bg-black border border-[#222] p-4 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase opacity-30 ml-2">Repository</label>
                        <input type="text" value={config.repo} onChange={e => updateConfig('repo', e.target.value)} className="w-full bg-black border border-[#222] p-4 rounded-2xl" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#111] space-y-4">
                      <div className="flex items-center justify-between p-4 bg-orange-600/5 rounded-2xl border border-orange-600/10">
                        <div className="flex flex-col">
                          <span className="font-black uppercase tracking-widest text-[10px]">Zero-Text Policy</span>
                          <span className="text-[8px] opacity-50 uppercase">AES-256-GCM Binary Obfuscation</span>
                        </div>
                        <button 
                          onClick={() => updateConfig('zeroText', !config.zeroText)}
                          className={cn("w-10 h-5 rounded-full transition-all relative", config.zeroText ? "bg-orange-600" : "bg-[#222]")}
                        >
                          <motion.div animate={{ x: config.zeroText ? 22 : 2 }} className="w-3 h-3 bg-white rounded-full absolute top-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Telemetry Bar */}
          <footer className="h-40 border-t border-[#111] bg-black flex flex-col">
            <div className="h-8 border-b border-[#111] flex items-center justify-between px-6 bg-[#050505]">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-orange-600" />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">System_Log_v4.0.0</span>
              </div>
              <span className="text-[9px] font-mono text-orange-600/50 uppercase tracking-widest">Status: {evolution.phase}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[9px] custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 opacity-50 hover:opacity-100 transition-opacity border-b border-white/[0.02] pb-1">
                  <span className="text-orange-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className={cn("font-bold uppercase shrink-0 w-12", log.type === 'error' ? 'text-red-500' : 'text-emerald-500')}>{log.type}</span>
                  <span className="truncate">{log.msg}</span>
                </div>
              ))}
            </div>
          </footer>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}} />
    </div>
  );
}