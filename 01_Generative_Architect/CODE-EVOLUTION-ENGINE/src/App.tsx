import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  getDocs, doc, setDoc, getDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, Database, MessageSquare, Bot,
  ShieldCheck, XCircle, CheckCircle2, Terminal, History, ChevronDown
} from 'lucide-react';
import firebaseConfigJson from '../firebase-applet-config.json';

const CONFIG = {
  APP_ID: typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'emg-agi-v8-9-2',
  GITHUB_API: 'https://api.github.com/repos',
  WATCHDOG_TIMEOUT: 90000,
};

const safeUtoa = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str: string) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText: string) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { 
      const p = JSON.parse(m); 
      if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, baseDelay = 1000): Promise<Response> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Fetch attempt ${attempt} failed. Retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
};

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Protocol',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  internalDialogue: { active: false, candidate: null, round: 0, transcript: [] },
  config: { githubToken: '', repo: '', branch: 'main', cycleDelay: 20000 },
};

function coreReducer(state: any, action: any) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'SCANNING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'DIALOGUE_START': 
      return { ...state, internalDialogue: { active: true, candidate: action.payload, round: 1, transcript: [] } };
    case 'DIALOGUE_STEP': 
      return { 
        ...state, 
        internalDialogue: { 
          ...state.internalDialogue, 
          round: state.internalDialogue.round + 1, 
          transcript: [...state.internalDialogue.transcript, action.payload] 
        } 
      };
    case 'DIALOGUE_END': 
      return { ...state, internalDialogue: { active: false, candidate: null, round: 0, transcript: [] } };
    case 'CYCLE_COMPLETE': 
      return { ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) };
    default: return state;
  }
}

