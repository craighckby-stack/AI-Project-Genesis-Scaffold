import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { LatticeVisualizer } from "./components/LatticeVisualizer";
import { PersonaSelector } from "./components/PersonaSelector";
import { ChatSection } from "./components/ChatSection";
import { Persona, Perspective, Session, Message, Stats, Attachment } from "./types";
import { initializeFirebase, getDb, getAuthClient } from "./lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { Activity, Sparkles, AlertCircle } from "lucide-react";

// Static data defined exactly per user's specifications
const PERSONAS: Persona[] = [
  {
    id: "persona_1",
    name: "Analytical Mathematician",
    description: "Specialist in number theory, complex analysis, and Riemann zeta functions. Demands rigorous proof formulations.",
    icon: "Calculator",
    specialty: "Complex Analysis",
    background: "Doctorate in Analytic Number Theory from Göttingen."
  },
  {
    id: "persona_2",
    name: "Theoretical Physicist",
    description: "Expert in quantum mechanics, statistical mechanics, and operator theory. Investigates the Hilbert-Pólya spectral operator.",
    icon: "Atom",
    specialty: "Quantum Chaos",
    background: "Specialized in random matrix eigenvalue correlations at IAS Princeton."
  },
  {
    id: "persona_3",
    name: "Pure Mathematician",
    description: "Expert in algebraic geometry and commutative algebra. Probes zero-distribution schemes and absolute geometries.",
    icon: "Grid",
    specialty: "Algebraic Geometry",
    background: "Leader in arithmetic algebraic schemes at IHES Paris."
  },
  {
    id: "persona_4",
    name: "Computational Scientist",
    description: "Expert in statistical modeling, high-performance algorithm design, and big data heuristics. Probes structural patterns.",
    icon: "Cpu",
    specialty: "High-Performance Computing",
    background: "Director of numeric math computations at ETH Zürich."
  },
  {
    id: "persona_5",
    name: "Systems Architect",
    description: "Expert in scalable distributed platforms, database clustering, and stateful synchronization protocols. Optimizes system latency.",
    icon: "Database",
    specialty: "Infrastructure Design",
    background: "Technical Fellow in global distributed consensus topologies."
  },
  {
    id: "persona_6",
    name: "Category Theorist",
    description: "Expert in higher-category theory, sheaves, and spectral sequences. Seeks functorial symmetries mapping L-functions.",
    icon: "Network",
    specialty: "Homotopy Theory",
    background: "Distinguished researcher in arithmetic functor categories."
  }
];

const PERSPECTIVES: Perspective[] = [
  {
    id: "perspective_1",
    name: "Analytic Number Theory",
    description: "Examines critical-line zero bounds via density theorems, prime number distribution estimates, and smooth weights.",
    philosophy: "Traditional rigor focusing on absolute analytic bounds."
  },
  {
    id: "perspective_2",
    name: "Spectral / Physics",
    description: "Links zeta zeros to self-adjoint operators, quantum chaos, and eigenvalue spacings of Hermitains.",
    philosophy: "Physical manifestation of mathematical spectra."
  },
  {
    id: "perspective_3",
    name: "Algebraic Geometry",
    description: "Maps Weil Conjectures onto rational numbers, seeking absolute fields and geometric intersection schemes.",
    philosophy: "Abstract geometry over the arithmetic domain."
  },
  {
    id: "perspective_4",
    name: "Probability / Statistical",
    description: "Models non-trivial zeros using GUE ensembles, central limit laws, and Gaussian fluctuations.",
    philosophy: "Statistical mechanics as a zero-approximation tool."
  },
  {
    id: "perspective_5",
    name: "Computational / Experimental",
    description: "Validates structures numerically, executing algorithmic zero verification and asymptotic heuristic checks.",
    philosophy: "Experimental validation of infinite theorems."
  },
  {
    id: "perspective_6",
    name: "Functional Analysis",
    description: "Analyzes operator actions on Hilbert-Banach spaces, mapping translation-invariant subspaces to zeros.",
    philosophy: "Global linear operator formulations."
  },
  {
    id: "perspective_7",
    name: "Information Theory",
    description: "Formulates prime distribution through coding theory, minimizing entropic description lengths.",
    philosophy: "Prime patterns as maximal entropy encoders."
  },
  {
    id: "perspective_8",
    name: "Category / Structural",
    description: "Unifies L-function families under absolute functor categories, seeking deep geometric symmetries.",
    philosophy: "Absolute structural morphism mappings."
  }
];

const DEFAULT_STATS: Stats = {
  totalQueries: 0,
  meanLatency: 0,
  rigorPct: 50
};

