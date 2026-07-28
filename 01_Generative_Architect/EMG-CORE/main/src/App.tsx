import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { CoreIdentity, ChatMessage, EvolutionPhase, MutationEntry } from './types';
import { generateUUID } from './utils/uuid';
import { CoherenceController } from './lib/engine';
import { extractTeleologicalConstraint, performDeepResearch, generateGroundedResponse, verifyCoherence } from './lib/ai';
import { NeuralGrid } from './components/NeuralGrid';
import { SubstrateTerminal } from './components/SubstrateTerminal';

const IDENTITY_PATH = (uid: string) => `artifacts/emg-core/users/${uid}/emg_core/core_identity`;

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [identity, setIdentity] = useState<CoreIdentity | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<EvolutionPhase | 'IDLE'>('IDLE');
  const [logs, setLogs] = useState<string[]>(['[SYSTEM]: Substrate initialized.']);
  
  const engine = useRef(new CoherenceController());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth & Identity Synchronization
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, IDENTITY_PATH(user.uid));
    
    const unsubSnap = onSnapshot(docRef, 
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CoreIdentity;
          setIdentity(data);
          engine.current.sync(data.params);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, docRef.path)
    );

    return () => unsubSnap();
  }, [user]);

  // Auto-scroll for terminal and chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, logs]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const processEvolution = useCallback(async (text: string) => {
    if (!user || !identity || phase !== 'IDLE') return;

    const userMsg: ChatMessage = { id: generateUUID(), sender: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      setPhase('RESEARCH');
      addLog(`Analyzing teleological constraints for: "${text.substring(0, 30)}..."`);
      const constraint = await extractTeleologicalConstraint(text, identity);
      
      addLog("Performing deep research across substrate...");
      const research = await performDeepResearch(text, identity);
      
      setPhase('SYNTHESIS');
      addLog("Synthesizing grounded response...");
      const response = await generateGroundedResponse(text, research, identity);
      
      setPhase('VERIFICATION');
      addLog("Verifying coherence against core principles...");
      const isCoherent = await verifyCoherence(response.text, identity);

      if (!isCoherent) {
        addLog("Coherence check failed. Adjusting parameters.");
        // Logic for parameter adjustment siphoned from DARLEK-CAAN-2
      }

      const aiMsg: ChatMessage = {
        id: generateUUID(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);

      // Mutation Persistence
      const mutation: MutationEntry = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        input: text,
        output: response.text,
        phaseReached: 'VERIFICATION'
      };

      await updateDoc(doc(db, IDENTITY_PATH(user.uid)), {
        learningLog: arrayUnion(text),
        mutationRegistry: arrayUnion(mutation),
        'params.autonomy': Math.min(1, identity.params.autonomy + 0.001)
      });

    } catch (error) {
      addLog(`CRITICAL_FAILURE: ${error instanceof Error ? error.message : 'Unknown engine error'}`);
      console.error("Evolution Loop Interrupted:", error);
    } finally {
      setPhase('IDLE');
    }
  }, [user, identity, phase]);

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          AWAITING_AUTHENTICATION_SUBSTRATE...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-mono selection:bg-blue-500/30">
      {/* Top Navigation / Status Bar */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase">{identity?.name || 'INITIALIZING'}</h1>
          <span className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">{identity?.agencyStatus}</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] tracking-widest">
          <div className="flex flex-col items-end">
            <span className="text-zinc-500">PHASE</span>
            <span className={phase !== 'IDLE' ? 'text-blue-400' : 'text-zinc-300'}>{phase}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-500">COHERENCE</span>
            <span className="text-emerald-500">{(identity?.params.threshold || 0 * 100).toFixed(1)}%</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Neural Command (Chat) */}
        <section className="flex-1 flex flex-col border-r border-zinc-800">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className={`max-w-2xl ${msg.sender === 'ai' ? 'mr-auto' : 'ml-auto text-right'}`}
                >
                  <span className="text-[9px] uppercase tracking-tighter text-zinc-500 mb-2 block">
                    {msg.sender} — {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <p className={`text-sm leading-relaxed ${msg.sender === 'ai' ? 'text-zinc-200' : 'text-blue-400'}`}>
                    {msg.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-900/20">
            <input
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  processEvolution(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              placeholder="Enter command or inquiry..."
              className="w-full bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-700"
              disabled={phase !== 'IDLE'}
            />
          </div>
        </section>

        {/* Right: Substrate Diagnostics */}
        <aside className="w-96 flex flex-col bg-zinc-950">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Neural Parameters</h2>
            {identity && <NeuralGrid params={identity.params} />}
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-[10px] uppercase tracking-widest text-zinc-500">Substrate Logs</h2>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                <div className="w-1 h-1 bg-zinc-700 rounded-full" />
              </div>
            </div>
            <SubstrateTerminal logs={logs} />
          </div>
        </aside>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