let app: any, auth: any, db: any;
try {
  const firebaseConfig = typeof window !== 'undefined' && (window as any).__firebase_config 
    ? JSON.parse((window as any).__firebase_config) 
    : firebaseConfigJson;

  if (firebaseConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase config error:", e);
}

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState<any>(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof window !== 'undefined' && (window as any).__initial_auth_token) {
        await signInWithCustomToken(auth, (window as any).__initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const userPath = ['artifacts', CONFIG.APP_ID, 'users', user.uid];
    
    const unsubLogs = onSnapshot(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a:any, b:any) => b.timestamp - a.timestamp).slice(0, 20) }});
    });
    
    const unsubChat = onSnapshot(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a:any, b:any) => a.timestamp - b.timestamp).slice(-50) }});
    });

    const unsubRegistry = onSnapshot(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { toolCount: s.size }});
    });

    return () => { unsubLogs(); unsubChat(); unsubRegistry(); };
  }, [user]);

  const addLog = useCallback(async (msg: string, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) {}
  }, [user]);

  const addMsg = useCallback(async (role: string, text: string, metadata = {}) => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role, text, timestamp: Date.now(), ...metadata }); } catch (e) {}
  }, [user]);

  const runNegotiation = async (candidate: any) => {
    if (!user || !db || busy.current) return;
    busy.current = true;
    dispatch({ type: 'DIALOGUE_START', payload: candidate });
    
    let dialogueHistory = [
      { role: 'system', content: `You are the System Reviewer. A new tool candidate has been proposed by the Code Optimizer.
      NAME: ${candidate.interfaceName}
      CODE: ${candidate.code}
      
      STRICT GOVERNANCE RULES:
      1. Challenge the architecture. Is it genuinely reusable?
      2. Analyze the risk profile (external calls, state mutations).
      3. Ask one specific technical question to the Code Optimizer.
      4. DO NOT approve until at least Round 2.
      5. To approve, start your response with "DECISION: APPROVED".` }
    ];

    try {
      for (let round = 1; round <= 3; round++) {
        const conversationContext = dialogueHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
        
        const cRes = await fetchWithRetry('/api/think', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             prompt: `Please review the proposed tool candidate as the System Reviewer.\n\nConversation so far:\n${conversationContext}`,
             customSystemInstruction: `You are the System Reviewer. A new tool candidate has been proposed by the Code Optimizer.
NAME: ${candidate.interfaceName}
CODE: ${candidate.code}

STRICT GOVERNANCE RULES:
1. Challenge the architecture. Is it genuinely reusable?
2. Analyze the risk profile (external calls, state mutations).
3. Ask one specific technical question to the Code Optimizer.
4. DO NOT approve until at least Round 2.
5. To approve, start your response with "DECISION: APPROVED".`,
             thinkingLevel: 'off'
          })
        });
        const cData = await cRes.json();
        const cText = cData.text || "Audit timeout.";
        
        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'System Reviewer', text: cText } });
        await addMsg('system reviewer', `[REVIEW R${round}] ${cText}`);
        dialogueHistory.push({ role: 'assistant', content: cText });

        if (cText.startsWith("DECISION: APPROVED")) {
          const docRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry', candidate.interfaceName);
          await setDoc(docRef, { ...candidate, timestamp: Date.now(), approvedBy: 'System-Reviewer' });
          await addLog(`REGISTRY: ${candidate.interfaceName} integrated.`, 'success');
          break;
        }

        if (round === 3) {
          await addMsg('system', `NEGOTIATION: Process for ${candidate.interfaceName} terminated (Max rounds).`);
          break;
        }

        const gRes = await fetchWithRetry('/api/think', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             prompt: `System Reviewer's critique: "${cText}". Defend the tool's architecture or explain its necessity.`,
             customSystemInstruction: 'You are the Code Optimizer. You are defending your tool candidate with technical logic and security justifications.',
             thinkingLevel: 'off'
          })
        });
        const gData = await gRes.json();
        const gText = gData.text || "No defense provided.";
        
        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Code Optimizer', text: gText } });
        await addMsg('code optimizer', `[OPTIMIZER R${round}] ${gText}`);
        dialogueHistory.push({ role: 'user', content: `Optimizer Response: ${gText}` });
      }
    } catch (e: any) {
      await addLog(`Dialogue Error: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'DIALOGUE_END' });
      busy.current = false;
    }
  };

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || state.internalDialogue.active || !db) return;
    busy.current = true;

    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' };

      dispatch({ type: 'SET_STATUS', status: 'SCANNING', objective: 'Scanning repository for candidates...' });

      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const files = (treeData.tree || []).filter((i:any) => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));

      let selected = null;
      for (const f of files.sort(() => Math.random() - 0.5)) {
        const fileRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(f.path));
        const fileSnap = await getDoc(fileRef);
        if (!fileSnap.exists()) {
          selected = f;
          break;
        }
      }

      if (!selected) {
        dispatch({ type: 'SET_STATUS', status: 'COMPLETE', objective: 'All files processed in this repo.' });
        return;
      }

      dispatch({ type: 'SET_STATUS', status: 'ANALYZING', objective: `Reading ${selected.path}`, focusFile: selected.path });

      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      const registrySnapshot = await getDocs(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry'));
      const tools = registrySnapshot.docs.map((d) => d.id);

      const prompt = `FILE: ${selected.path}\nTOOLS AVAILABLE: ${tools.join(', ')}\nCODE:\n${content}`;
      const systemPrompt = `Optimize the code. If you find a reusable pattern, propose a tool in plugin_candidate.
JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string" } }`;

      const genRes = await fetchWithRetry('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          customSystemInstruction: systemPrompt,
          thinkingLevel: 'low'
        }),
      });
      const genData = await genRes.json();
      const resJSON = recoverJSON(genData.text);

      if (resJSON?.improved && resJSON.new_code) {
        const commitRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `[Auto-Optimizer] Evolved: ${selected.path}`,
            content: safeUtoa(resJSON.new_code),
            sha: fileJson.sha,
            branch,
          }),
        });

        if (commitRes.ok) {
          await setDoc(doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(selected.path)), {
            timestamp: Date.now(),
            insight: resJSON.insight,
          });
          await addLog(`EVOLVED: ${selected.path}`, 'success');
          dispatch({ type: 'CYCLE_COMPLETE', improved: true });
        }
      }

      if (resJSON?.plugin_candidate) {
        setTimeout(() => runNegotiation(resJSON.plugin_candidate), 1000);
      }
    } catch (e: any) {
      await addLog(`Loop Error: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Cycle finished.' });
    }
  }, [state.live, state.config, user, db, addLog]);

  useEffect(() => {
    if (state.live && user) {
      const interval = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(interval);
    }
  }, [state.live, user, evolve, state.config.cycleDelay]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const txt = userInput.trim();
    setUserInput('');
    await addMsg('user', txt);

    try {
      const conversationContext = state.chatHistory.slice(-5).map((m:any) => `${m.role === 'user' ? 'USER' : 'SYSTEM'}: ${m.text}`).join('\n\n');
      const res = await fetchWithRetry('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Conversation so far:\n${conversationContext}\n\nUSER: ${txt}`,
          customSystemInstruction: 'You are the System Reviewer. Answer questions about the system or code evolution.',
          thinkingLevel: 'off'
        }),
      });
      const data = await res.json();
      await addMsg('system reviewer', data.text || 'Reviewer is silent.');
    } catch (e) {
      await addLog('Chat Error', 'error');
    }
  };

  if (!state.booted) {
    const isInvalid = !bootInput.githubToken || !bootInput.repo;
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-zinc-500 font-mono">
        <div className="w-full max-w-sm bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-2">
            <Bot className="mx-auto text-blue-500" size={32} />
            <h1 className="text-white text-xl font-black italic tracking-tighter">CODE EVOLUTION ENGINE</h1>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">System Startup</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="GitHub PAT"
              className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50"
              value={bootInput.githubToken}
              onChange={(e) => setBootInput({ ...bootInput, githubToken: e.target.value })}
            />
            <input
              type="text"
              placeholder="Repo (owner/repo)"
              className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50"
              value={bootInput.repo}
              onChange={(e) => setBootInput({ ...bootInput, repo: e.target.value })}
            />
          </div>
          <button
            disabled={isInvalid}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
              isInvalid
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            Initiate Engine
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto pb-10">
      <header className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`relative w-3 h-3 rounded-full ${state.live ? 'bg-blue-500' : 'bg-zinc-800'}`}>
            {state.live && <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50" />}
          </div>
          <div>
            <div className="text-[11px] text-white font-black uppercase tracking-widest">{state.status}</div>
            <div className="text-[9px] text-zinc-500 truncate max-w-[200px]">{state.objective}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-xs font-black italic">Engine Active</div>
          <div className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Auto-Loop Ready</div>
        </div>
      </header>

      <button
        onClick={() => dispatch({ type: 'TOGGLE_LIVE' })}
        className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
          state.live
            ? 'bg-red-950/20 text-red-500 border border-red-500/30'
            : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'
        }`}
      >
        {state.live ? 'Terminate Autonomous Cycle' : 'Launch Autonomous Cycle'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <DiagnosticCard label="System Maturity" value={`${state.maturity.toFixed(1)}%`} icon={<Zap size={10} />} />
        <DiagnosticCard label="Registry Tools" value={state.toolCount} icon={<Database size={10} />} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto tech-scrollbar">
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
            <h2 className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" />
              Dialogue Stream
            </h2>
            {state.internalDialogue.active && (
              <span className="text-[9px] text-blue-400 font-bold animate-pulse uppercase">
                Negotiating... Round {state.internalDialogue.round}/3
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto tech-scrollbar px-1">
            {state.chatHistory.map((msg:any, i:number) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'system reviewer'
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      : msg.role === 'code optimizer'
                      ? 'bg-zinc-900/40 border border-blue-900/20 text-blue-400'
                      : 'bg-black/50 text-zinc-600 border border-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">{msg.role}</span>
                    <span className="text-[8px] opacity-30">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleChat} className="relative pt-2">
            <input
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none text-white text-[11px] focus:border-blue-600/50 pr-12"
              placeholder="Query the System Reviewer..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white"
            >
              <ChevronRight size={16} />
            </button>
          </form>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Terminal size={12} /> System Logs
          </div>
          <div className="space-y-1">
            {state.logs.map((log:any, i:number) => (
              <div key={i} className="text-[9px] flex gap-3 text-zinc-500">
                <span className="opacity-30 shrink-0 tabular-nums">
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                </span>
                <span
                  className={`truncate ${
                    log.type === 'success' ? 'text-emerald-500' : log.type === 'error' ? 'text-red-500' : ''
                  }`}
                >
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800/40 p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-blue-500">{icon}</span>
        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  );
}