export default function App() {
  const [firebaseStatus, setFirebaseStatus] = useState<"loading" | "connected" | "fallback">("loading");
  const [userId, setUserId] = useState<string>("local_user");
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Selector configs
  const [activePersonaIds, setActivePersonaIds] = useState<string[]>(["persona_1", "persona_2", "persona_6"]);
  const [activePerspectiveIds, setActivePerspectiveIds] = useState<string[]>(["perspective_1", "perspective_2", "perspective_8"]);
  const [formality, setFormality] = useState<number>(65);
  const [technicality, setTechnicality] = useState<number>(75);
  const [rigor, setRigor] = useState<number>(80);

  // Statistics
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  // Initialize Firebase and Auth
  useEffect(() => {
    async function setup() {
      try {
        const res = await fetch("/api/firebase-config");
        if (res.ok) {
          const config = await res.json();
          await initializeFirebase(config);
          
          const auth = getAuthClient();
          if (auth && auth.currentUser) {
            setUserId(auth.currentUser.uid);
            setFirebaseStatus("connected");
          } else {
            setFirebaseStatus("fallback");
          }
        } else {
          setFirebaseStatus("fallback");
        }
      } catch (err) {
        console.warn("Could not connect to Firebase, running in Local storage fallback mode.", err);
        setFirebaseStatus("fallback");
      }
    }
    setup();
  }, []);

  // Sync state stats when queries count changes
  useEffect(() => {
    const activeCount = activePersonaIds.length;
    const entropy = activeCount > 0 ? Math.log2(activeCount + 1) * (rigor / 100) : 0;
    // Landauer's Principle at Room Temp ≈ k_B T ln(2) = 2.87e-21 Joules per bit reset. Let's make a beautiful projection.
    const landauer = stats.totalQueries * 2.87e-21 * (technicality + rigor + 1);

    setStats(prev => ({
      ...prev,
      rigorPct: rigor,
      entropyReduction: entropy,
      landauerLoss: landauer
    }));
  }, [stats.totalQueries, activePersonaIds.length, rigor, technicality]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        if (!db) return;
        const querySnapshot = await getDocs(collection(db, "sessions"));
        const list: Session[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId === userId) {
            list.push(data as Session);
          }
        });
        
        const sorted = list.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setSessions(sorted);
        if (sorted.length > 0) {
          setActiveSessionId(sorted[0].id);
        } else {
          createNewSession();
        }
      } catch (error) {
        console.error("Firestore sessions load error:", error);
        loadLocalSessions();
      }
    } else if (firebaseStatus === "fallback") {
      loadLocalSessions();
    }
  }, [firebaseStatus, userId]);

  // Fallback local sessions loading
  const loadLocalSessions = () => {
    try {
      const stored = localStorage.getItem("prism_sessions");
      if (stored) {
        const list = JSON.parse(stored) as Session[];
        const sorted = list.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setSessions(sorted);
        if (sorted.length > 0) {
          setActiveSessionId(sorted[0].id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (e) {
      console.error(e);
      createNewSession();
    }
  };

  useEffect(() => {
    if (firebaseStatus !== "loading") {
      loadSessions();
    }
  }, [firebaseStatus, loadSessions]);

  // Load Messages whenever active session changes
  const loadMessages = useCallback(async (sessionId: string) => {
    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        if (!db) return;
        const querySnapshot = await getDocs(collection(db, "messages"));
        const list: Message[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.sessionId === sessionId) {
            list.push(data as Message);
          }
        });
        const sorted = list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(sorted);
      } catch (error) {
        console.error("Firestore messages load error:", error);
        loadLocalMessages(sessionId);
      }
    } else if (firebaseStatus === "fallback") {
      loadLocalMessages(sessionId);
    }
  }, [firebaseStatus]);

  const loadLocalMessages = (sessionId: string) => {
    try {
      const stored = localStorage.getItem(`prism_messages_${sessionId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      // Find corresponding session and load its configuration
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) {
        setActivePersonaIds(session.activePersonaIds);
        setActivePerspectiveIds(session.activePerspectiveIds);
        setFormality(session.formality);
        setTechnicality(session.technicality);
        setRigor(session.rigor);
      }
      loadMessages(activeSessionId);
    }
  }, [activeSessionId, sessions, loadMessages]);

  // Create new session
  const createNewSession = async () => {
    const id = "session_" + Date.now();
    const newSession: Session = {
      id,
      title: "New Synthesis State",
      activePersonaIds: ["persona_1", "persona_2", "persona_6"],
      activePerspectiveIds: ["perspective_1", "perspective_2", "perspective_8"],
      createdTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      formality: 65,
      technicality: 75,
      rigor: 80
    };

    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        if (db) {
          await setDoc(doc(db, "sessions", id), { ...newSession, userId });
        }
      } catch (e) {
        console.error(e);
      }
    }

    const updated = [newSession, ...sessions];
    setSessions(updated);
    if (firebaseStatus === "fallback") {
      localStorage.setItem("prism_sessions", JSON.stringify(updated));
    }
    setActiveSessionId(id);
    setMessages([]);
  };

  // Branch session
  const branchSession = async () => {
    if (!activeSessionId) return;
    const current = sessions.find(s => s.id === activeSessionId);
    if (!current) return;

    const id = "session_" + Date.now();
    const branched: Session = {
      ...current,
      id,
      title: `${current.title} (Branched)`,
      createdTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        if (db) {
          await setDoc(doc(db, "sessions", id), { ...branched, userId });
          // Copy messages
          for (const msg of messages) {
            const newMsgId = "msg_" + Math.random().toString(36).substr(2, 9);
            await setDoc(doc(db, "messages", newMsgId), {
              ...msg,
              id: newMsgId,
              sessionId: id,
              userId
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem(`prism_messages_${id}`, JSON.stringify(messages));
    }

    const updated = [branched, ...sessions];
    setSessions(updated);
    if (firebaseStatus === "fallback") {
      localStorage.setItem("prism_sessions", JSON.stringify(updated));
    }
    setActiveSessionId(id);
  };

  // Delete session
  const deleteSession = async (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);

    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        if (db) {
          await deleteDoc(doc(db, "sessions", id));
          // Delete associated messages (normally done by Cloud Functions, but let's clear local/db batch)
          const messagesSnap = await getDocs(collection(db, "messages"));
          messagesSnap.forEach(async (docSnap) => {
            if (docSnap.data().sessionId === id) {
              await deleteDoc(docSnap.ref);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("prism_sessions", JSON.stringify(updated));
      localStorage.removeItem(`prism_messages_${id}`);
    }

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // Update session parameters and title dynamically
  const updateSessionConfig = async (fields: Partial<Session>) => {
    if (!activeSessionId) return;

    const updated = sessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          ...fields,
          lastUpdated: new Date().toISOString()
        };
      }
      return s;
    });

    setSessions(updated);

    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        const current = updated.find(s => s.id === activeSessionId);
        if (db && current) {
          await setDoc(doc(db, "sessions", activeSessionId), { ...current, userId }, { merge: true });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("prism_sessions", JSON.stringify(updated));
    }
  };

  // Handle weight change dials
  const handleWeightChange = (weights: { formality?: number; technicality?: number; rigor?: number }) => {
    if (weights.formality !== undefined) setFormality(weights.formality);
    if (weights.technicality !== undefined) setTechnicality(weights.technicality);
    if (weights.rigor !== undefined) setRigor(weights.rigor);

    updateSessionConfig(weights);
  };

  // Handle active persona toggles
  const handleTogglePersona = (id: string) => {
    const list = activePersonaIds.includes(id)
      ? activePersonaIds.filter(pId => pId !== id)
      : [...activePersonaIds, id];
    
    setActivePersonaIds(list);
    updateSessionConfig({ activePersonaIds: list });
  };

  // Handle active perspective toggles
  const handleTogglePerspective = (id: string) => {
    const list = activePerspectiveIds.includes(id)
      ? activePerspectiveIds.filter(pId => pId !== id)
      : [...activePerspectiveIds, id];

    setActivePerspectiveIds(list);
    updateSessionConfig({ activePerspectiveIds: list });
  };

  // Trigger Gemini multi-agent synthesis pipeline
  const handleSendMessage = async (queryText: string, attachments?: Attachment[], githubRepo?: string, githubToken?: string) => {
    if (!activeSessionId) return;
    setIsSynthesizing(true);
    setApiError(null);

    const startTime = Date.now();

    // 1. Save user command message
    const userMsg: Message = {
      id: "msg_user_" + Date.now(),
      role: "user",
      content: queryText,
      timestamp: new Date().toISOString(),
      attachments
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);

    if (firebaseStatus === "connected") {
      try {
        const db = getDb();
        if (db) {
          await setDoc(doc(db, "messages", userMsg.id), { ...userMsg, sessionId: activeSessionId, userId });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem(`prism_messages_${activeSessionId}`, JSON.stringify(newMsgs));
    }

    // Auto-update session title based on query if it was default
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (currentSession && (currentSession.title === "New Synthesis State" || currentSession.title === "New Session")) {
      const truncatedTitle = queryText.length > 28 ? queryText.substring(0, 25) + "..." : queryText;
      updateSessionConfig({ title: truncatedTitle });
    }

    try {
      // 2. Call local Express server backend `/api/synthesis`
      const response = await fetch("/api/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          attachments,
          githubRepo,
          githubToken,
          selectedPersonaIds: activePersonaIds,
          selectedPerspectiveIds: activePerspectiveIds,
          formality,
          technicality,
          rigor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unexpected error occurred during synthesis.");
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      // 3. Save synthesis result as assistant message
      const assistantMsg: Message = {
        id: "msg_assistant_" + Date.now(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
        thinking: data.thinking,
        personaOutputs: data.personaOutputs,
        groundingSources: data.groundingSources
      };

      const finalMsgs = [...newMsgs, assistantMsg];
      setMessages(finalMsgs);

      if (firebaseStatus === "connected") {
        const db = getDb();
        if (db) {
          await setDoc(doc(db, "messages", assistantMsg.id), { ...assistantMsg, sessionId: activeSessionId, userId });
        }
      } else {
        localStorage.setItem(`prism_messages_${activeSessionId}`, JSON.stringify(finalMsgs));
      }

      // Update global telemetry statistics
      setStats(prev => ({
        ...prev,
        totalQueries: prev.totalQueries + 1,
        meanLatency: prev.meanLatency === 0 ? latency : (prev.meanLatency + latency) / 2
      }));

    } catch (err: any) {
      console.error("Synthesis processing failed:", err);
      setApiError(err.message || "Synthesis pipeline failed.");
      
      const errorMsg: Message = {
        id: "msg_error_" + Date.now(),
        role: "assistant",
        content: `❌ SYSTEM ERROR: Failed to synthesize. Details: ${err.message || "Connection timeout."}`,
        timestamp: new Date().toISOString()
      };
      
      const finalMsgs = [...newMsgs, errorMsg];
      setMessages(finalMsgs);
      if (firebaseStatus === "fallback") {
        localStorage.setItem(`prism_messages_${activeSessionId}`, JSON.stringify(finalMsgs));
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div id="prism-app" className="h-dvh w-full bg-slate-950 flex overflow-hidden text-slate-100 font-sans">
      {/* Sidebar history manager */}
      {firebaseStatus === "loading" ? (
        <div className="hidden lg:flex w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3">
          <Activity className="w-6 h-6 text-sky-500 animate-spin" />
          <span>Synchronizing state database...</span>
        </div>
      ) : (
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onCreateSession={createNewSession}
          onBranchSession={branchSession}
          onDeleteSession={deleteSession}
          stats={stats}
          userEmail="Craighckby@gmail.com"
        />
      )}

      {/* Main Sandbox Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top visualizer status bar */}
        <div className="bg-slate-900/60 border-b border-slate-850 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-500 p-[1px] shadow-lg shadow-indigo-500/10 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center text-sky-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Multi-Agent Synthesis</h2>
              <p className="text-xs text-slate-400">Analysis and Synthesis Tool</p>
            </div>
          </div>

          {/* Quick status box */}
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${firebaseStatus === "connected" ? "bg-green-500" : "bg-yellow-500"}`}></span>
              <span className="text-slate-400">{firebaseStatus === "connected" ? "Cloud Sync Active" : "Local Fallback State"}</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-slate-300">Agents: {activePersonaIds.length}, Perspectives: {activePerspectiveIds.length}</div>
          </div>
        </div>

        {/* Dashboard grid body split into Lattice config / Sandbox Chat logs */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Config column containing visual SVG lattice and selectors */}
          <div className="w-full lg:w-[450px] max-h-[45vh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-slate-850 bg-slate-900/30 p-4 space-y-4 overflow-y-auto shrink-0 select-none">
            {/* Visual SVG mesh */}
            <LatticeVisualizer
              activePersonaIds={activePersonaIds}
              activePerspectiveIds={activePerspectiveIds}
              personas={PERSONAS}
              perspectives={PERSPECTIVES}
              isSynthesizing={isSynthesizing}
            />

            {/* Selectors and dial weight matrices */}
            <PersonaSelector
              personas={PERSONAS}
              perspectives={PERSPECTIVES}
              activePersonaIds={activePersonaIds}
              activePerspectiveIds={activePerspectiveIds}
              onTogglePersona={handleTogglePersona}
              onTogglePerspective={handleTogglePerspective}
              formality={formality}
              technicality={technicality}
              rigor={rigor}
              onChangeWeights={handleWeightChange}
            />
          </div>

          {/* Chat interaction playground */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full relative">
            {apiError && (
              <div className="absolute top-4 left-4 right-4 z-10 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">System Warning: </span>
                  {apiError}
                </div>
              </div>
            )}
            <ChatSection
              messages={messages}
              isSynthesizing={isSynthesizing}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
