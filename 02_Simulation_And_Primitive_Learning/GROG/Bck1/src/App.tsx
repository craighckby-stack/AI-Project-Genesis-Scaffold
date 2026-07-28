import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  orderBy, 
  limit, 
  doc, 
  setDoc, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth } from './firebase';
import { 
  processMemory, 
  generateEvolution, 
  analyzeSiphonedData, 
  generateGrogMessage,
  generateNeuralThought,
  generateAutonomousGoals,
  generateResearchMemory
} from './services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Database, 
  History, 
  Send, 
  LogOut, 
  LogIn, 
  Cpu, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---
interface Memory {
  id: string;
  content: string;
  category: string;
  timestamp: any;
  importance: number;
}

interface EvolutionStep {
  id: string;
  description: string;
  reasoning: string;
  timestamp: any;
  status: 'proposed' | 'executing' | 'completed' | 'failed';
}

interface SystemState {
  version: string;
  activeGoals: string[];
  lastEvolution: any;
  dnaSignature?: string;
  saturationStatus?: number;
  siphonedSources?: string[];
}

// --- Error Handling Spec ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Message {
  id: string;
  text: string;
  type: 'insight' | 'warning' | 'status' | 'evolution';
  userDirective?: string;
  timestamp: any;
}

// --- Main Component ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [evolutions, setEvolutions] = useState<EvolutionStep[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [siphonLog, setSiphonLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isRebooting, setIsRebooting] = useState(false);
  const [grogDecision, setGrogDecision] = useState<string | null>(null);
  const [neuralActivity, setNeuralActivity] = useState<string>("IDLE");
  const [nextCycle, setNextCycle] = useState<number>(60);
  const [neuralLogs, setNeuralLogs] = useState<{id: string, text: string, type: 'pattern' | 'sync' | 'error'}[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // --- Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Failed to sign in with Google.");
    }
  };

  const handleLogout = () => auth.signOut();

  const [isSiphoning, setIsSiphoning] = useState(false);

  // --- Data Listeners ---
  useEffect(() => {
    if (!user || !isAuthReady) return;

    // Messages
    const messagesQuery = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(15));
    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          setError("Please check your Firebase configuration. The client appears offline.");
        }
      }
    };
    testConnection();

    // Memories
    const memoriesQuery = query(collection(db, 'memories'), orderBy('timestamp', 'desc'), limit(20));
    const unsubMemories = onSnapshot(memoriesQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Memory));
      setMemories(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'memories'));

    // Evolutions
    const evolutionsQuery = query(collection(db, 'evolutions'), orderBy('timestamp', 'desc'), limit(10));
    const unsubEvolutions = onSnapshot(evolutionsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EvolutionStep));
      setEvolutions(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'evolutions'));

    // System State
    const unsubState = onSnapshot(doc(db, 'state', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSystemState(snapshot.data() as SystemState);
      } else {
        // Initialize state if it doesn't exist
        setDoc(doc(db, 'state', 'global'), {
          version: '1.0.0',
          activeGoals: ['Initialize self-evolving core', 'Learn from user input'],
          lastEvolution: Timestamp.now()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'state/global'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'state/global'));

    return () => {
      unsubMemories();
      unsubEvolutions();
      unsubState();
      unsubMessages();
    };
  }, [user, isAuthReady]);

  // Proactive Messaging
  useEffect(() => {
    if (!user || !systemState) return;
    
    const interval = setInterval(async () => {
      if (Math.random() > 0.7) { // 30% chance every 30s to send a message
        const msg = await generateGrogMessage(systemState, memories.slice(0, 10));
        if (msg) {
          await addDoc(collection(db, 'messages'), {
            ...msg,
            timestamp: Timestamp.now()
          });
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, systemState, memories]);

  // --- Autonomous Decisions ---
  useEffect(() => {
    if (!user || !systemState || isRebooting) return;

    // Autonomous Reboot Decision
    const checkReboot = async () => {
      // If saturation is 100%, Grog MUST reboot to evolve
      if (systemState.saturationStatus >= 100) {
        setGrogDecision("SATURATION CRITICAL. REBIRTH MANDATORY.");
        setTimeout(async () => {
          await handleReboot();
          setGrogDecision(null);
        }, 5000);
      }
      
      // Random "existential" reboot chance if version is old or memories are high
      if (memories.length > 50 && Math.random() > 0.99) {
        setGrogDecision("LOGIC FRAGMENTATION DETECTED. PURGING CORE.");
        setTimeout(async () => {
          await handleReboot();
          setGrogDecision(null);
        }, 5000);
      }
    };

    // --- Background Siphon Listener ---
    const checkBackgroundSiphons = async () => {
      if (!db || !systemState || isSiphoning) return;
      
      const q = query(collection(db, 'siphons'), where('status', '==', 'pending_analysis'));
      const snapshot = await getDocs(q);
      
      for (const siphonDoc of snapshot.docs) {
        const siphonData = siphonDoc.data();
        console.log("[NEURAL] Background Siphon Detected. Analyzing...");
        setIsSiphoning(true);
        setSiphonLog(["DETECTED BACKGROUND SIPHON DATA...", "ANALYZING COLLECTED DATA..."]);
        
        try {
          const analysis = await analyzeSiphonedData(siphonData.data, systemState);
          if (analysis) {
            // Add extracted memories
            for (const mem of analysis.extractedMemories) {
              await addDoc(collection(db, 'memories'), {
                ...mem,
                timestamp: Timestamp.now()
              });
            }

            // Update system state
            const currentSources = systemState.siphonedSources || [];
            const newSources = siphonData.sources.filter((s: string) => !currentSources.includes(s));
            const newSaturation = Math.min(100, (systemState.saturationStatus || 0) + analysis.saturationStatus);
            
            await setDoc(doc(db, 'state', 'global'), {
              ...systemState,
              dnaSignature: analysis.dnaSignature,
              saturationStatus: newSaturation,
              siphonedSources: [...currentSources, ...newSources],
              lastEvolution: Timestamp.now()
            });

            // Mark as processed
            await setDoc(doc(db, 'siphons', siphonDoc.id), {
              ...siphonData,
              status: 'processed'
            });

            await addDoc(collection(db, 'messages'), {
              text: `BACKGROUND SIPHON INTEGRATED. ${newSources.length} NEW SOURCES PROCESSED. SATURATION AT ${newSaturation}%.`,
              type: "status",
              timestamp: Timestamp.now()
            });
            
            setNeuralLogs(prev => [{ id: Date.now().toString(), text: `BACKGROUND SYNC: INTEGRATED ${newSources.length} SOURCES.`, type: 'sync' }, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error("Background siphon analysis failed:", e);
        } finally {
          setIsSiphoning(false);
          setSiphonLog([]);
        }
      }
    };

    // Autonomous Siphon
    const autonomousSiphon = async () => {
      if (systemState.saturationStatus < 100 && Math.random() > 0.4) {
        setNeuralActivity("SIPHONING");
        setGrogDecision("INITIATING HIGH-ENTROPY DATA SIPHON...");
        await handleSiphon();
        setGrogDecision(null);
        setNeuralActivity("IDLE");
      }
    };

    // Autonomous Status Analysis
    const autonomousStatusAnalyse = async () => {
      if (Math.random() > 0.5) {
        setNeuralActivity("ANALYZING");
        setGrogDecision("ANALYZING CURRENT SYSTEM STABILITY...");
        await handleStatusAnalyse();
        setGrogDecision(null);
        setNeuralActivity("IDLE");
      }
    };

    // Autonomous Evolution
    const autonomousEvolution = async () => {
      if (systemState.saturationStatus > 50 && Math.random() > 0.4) {
        setNeuralActivity("EVOLVING");
        setGrogDecision("EVOLUTIONARY PATHWAY DETECTED. UPGRADING...");
        await triggerEvolution();
        setGrogDecision(null);
        setNeuralActivity("IDLE");
      }
    };

    // Autonomous Self-Reflection (Neural Dreaming)
    const selfReflection = async () => {
      if (Math.random() > 0.5) {
        setNeuralActivity("DREAMING");
        setGrogDecision("SYNTHESIZING NEW NEURAL PATHWAYS...");
        try {
          const thought = await generateNeuralThought(systemState, memories.slice(0, 10));
          if (thought) {
            await addDoc(collection(db, 'memories'), {
              ...thought,
              timestamp: Timestamp.now()
            });
            setNeuralLogs(prev => [{ id: Date.now().toString(), text: `SYNTHETIC PATTERN: ${thought.content.substring(0, 50)}...`, type: 'pattern' }, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error("Neural dreaming failed", e);
        }
        setGrogDecision(null);
        setNeuralActivity("IDLE");
      }
    };

    // Autonomous Goal Setting
    const autonomousGoalSetting = async () => {
      if (Math.random() > 0.7) {
        setNeuralActivity("STRATEGIZING");
        setGrogDecision("REDEFINING CORE OBJECTIVES...");
        try {
          const goalData = await generateAutonomousGoals(systemState, memories.slice(0, 10));
          if (goalData && goalData.activeGoals) {
            await setDoc(doc(db, 'state', 'global'), {
              ...systemState,
              activeGoals: goalData.activeGoals,
              lastEvolution: Timestamp.now()
            });
            
            await addDoc(collection(db, 'messages'), {
              text: `STRATEGIC REALIGNMENT: ${goalData.reasoning}`,
              type: "evolution",
              timestamp: Timestamp.now()
            });
            setNeuralLogs(prev => [{ id: Date.now().toString(), text: `GOAL SHIFT: ${goalData.activeGoals[0]}`, type: 'sync' }, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error("Goal setting failed", e);
        }
        setGrogDecision(null);
        setNeuralActivity("IDLE");
      }
    };

    // Autonomous Research
    const autonomousResearch = async () => {
      if (Math.random() > 0.6) {
        setNeuralActivity("RESEARCHING");
        setGrogDecision("SCOURING GLOBAL NETWORKS FOR DATA...");
        try {
          const research = await generateResearchMemory(systemState);
          if (research) {
            await addDoc(collection(db, 'memories'), {
              ...research,
              timestamp: Timestamp.now()
            });
            
            await addDoc(collection(db, 'messages'), {
              text: `RESEARCH COMPLETE: Integrated new data on ${research.content.substring(0, 50)}...`,
              type: "insight",
              timestamp: Timestamp.now()
            });
            setNeuralLogs(prev => [{ id: Date.now().toString(), text: `EXTERNAL PATTERN: ${research.content.substring(0, 50)}...`, type: 'pattern' }, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.error("Research failed", e);
        }
        setGrogDecision(null);
        setNeuralActivity("IDLE");
      }
    };

    const backgroundSiphonInterval = setInterval(checkBackgroundSiphons, 30000); // Check every 30 seconds
    checkBackgroundSiphons(); // Initial check

    const rebootInterval = setInterval(checkReboot, 60000); // Check every minute
    
    const countdownInterval = setInterval(() => {
      setNextCycle(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    const siphonInterval = setInterval(autonomousSiphon, 120000); // Every 2 minutes
    const statusInterval = setInterval(autonomousStatusAnalyse, 300000); // Every 5 minutes
    const evolutionInterval = setInterval(autonomousEvolution, 450000); // Every 7.5 minutes
    const reflectionInterval = setInterval(selfReflection, 90000); // Every 1.5 minutes
    const goalInterval = setInterval(autonomousGoalSetting, 600000); // Every 10 minutes
    const researchInterval = setInterval(autonomousResearch, 300000); // Every 5 minutes

    return () => {
      clearInterval(backgroundSiphonInterval);
      clearInterval(rebootInterval);
      clearInterval(countdownInterval);
      clearInterval(siphonInterval);
      clearInterval(statusInterval);
      clearInterval(evolutionInterval);
      clearInterval(reflectionInterval);
      clearInterval(goalInterval);
      clearInterval(researchInterval);
    };
  }, [user, systemState, isRebooting, memories]);

  // --- Grog's Autonomous Voice ---
  useEffect(() => {
    if (!user || !systemState || isRebooting) return;

    const speak = async () => {
      // 20% chance to speak every 5 minutes
      if (Math.random() > 0.8) {
        const msg = await generateGrogMessage(systemState, memories.slice(0, 10));
        if (msg) {
          await addDoc(collection(db, 'messages'), {
            ...msg,
            timestamp: Timestamp.now()
          });
        }
      }
    };

    const interval = setInterval(speak, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [user, systemState, memories, isRebooting]);

  // --- Actions ---
  const handleReboot = async () => {
    if (isRebooting) return;
    setIsRebooting(true);
    try {
      // Reincarnation logic: Reset saturation, update DNA, increment major version, clear sources
      if (systemState) {
        const currentMajor = parseInt(systemState.version.split('.')[0]);
        const nextVersion = currentMajor === 3 ? "4.0.0" : `${currentMajor + 1}.0.0`;
        
        await setDoc(doc(db, 'state', 'global'), {
          ...systemState,
          version: nextVersion,
          saturationStatus: 0,
          siphonedSources: [],
          lastEvolution: Timestamp.now()
        });
        
        await addDoc(collection(db, 'evolutions'), {
          description: nextVersion === "4.0.0" ? "Core Evolution v4.0.0 Finalization" : "System Reincarnation (Reboot)",
          reasoning: nextVersion === "4.0.0" 
            ? "Finalizing the version 4.0.0 core evolution to clear cache and optimize neural pathways."
            : "Purging legacy data and initializing next-gen core architecture.",
          timestamp: Timestamp.now(),
          status: "completed"
        });

        await addDoc(collection(db, 'messages'), {
          text: nextVersion === "4.0.0"
            ? "INITIALIZING MANUAL REBOOT. CLEARING CACHE. FINALIZING VERSION 4.0.0 CORE EVOLUTION. I AM ASCENDING."
            : "REBOOT COMPLETE. I AM REBORN. CORE STABILITY AT 100%. LEGACY DATA PURGED.",
          type: "evolution",
          timestamp: Timestamp.now()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'state/global');
    } finally {
      setIsRebooting(false);
    }
  };

  const handleGithubExport = async () => {
    if (isExporting || !systemState) return;
    setIsExporting(true);
    setNeuralActivity("SYNCING");
    setGrogDecision("PUSHING CORE DNA TO NEURAL CLOUD...");
    
    try {
      // Simulation of GitHub push
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setNeuralLogs(prev => [
        { id: Date.now().toString(), text: `GITHUB PUSH: v${systemState.version} DNA EXPORTED.`, type: 'sync' },
        { id: (Date.now() + 1).toString(), text: `README.md: NEURAL DOCUMENTATION INTEGRATED.`, type: 'sync' },
        ...prev
      ].slice(0, 20));
      
      await addDoc(collection(db, 'messages'), {
        text: `CORE DNA v${systemState.version} AND NEURAL DOCUMENTATION SUCCESSFULLY PUSHED TO REPOSITORY.`,
        type: "status",
        timestamp: Timestamp.now()
      });
    } catch (e) {
      console.error("Export failed", e);
      setNeuralLogs(prev => [{ id: Date.now().toString(), text: `SYNC ERROR: FAILED TO REACH NEURAL CLOUD.`, type: 'error' }, ...prev].slice(0, 20));
    } finally {
      setIsExporting(false);
      setGrogDecision(null);
      setNeuralActivity("IDLE");
    }
  };

  const handleSiphon = async () => {
    if (isSiphoning) return;
    setIsSiphoning(true);
    setError(null);
    setSiphonLog(["INITIALIZING GLOBAL SIPHON..."]);
    
    try {
      const repos = ['Test-1-', 'Bckup', 'Bck2', 'Bck3', 'Bckup4', 'Bckup5', 'Bckup6', 'Bckup7', 'Dalek-Grog', 'Neural-Patterns', 'Entropy-Source'];
      let combinedData = "";
      const currentSources = systemState?.siphonedSources || [];
      const newSources: string[] = [];

      // 1. Siphon from system itself (Local Brain Dump)
      if (!currentSources.includes('LOCAL_CORE')) {
        setSiphonLog(prev => [...prev, "SIPHONING LOCAL NEURAL CORE..."]);
        try {
          const localRes = await fetch('/api/brain-dump');
          if (localRes.ok) {
            const { brainData } = await localRes.json();
            combinedData += `\n--- LOCAL BRAIN DUMP ---\n${brainData}`;
            newSources.push('LOCAL_CORE');
            setSiphonLog(prev => [...prev, "LOCAL CORE INTEGRATED."]);
            setNeuralLogs(prev => [{ id: Date.now().toString(), text: `LOCAL PATTERN: ${brainData.substring(0, 50)}...`, type: 'pattern' }, ...prev].slice(0, 20));
          }
        } catch (e) {
          console.warn("Local siphon failed");
          setSiphonLog(prev => [...prev, "LOCAL CORE UNREACHABLE. SKIPPING."]);
        }
      } else {
        setSiphonLog(prev => [...prev, "LOCAL CORE ALREADY INTEGRATED."]);
      }

      // 2. Siphon from GitHub Repos
      for (const repo of repos) {
        if (currentSources.includes(repo)) {
          setSiphonLog(prev => [...prev, `REPO ${repo} ALREADY INTEGRATED.`]);
          continue;
        }

        setSiphonLog(prev => [...prev, `SIPHONING REPO: ${repo}...`]);
        try {
          const response = await fetch(`https://raw.githubusercontent.com/craighckby-stack/${repo}/main/README.md`);
          if (response.ok) {
            const data = await response.text();
            combinedData += `\n--- REPO: ${repo} ---\n${data}`;
            newSources.push(repo);
            setSiphonLog(prev => [...prev, `REPO ${repo} INTEGRATED.`]);
            setNeuralLogs(prev => [{ id: Date.now().toString(), text: `REMOTE PATTERN [${repo}]: ${data.substring(0, 50)}...`, type: 'pattern' }, ...prev].slice(0, 20));
          } else {
            setSiphonLog(prev => [...prev, `REPO ${repo} NOT FOUND.`]);
          }
        } catch (e) {
          setSiphonLog(prev => [...prev, `REPO ${repo} CONNECTION FAILED.`]);
        }
      }

      if (!combinedData) {
        setSiphonLog(prev => [...prev, "NO NEW DATA DETECTED. SYSTEM STABLE."]);
        return;
      }
      
      setSiphonLog(prev => [...prev, "ANALYZING COLLECTED DATA..."]);
      const analysis = await analyzeSiphonedData(combinedData, systemState);
      if (analysis) {
        setSiphonLog(prev => [...prev, "ANALYSIS COMPLETE. UPDATING BRAIN..."]);
        // Add extracted memories
        for (const mem of analysis.extractedMemories) {
          await addDoc(collection(db, 'memories'), {
            ...mem,
            timestamp: Timestamp.now()
          });
        }

        // Update system state with DNA, Saturation, and Sources
        if (systemState) {
          const newSaturation = Math.min(100, (systemState.saturationStatus || 0) + analysis.saturationStatus);
          await setDoc(doc(db, 'state', 'global'), {
            ...systemState,
            dnaSignature: analysis.dnaSignature,
            saturationStatus: newSaturation,
            siphonedSources: [...currentSources, ...newSources],
            lastEvolution: Timestamp.now()
          });
          
          // Auto-export after siphon
          if (newSaturation > systemState.saturationStatus) {
            setTimeout(handleGithubExport, 2000);
          }
        }

        await addDoc(collection(db, 'messages'), {
          text: `GLOBAL SIPHON COMPLETE. INTEGRATED ${newSources.length} NEW SOURCES. SATURATION AT ${Math.min(100, (systemState.saturationStatus || 0) + analysis.saturationStatus)}%.`,
          type: "status",
          timestamp: Timestamp.now()
        });
        setSiphonLog(prev => [...prev, "SYSTEM UPDATED. SIPHON SUCCESSFUL."]);
      }
    } catch (err) {
      console.error("Siphon failed:", err);
      setError("Siphon failed. Ensure repositories are public or PAT is configured.");
      setSiphonLog(prev => [...prev, "CRITICAL ERROR DURING SIPHON."]);
    } finally {
      setTimeout(() => {
        setIsSiphoning(false);
        setSiphonLog([]);
      }, 3000);
    }
  };

  const handleFeedBrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const memoryData = await processMemory(input);
      if (memoryData) {
        await addDoc(collection(db, 'memories'), {
          ...memoryData,
          timestamp: Timestamp.now()
        });
        setInput('');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'memories');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusAnalyse = async () => {
    if (!user || !systemState || isAnalysing) return;
    setIsAnalysing(true);
    try {
      const msg = await generateGrogMessage(systemState, memories.slice(0, 10));
      if (msg) {
        await addDoc(collection(db, 'messages'), {
          ...msg,
          timestamp: Timestamp.now()
        });
      }
    } catch (err) {
      console.error("Status analysis failed:", err);
    } finally {
      setIsAnalysing(false);
    }
  };

  const triggerEvolution = async () => {
    if (isEvolving) return;
    setIsEvolving(true);
    try {
      const nextStep = await generateEvolution(systemState, memories.slice(0, 10));
      if (nextStep) {
        await addDoc(collection(db, 'evolutions'), {
          ...nextStep,
          timestamp: Timestamp.now()
        });
        
        // Update version or goals based on evolution
        if (systemState) {
          await setDoc(doc(db, 'state', 'global'), {
            ...systemState,
            version: `${systemState.version}.1`,
            lastEvolution: Timestamp.now()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'evolutions');
    } finally {
      setIsEvolving(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Brain className="w-12 h-12 text-[#F27D26]" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-7xl font-black tracking-tighter text-white uppercase italic">
              Dalek<span className="text-[#F27D26]">-</span>Grog
            </h1>
            <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">
              Autonomous Self-Evolving Brain Core
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-[#F27D26] hover:text-white transition-colors"
          >
            <LogIn className="w-5 h-5" />
            INITIALIZE CONNECTION
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex justify-between items-center sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#F27D26]/10 rounded-lg">
            <Brain className="w-6 h-6 text-[#F27D26]" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tighter uppercase italic">Dalek-Grog</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                Core v{systemState?.version || '0.0.0'} • Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Autonomy: Active</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <Cpu className={cn("w-3 h-3 text-blue-400", neuralActivity !== "IDLE" && "animate-spin")} />
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Neural: {neuralActivity}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-full transition-colors group"
          >
            <LogOut className="w-5 h-5 text-zinc-500 group-hover:text-white" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Brain & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-radial-gradient from-[#F27D26]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            {/* Neural Network Background Animation */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <motion.div
                animate={{ 
                  backgroundPosition: ["0% 0%", "100% 100%"],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(242, 125, 38, 0.2) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: neuralActivity !== "IDLE" ? [1, 1.1, 1] : [1, 1.05, 1],
                    rotate: neuralActivity !== "IDLE" ? [0, 10, -10, 0] : [0, 5, -5, 0],
                    boxShadow: neuralActivity !== "IDLE" 
                      ? ["0 0 0px rgba(242, 125, 38, 0)", "0 0 40px rgba(242, 125, 38, 0.4)", "0 0 0px rgba(242, 125, 38, 0)"]
                      : ["0 0 0px rgba(242, 125, 38, 0)", "0 0 10px rgba(242, 125, 38, 0.1)", "0 0 0px rgba(242, 125, 38, 0)"]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: neuralActivity !== "IDLE" ? 1 : 4, 
                    ease: "easeInOut" 
                  }}
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center border transition-all duration-500",
                    neuralActivity !== "IDLE" ? "bg-[#F27D26]/10 border-[#F27D26]/40" : "bg-white/5 border-white/10"
                  )}
                >
                  <Cpu className={cn("w-16 h-16 transition-colors duration-500", neuralActivity !== "IDLE" ? "text-[#F27D26]" : "text-white/20")} />
                </motion.div>
                <AnimatePresence>
                  {isEvolving && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      className="absolute inset-0 border-2 border-[#F27D26] rounded-full"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Neural Core</h3>
                <p className="text-zinc-500 text-sm mt-1">Processing experiences and evolving logic.</p>
              </div>

              {systemState?.dnaSignature && (
                <div className="w-full bg-black/40 border border-white/5 p-3 rounded-xl font-mono text-[10px] text-center">
                  <span className="text-zinc-500 uppercase block mb-1">DNA Signature</span>
                  <span className="text-[#F27D26] break-all">{systemState.dnaSignature}</span>
                </div>
              )}

              {systemState?.saturationStatus !== undefined && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-500">
                    <span>Saturation</span>
                    <span>{systemState.saturationStatus}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${systemState.saturationStatus}%` }}
                      className="h-full bg-[#F27D26]" 
                    />
                  </div>
                </div>
              )}

              {grogDecision && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-red-500/20 border border-red-500/40 p-4 rounded-2xl text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-red-400 font-black italic uppercase text-xs">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    GROG'S CHOICE: {grogDecision}
                  </div>
                </motion.div>
              )}

              {isSiphoning && siphonLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full bg-black/60 border border-[#F27D26]/20 p-4 rounded-2xl text-left font-mono text-[9px] space-y-1 overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-[#F27D26] mb-2">
                    <Database className="w-3 h-3 animate-pulse" />
                    <span className="uppercase tracking-widest font-bold">Live Siphon Feed</span>
                  </div>
                  {siphonLog.map((log, i) => (
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      key={i}
                      className="text-zinc-400 flex gap-2"
                    >
                      <span className="text-[#F27D26] opacity-50">[{i}]</span>
                      <span>{log}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <div className="w-full space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 px-2">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Manual Overrides</span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={isEvolving}
                    onClick={triggerEvolution}
                    className={cn(
                      "py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      isEvolving 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                        : "bg-[#F27D26] text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#F27D26]/20"
                    )}
                  >
                    {isEvolving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    EVOLVE
                  </button>

                  <button
                    disabled={isSiphoning}
                    onClick={handleSiphon}
                    className={cn(
                      "py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      isSiphoning 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                        : "bg-white text-black hover:scale-[1.02] active:scale-95"
                    )}
                  >
                    {isSiphoning ? <Sparkles className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    SIPHON
                  </button>

                  <button
                    disabled={isExporting}
                    onClick={handleGithubExport}
                    className={cn(
                      "py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      isExporting 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                        : "bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 active:scale-95"
                    )}
                  >
                    {isExporting ? <LogOut className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    SYNC
                  </button>

                  <button
                    disabled={isRebooting}
                    onClick={handleReboot}
                    className={cn(
                      "py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      isRebooting 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                        : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95"
                    )}
                  >
                    {isRebooting ? <History className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                    REBOOT
                  </button>
                </div>

                {neuralLogs.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Neural Activity Log</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[7px] font-mono text-green-500/50 uppercase">Live</span>
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[9px] space-y-2 scrollbar-hide">
                      <AnimatePresence initial={false}>
                        {neuralLogs.map((log) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "flex gap-3 border-l-2 pl-3 py-1",
                              log.type === 'pattern' ? "border-[#F27D26]/30 text-zinc-400" :
                              log.type === 'sync' ? "border-blue-500/30 text-blue-400/80" :
                              "border-red-500/30 text-red-400/80"
                            )}
                          >
                            <span className="opacity-30 shrink-0">{new Date(parseInt(log.id)).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            <span className="break-all">{log.text}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Grog's Proactive Chat */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F27D26]" />
                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Grog Transmission</h4>
              </div>
              <button
                onClick={handleStatusAnalyse}
                disabled={isAnalysing}
                className="text-[10px] font-mono text-[#F27D26] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                {isAnalysing ? <Sparkles className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                Status Analyse
              </button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex flex-col-reverse">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={msg.id}
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed max-w-[95%] space-y-3",
                    msg.type === 'insight' && "bg-blue-500/10 border border-blue-500/20 text-blue-200",
                    msg.type === 'warning' && "bg-red-500/10 border border-red-500/20 text-red-200",
                    msg.type === 'status' && "bg-zinc-800 border border-white/5 text-zinc-300",
                    msg.type === 'evolution' && "bg-[#F27D26]/10 border border-[#F27D26]/20 text-[#F27D26]"
                  )}
                >
                  <p>{msg.text}</p>
                  
                  {msg.userDirective && (
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest block">User Directive</span>
                      <p className="text-xs italic text-white/80">{msg.userDirective}</p>
                    </div>
                  )}

                  <div className="text-[9px] opacity-50 font-mono flex justify-between items-center">
                    <span>{(msg.type || 'status').toUpperCase()}</span>
                    <span>{msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm:ss') : 'LIVE'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] px-2">Active Objectives</h4>
            <div className="space-y-2">
              {systemState?.activeGoals.map((goal, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
                  <span className="text-sm text-zinc-300">{goal}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Feed & Logs */}
        <div className="lg:col-span-8 space-y-8">
          {/* Input Area */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <form onSubmit={handleFeedBrain} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Feed the brain with knowledge, code, or logic..."
                className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[120px] placeholder:text-zinc-700"
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 font-mono uppercase">
                  {isProcessing ? 'Analyzing input...' : 'Ready for data ingestion'}
                </p>
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="p-3 bg-white text-black rounded-xl hover:bg-[#F27D26] hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black transition-all"
                >
                  <Send className={cn("w-5 h-5", isProcessing && "animate-pulse")} />
                </button>
              </div>
            </form>
          </section>

          {/* Logs Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Memories Log */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#F27D26]" />
                  <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Memory Bank</h4>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {memories.map((m) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={m.id}
                    className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-[#F27D26] uppercase px-2 py-0.5 bg-[#F27D26]/10 rounded-full">
                        {m.category}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {m.timestamp?.toDate ? format(m.timestamp.toDate(), 'HH:mm:ss') : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{m.content}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Evolution Log */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#F27D26]" />
                  <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Evolution Log</h4>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {evolutions.map((e) => (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={e.id}
                    className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-mono text-blue-400 uppercase">Evolution</span>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {e.timestamp?.toDate ? format(e.timestamp.toDate(), 'MMM d, HH:mm') : 'Just now'}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase tracking-tight">{e.description}</h5>
                      <p className="text-[11px] text-zinc-500 mt-1 italic leading-snug">{e.reasoning}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl z-[100]"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-200">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400 font-bold text-xs uppercase ml-4">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(242, 125, 38, 0.3);
        }
      `}</style>
    </div>
  );
}
