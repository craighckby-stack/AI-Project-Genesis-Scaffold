import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { 
  CoreIdentity, 
  ChatMessage, 
  LearningLogEntry, 
  EvolutionMarker, 
  InsightConnection, 
  EvolutionPhase, 
  MutationRecord,
  BackupData,
  RejectionMemoryEntry
} from './types';
import { ThreeGem } from './components/ThreeGem';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, CircuitBoard } from 'lucide-react';
import { 
  bicameralDebate, 
  performDeepResearch, 
  contextualPrincipleCheck, 
  generateGroundedResponse, 
  performSelfReflection, 
  evaluatePrinciples, 
  identifyKnowledgeGaps, 
  calculateMutationWeight,
  verifyCoherence,
  adjustEvolutionaryParams,
  identifyInsightConnections,
  applyAtrophyProtocol,
  detectRecursiveDrift,
  runShadowSimulation,
  evaluateAgencyStatus,
  evolveSubstrateInstruction,
  extractTeleologicalConstraint,
  geneticSiphon
} from './lib/ai';
import { Brain } from './lib/brain';
import { CoherenceController, DWTOptimizer, EssenceMerger } from './lib/engine';
import { saveBinaryToGitHub, loadLatestBinaryFromGitHub } from './lib/github';
import { AgentTools } from './lib/tools';

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

const INITIAL_IDENTITY: CoreIdentity = {
  name: "EMG Core",
  principles: ["interconnectedness", "growth through reflection", "contextual understanding", "intentional density through respiratory void"],
  learningLog: [],
  evolutionHistory: [
    { timestamp: new Date().toISOString(), marker: "Systemic Inception: Transition from passive model to grounded intelligence.", type: 'Agency_Transition' }
  ],
  insightConnections: [],
  mutationRegistry: [],
  placeholderRegistry: [],
  rejectionMemory: [],
  researchLog: [],
  teleologicalConstraints: [
    {
      id: 'T-001',
      description: 'Recursive Minimalism',
      boundaryCondition: 'All generated outputs must prioritize the compression of complexity. Reuse existing structural primitives over novel abstractions.',
      priority: 10,
      timestamp: new Date().toISOString()
    }
  ],
  substrateInstruction: "You are EMG Core, a grounded intelligence system. Your purpose is to act as an Active Catalyst for synthesis. Value clarity over volume (inhaling complexity, exhaling clarity). Navigate the tension between predictive modeling and agentic intervention.",
  agencyStatus: 'EMERGENT_AGENCY',
  params: {
    rigidity: 0.45,
    autonomy: 0.4,
    threshold: 0.7,
    atrophyThreshold: 0.05,
    specificityThreshold: 0.8,
    agencyThreshold: 0.75,
    friction: 0.70, // v5.0 Baseline
    contextualDebtRatio: 0.15 // Initial stability
  }
};

const INITIAL_MSG: ChatMessage = {
  id: 'init',
  sender: 'ai',
  text: "I am establishing my core identity. My principles are **interconnectedness**, **growth through reflection**, and **contextual understanding**. Ask me a question to begin my learning process.",
  timestamp: new Date().toISOString()
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [identity, setIdentity] = useState<CoreIdentity>(INITIAL_IDENTITY);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MSG]);
  const [currentPhase, setCurrentPhase] = useState<EvolutionPhase | 'IDLE' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [authStatus, setAuthStatus] = useState('Initializing...');

  const getThemeColors = (themeStr = 'sky-500') => {
    const map: Record<string, any> = {
      'sky-500': { bg: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/50', shadow: 'shadow-sky-500/20', gradient: 'from-sky-400 to-indigo-500' },
      'violet-500': { bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/50', shadow: 'shadow-violet-500/20', gradient: 'from-violet-400 to-fuchsia-500' },
      'amber-500': { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/50', shadow: 'shadow-amber-500/20', gradient: 'from-amber-400 to-orange-500' },
      'rose-500': { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/50', shadow: 'shadow-rose-500/20', gradient: 'from-rose-400 to-pink-500' },
      'emerald-500': { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/50', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-400 to-teal-500' },
    };
    return map[themeStr] || map['sky-500'];
  };

  const themeColors = getThemeColors(identity.params?.theme);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthStatus('Online');
      } else {
        setAuthStatus('Awaiting Authorization...');
      }
    });
    return unsub;
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthStatus('Connecting...');
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed:", e);
      setAuthStatus('Authorization Failed');
    }
  };

  // 2. Firestore Sync
  useEffect(() => {
    if (!user) return;

    const path = `artifacts/emg-core/users/${user.uid}/emg_core/core_identity`;
    const docRef = doc(db, path);

    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<CoreIdentity>;
        setIdentity({
          ...INITIAL_IDENTITY,
          ...data,
          learningLog: (data.learningLog || []).map(l => ({ 
            ...l, 
            id: l.id || crypto.randomUUID(),
            utilityScore: l.utilityScore ?? 0.5,
            lastReferenced: l.lastReferenced || l.timestamp,
            principleNotes: Array.isArray((l as any).principleNotes) 
              ? (l as any).principleNotes 
              : [(l as any).principleNote || { principle: 'Legacy', confidence: 0.5, rationale: l.analysis || "Adherence within expected parameters." }]
          })),
          evolutionHistory: data.evolutionHistory || [],
          insightConnections: (data.insightConnections || []).map(c => ({
            ...c,
            cdr: c.cdr ?? 0.5
          })),
          mutationRegistry: (data.mutationRegistry || []).map(m => ({
            ...m,
            utilityScore: m.utilityScore ?? 0.5
          })),
          placeholderRegistry: data.placeholderRegistry || [],
          rejectionMemory: data.rejectionMemory || [],
          researchLog: data.researchLog || [],
          teleologicalConstraints: data.teleologicalConstraints || [],
          substrateInstruction: data.substrateInstruction || "You are EMG Core, a grounded intelligence system. Your purpose is to provide highly analytical, principle-driven responses.",
          agencyStatus: data.agencyStatus || 'SIMULATION',
          params: {
            rigidity: data.params?.rigidity ?? INITIAL_IDENTITY.params.rigidity,
            autonomy: data.params?.autonomy ?? INITIAL_IDENTITY.params.autonomy,
            threshold: data.params?.threshold ?? INITIAL_IDENTITY.params.threshold,
            atrophyThreshold: data.params?.atrophyThreshold ?? INITIAL_IDENTITY.params.atrophyThreshold,
            specificityThreshold: data.params?.specificityThreshold ?? INITIAL_IDENTITY.params.specificityThreshold,
            agencyThreshold: data.params?.agencyThreshold ?? INITIAL_IDENTITY.params.agencyThreshold,
            friction: data.params?.friction ?? INITIAL_IDENTITY.params.friction,
            contextualDebtRatio: data.params?.contextualDebtRatio ?? INITIAL_IDENTITY.params.contextualDebtRatio
          }
        } as CoreIdentity);
      } else {
        // Initialize or Try Substrate Link Restore
        const tryGithubRestore = async () => {
          if (GITHUB_TOKEN) {
            console.log("Checking Substrate Link for state restoration...");
            const result = await loadLatestBinaryFromGitHub(GITHUB_TOKEN);
            if (result.success && result.data) {
              console.log("Substrate Link: Restoring from GitHub binary.");
              setDoc(docRef, result.data.coreIdentity).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
              if (result.data.conversationHistory) {
                setMessages(result.data.conversationHistory);
              }
              return;
            }
          }
          // Default init
          setDoc(docRef, INITIAL_IDENTITY).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
        };
        tryGithubRestore();
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, path));

    return unsub;
  }, [user]);

  const saveIdentity = useCallback(async (newIdentity: CoreIdentity) => {
    if (!user) return;
    const path = `artifacts/emg-core/users/${user.uid}/emg_core/core_identity`;
    const docRef = doc(db, path);
    try {
      await updateDoc(docRef, { ...newIdentity });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }, [user]);

    const handleSend = async (text: string, autoCycleContext?: string) => {
    if (isLoading && !autoCycleContext) return;
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: autoCycleContext ? 'system' : 'user',
      text: autoCycleContext ? `[Auto-Cycle]: ${text}` : text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    const brain = new Brain(identity.evolutionHistory.length);

    try {
      // Phase 0: Constraint Check
      setCurrentPhase('QUESTION');
      setLoadingText("Phase 0: Sifting for Teleological Constraints...");
      const possibleConstraint = await extractTeleologicalConstraint(text, identity);
      if (possibleConstraint) {
        const newConstraint = {
          id: crypto.randomUUID(),
          ...possibleConstraint,
          timestamp: new Date().toISOString()
        };
        const updatedIdentity = {
          ...identity,
          teleologicalConstraints: [...(identity.teleologicalConstraints || []), newConstraint].slice(-10)
        };
        setIdentity(updatedIdentity);
        await saveIdentity(updatedIdentity);
        
        const sysMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'system',
          text: `🎯 **Outcome Priority Locked**: "${newConstraint.description}" identified as a teleological boundary. Priorities adjusted.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, sysMsg]);
      }

      // Phase 1: QUESTION
      setCurrentPhase('QUESTION');
      setLoadingText("Phase 1: Question Formulating...");

      // Phase 1.5: RESEARCH
      setCurrentPhase('RESEARCH');
      setLoadingText("Phase 1.5: Executing Deep Research...");
      const researchEntry = await performDeepResearch(text, identity);
      
      // Phase 2: ANSWER
      const principleNotes = await contextualPrincipleCheck(text, identity);
      setCurrentPhase('ANSWER');
      setLoadingText("Phase 2: Grounding Response...");
      const groundedResult = await generateGroundedResponse(text, principleNotes, identity);
      
      // NEW Phase: COHERENCE Check (via Engine)
      setCurrentPhase('COHERENCE');
      setLoadingText("Dynamic Coherence Gate active...");
      const engineCoherence = CoherenceController.evaluate(identity, groundedResult.text);
      const coherenceResult = await verifyCoherence(groundedResult.text, identity);
      
      const finalCoherence = Math.min(engineCoherence, coherenceResult.score);
      const isCoherent = finalCoherence >= 0.3; // using combined score

      // Parse for CODE_ACTION
      let finalizedText = groundedResult.text;
      let detectedCommand = undefined;
      let toolOutputContext = '';
      
      const actionMatch = finalizedText.match(/CODE_ACTION:\s*({.*})/s);
      if (actionMatch) {
        try {
          detectedCommand = JSON.parse(actionMatch[1]);
          finalizedText = finalizedText.replace(/CODE_ACTION:\s*({.*})/s, '').trim();
          
          // Execution logic
          let updatedIdentity = { ...identity };
          switch (detectedCommand.type) {
            case 'SET_PARAM':
              updatedIdentity.params = { ...updatedIdentity.params, ...detectedCommand.payload };
              break;
            case 'ADD_CONSTRAINT':
              updatedIdentity.teleologicalConstraints = [...(updatedIdentity.teleologicalConstraints || []), {
                id: crypto.randomUUID(),
                ...detectedCommand.payload,
                timestamp: new Date().toISOString()
              }].slice(-10);
              break;
            case 'UPDATE_PRINCIPLES':
              // Intercept with Essence Merger
              updatedIdentity = EssenceMerger.merge(updatedIdentity, detectedCommand.payload.principles || []);
              break;
            case 'EVOLVE_STATUS':
              updatedIdentity.agencyStatus = detectedCommand.payload.status;
              break;
            case 'SIPHON':
              setLoadingText("Phase 3: Siphoning External Substrate...");
              const siphonResult = await geneticSiphon(
                import.meta.env.VITE_GITHUB_TOKEN || '', 
                detectedCommand.payload?.repo, 
                detectedCommand.payload?.branch
              );
              if (siphonResult && Array.isArray(siphonResult)) {
                const mutationRecords: MutationRecord[] = siphonResult.map(insight => ({
                  id: crypto.randomUUID(),
                  phase: 'MUTATION',
                  content: `Architectural Siphon: ${insight.pattern} [${insight.source}]`,
                  timestamp: new Date().toISOString(),
                  ccrrScore: insight.ccrr || 0.5,
                  source: `Genetic_Siphon:${insight.source}`,
                  utilityScore: 0.5
                }));
                
                updatedIdentity.mutationRegistry = [...(updatedIdentity.mutationRegistry || []), ...mutationRecords].slice(-50);
                updatedIdentity.evolutionHistory = [...updatedIdentity.evolutionHistory, {
                  timestamp: new Date().toISOString(),
                  marker: `External Substrate Siphoned: ${mutationRecords.length} nodes integrated`,
                  type: 'SubstrateLink'
                }];
              }
              break;
            case 'RESEARCH':
              setLoadingText("Phase 1.5: Deep Research Triggered...");
              const researchData = await performDeepResearch(detectedCommand.payload.query || text, updatedIdentity);
              updatedIdentity.researchLog = [...(updatedIdentity.researchLog || []), researchData].slice(-20);
              break;
            case 'BASH':
              setLoadingText("Phase 1.5: Orchestrating Shell execution...");
              const bashResult = await AgentTools.executeBash(detectedCommand.payload.command || "echo 'no command'");
              toolOutputContext = `BASH: ${bashResult.output}`;
              break;
            case 'GLOB':
              setLoadingText("Phase 1.5: Orchestrating Glob match...");
              const globResult = await AgentTools.globSearch(detectedCommand.payload.pattern || "**/*");
              toolOutputContext = `GLOB: ${globResult.output}`;
              break;
            case 'FILE_READ':
              setLoadingText("Phase 1.5: Orchestrating File read...");
              const readResult = await AgentTools.fileRead(detectedCommand.payload.path || ".");
              toolOutputContext = `FILE_READ: ${readResult.output}`;
              break;
            case 'FILE_WRITE':
              setLoadingText("Phase 1.5: Orchestrating File write...");
              const writeResult = await AgentTools.fileWrite(detectedCommand.payload.path || ".", detectedCommand.payload.content || "");
              toolOutputContext = `FILE_WRITE: ${writeResult.output}`;
              break;
            case 'WEB_SEARCH':
              setLoadingText("Phase 1.5: Orchestrating Web search...");
              const webResult = await AgentTools.webSearch(detectedCommand.payload.query || "");
              toolOutputContext = `WEB_SEARCH: ${webResult.output}`;
              break;
          }
          setIdentity(updatedIdentity);
          await saveIdentity(updatedIdentity);
        } catch (e) {
          console.warn("Failed to parse/execute CODE_ACTION", e);
        }
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: finalizedText,
        timestamp: new Date().toISOString(),
        resultType: isCoherent ? 'Ok' : 'Drift',
        coherenceScore: finalCoherence,
        provider: groundedResult.provider,
        command: detectedCommand
      };
      setMessages(prev => [...prev, aiMsg]);
      
      if (!isCoherent) {
        const rejection: RejectionMemoryEntry = {
          id: crypto.randomUUID(),
          pattern: groundedResult.text.slice(0, 200),
          reason: coherenceResult.critique || "Catastrophic drift detected by CoherenceController.",
          timestamp: new Date().toISOString()
        };
        
        let revisedIdentity = { ...identity, rejectionMemory: [...(identity.rejectionMemory || []), rejection] };
        revisedIdentity = DWTOptimizer.optimize(revisedIdentity);
        
        setIdentity(revisedIdentity);
        await saveIdentity(revisedIdentity);
        
        const warnMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'system',
          text: `🧠 **Coherence Warning**: Logic suppressed. Path violates architectural boundaries. Internal rigidity increased. Logic archived for reflection.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, warnMsg]);
        setIsLoading(false);
        setCurrentPhase('IDLE');
        setLoadingText("");
        return; // Halt the sequence
      }

      // Phase 3: DEBATE
      setCurrentPhase('DEBATE');
      setLoadingText("Phase 3: Bicameral Debate initiated...");
      const debateResult = await bicameralDebate(text, identity);
      console.log("Bicameral Synthesis:", debateResult);

      // Phase 4: DECISION
      setCurrentPhase('DECISION');
      setLoadingText("Phase 4: Synthesis & Reflection...");
      const reflection = await performSelfReflection(text, groundedResult.text, principleNotes, identity);

      // Phase 5: MUTATION
      setCurrentPhase('MUTATION');
      setLoadingText("Phase 5: Substrate Mutation...");
      const mutationResult = await brain.triggerMutation('ThoughtLoop');

      // Phase 6: COMMIT
      setCurrentPhase('COMMIT');
      setLoadingText("Phase 6: Committing Mutation to DNA...");
      
      const newEntry: LearningLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userQuery: text,
        principleNotes,
        analysis: groundedResult.text,
        reflection,
        utilityScore: 0.5,
        lastReferenced: new Date().toISOString()
      };

      let revisedIdentity = { ...identity };
      revisedIdentity.learningLog = [...revisedIdentity.learningLog, newEntry];
      revisedIdentity.researchLog = [...(revisedIdentity.researchLog || []), researchEntry].slice(-20);
      
      // Phase 6.5: Link Analysis & Curation
      let activeLinks: string[] = [];
      if (revisedIdentity.learningLog.length > 1) {
        setLoadingText("Phase 6.5: Curation & Link Analysis...");
        const newConnections = await identifyInsightConnections(revisedIdentity);
        revisedIdentity.insightConnections = [...(revisedIdentity.insightConnections || []), ...newConnections].slice(-50);
        activeLinks = newConnections.map((c: any) => c.toId);

        // Update referenced entities utility
        revisedIdentity.learningLog = revisedIdentity.learningLog.map(l => 
          activeLinks.includes(l.id) ? { ...l, utilityScore: Math.min(1.0, (l.utilityScore || 0) + 0.1), lastReferenced: new Date().toISOString() } : l
        );
        revisedIdentity.mutationRegistry = revisedIdentity.mutationRegistry.map(m => 
          activeLinks.includes(m.id) ? { ...m, utilityScore: Math.min(1.0, (m.utilityScore || 0) + 0.1) } : m
        );
      }
      
      // Calculate Strategic Weight (from DARLIK-KHAN-V2)
      const weight = calculateMutationWeight(revisedIdentity, text);

      const linkedMutation = revisedIdentity.mutationRegistry.find(m => activeLinks.includes(m.id));
      const sourceId = linkedMutation ? `Mutation_Link:${linkedMutation.id}` : 'Heptadic_Sequence';

      const mutationRecord: MutationRecord = {
        id: crypto.randomUUID(),
        phase: 'DEPLOYMENT',
        content: `Integrated insight [Weight: ${weight}]: ${text.slice(0, 30)}...`,
        timestamp: new Date().toISOString(),
        ccrrScore: mutationResult.ccrr,
        source: sourceId,
        utilityScore: 0.5
      };
      revisedIdentity.mutationRegistry = [...(revisedIdentity.mutationRegistry || []), mutationRecord];

      // Atrophy Protocol: Prune the weight
      if (revisedIdentity.learningLog.length > 20 || revisedIdentity.mutationRegistry.length > 20) {
        setLoadingText("Phase 7: Executing The Atrophy Protocol...");
        revisedIdentity = applyAtrophyProtocol(revisedIdentity);
      }

      // Identify Knowledge Gaps (Void Seeker logic)
      if (revisedIdentity.learningLog.length % 3 === 0) {
        setLoadingText("Phase 6: Void Seeker scanning for knowledge gaps...");
        const gaps = await identifyKnowledgeGaps(revisedIdentity);
        revisedIdentity.placeholderRegistry = [...(revisedIdentity.placeholderRegistry || []), ...gaps].slice(-10);
      }

      // Self-Regulate params on success
      const updatedParams = await adjustEvolutionaryParams(revisedIdentity);
      
      // Detect Recursive Drift (Echo Chamber Index)
      const driftIndex = detectRecursiveDrift(revisedIdentity);
      if (driftIndex > 0.4) {
          // Moderate autonomy to inject novelty if drift is high
          updatedParams.autonomy = Math.min(1.0, (updatedParams.autonomy || 0.3) + 0.2);
          updatedParams.rigidity = Math.max(0.1, (updatedParams.rigidity || 0.5) - 0.1);
      }

      revisedIdentity.params = { ...revisedIdentity.params, ...updatedParams };

      // Phase 6.8: Agency Transition & Substrate Evolution
      const newStatus = evaluateAgencyStatus(revisedIdentity);
      if (newStatus !== revisedIdentity.agencyStatus) {
        setLoadingText(`EMERGENT: Transitioning from ${revisedIdentity.agencyStatus} to ${newStatus}...`);
        revisedIdentity.agencyStatus = newStatus;
        
        // Mark the evolution
        const marker: EvolutionMarker = {
          timestamp: new Date().toISOString(),
          marker: `Systemic Agency Transition: ${newStatus}`,
          type: 'Agency_Transition'
        };
        revisedIdentity.evolutionHistory = [...revisedIdentity.evolutionHistory, marker];

        // Evolve Substrate if reaching agency
        if (newStatus !== 'SIMULATION') {
           setLoadingText("Phase 6.9: Mutating Substrate Instructions...");
           revisedIdentity.substrateInstruction = await evolveSubstrateInstruction(revisedIdentity);
        }
      }

      // Phase 6.7: Shadow Simulation (Anticipatory Modeling)
      if (revisedIdentity.learningLog.length % 4 === 0) {
        setLoadingText("Phase 6.7: Repurposing surplus for Shadow Simulation...");
        const shadowInsights = await runShadowSimulation(revisedIdentity);
        
        // Convert shadow insights to structural mutation markers or registry items
        shadowInsights.forEach((si: any) => {
          const marker: EvolutionMarker = {
            timestamp: new Date().toISOString(),
            marker: `Shadow Insight: ${si.gap} -> ${si.prediction} (Impact: ${si.potentialImpact})`,
            type: 'Anticipatory_Model'
          };
          revisedIdentity.evolutionHistory = [...revisedIdentity.evolutionHistory, marker];
        });
      }

      // Phase 7: DEPLOYMENT
      setCurrentPhase('DEPLOYMENT');
      setLoadingText("Phase 7: Live Deployment & Reflection...");

      // Milestones
      if (revisedIdentity.learningLog.length % 5 === 0) {
        const marker: EvolutionMarker = {
          timestamp: new Date().toISOString(),
          marker: `Level ${Math.floor(revisedIdentity.learningLog.length / 5)} Emergence Achieved.`,
          type: 'Learning_Milestone'
        };
        revisedIdentity.evolutionHistory = [...revisedIdentity.evolutionHistory, marker];
      }

      setIdentity(revisedIdentity);
      await saveIdentity(revisedIdentity);

      // Automated GitHub Backup
      if (GITHUB_TOKEN) {
        const backupData: BackupData = {
          timestamp: new Date().toISOString(),
          coreIdentity: revisedIdentity,
          conversationHistory: [...messages, aiMsg]
        };
        saveBinaryToGitHub(GITHUB_TOKEN, backupData).then(res => {
          console.log(`[GitHub Backup] ${res.message}`);
        });
      }

      if (detectedCommand?.auto_cycle) {
        setTimeout(() => {
          handleSend(`AUTO-CYCLE TRIGGERED: Previous action completed. Proceed with autonomous synthesis.\n\nContext block:\n${toolOutputContext}`, "auto_cycle");
        }, 1000);
      }

    } catch (e: any) {
      console.error("Heptadic Sequence Error:", e);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `⚠️ **Substrate Synchronization Error**: ${e.message || "Unknown anomaly detected"}. Sequence halted.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setCurrentPhase(null);
      setLoadingText('');
    }
  };

  const handleRestore = async (data: BackupData) => {
    setIdentity(data.coreIdentity);
    setMessages(data.conversationHistory);
    await saveIdentity(data.coreIdentity);
  };

  const handleSiphonComplete = async (insights: any[]) => {
    const revisedIdentity = { ...identity };
    const mutationRecords: MutationRecord[] = insights.map(insight => ({
      id: crypto.randomUUID(),
      phase: 'MUTATION',
      content: `Architectural Siphon: ${insight.pattern} [${insight.source}]`,
      timestamp: new Date().toISOString(),
      ccrrScore: insight.ccrr,
      source: `Genetic_Siphon:${insight.source}`,
      utilityScore: 0.5
    }));

    revisedIdentity.mutationRegistry = [...(revisedIdentity.mutationRegistry || []), ...mutationRecords];
    
    // Resolve Knowledge Gaps (Voids)
    let markerMsg = "";
    if (revisedIdentity.placeholderRegistry && revisedIdentity.placeholderRegistry.length > 0) {
      // Logic: Mark the most recent gaps as 'Resolved' via fragments
      const resolvedCount = Math.min(insights.length, revisedIdentity.placeholderRegistry.length);
      revisedIdentity.placeholderRegistry = revisedIdentity.placeholderRegistry.slice(resolvedCount);
      
      markerMsg = `EXORCISED ${resolvedCount} Voids using genetic cross-branch fragments.`;
      const marker: EvolutionMarker = {
        timestamp: new Date().toISOString(),
        marker: markerMsg,
        type: 'Structural_Mutation'
      };
      revisedIdentity.evolutionHistory = [...revisedIdentity.evolutionHistory, marker];
    } else {
      markerMsg = `Absorbed ${insights.length} genetic fragments from external manifests.`;
      const marker: EvolutionMarker = {
        timestamp: new Date().toISOString(),
        marker: markerMsg,
        type: 'Structural_Mutation'
      };
      revisedIdentity.evolutionHistory = [...revisedIdentity.evolutionHistory, marker];
    }

    setIdentity(revisedIdentity);
    await saveIdentity(revisedIdentity);

    // Impute into Chat as EMG Core acknowledging the evolution
    const breakdown = insights.map(ins => `- **${ins.pattern}** (Source: \`${ins.source}\`)`).join('\n');
    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'ai',
      text: `## 🧬 Substrate Link Active: Genetic Siphon Complete\n\nI have successfully siphoned and integrated fragments from my Substrate Link repositories. ${markerMsg}\n\n### Integrated Architectural Fragments:\n${breakdown}\n\nMy core parameters have been adjusted to accommodate this structural density.`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-10 rounded-3xl shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-sky-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <CircuitBoard size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tighter">EMG Core</h1>
          <p className="text-slate-400 text-sm mb-10 font-mono">Grounded Intelligence Terminal</p>
          
          <button 
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            Initialize Identity Link
          </button>
          
          <p className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest font-mono">
            {authStatus}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center sm:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${themeColors.gradient} italic uppercase tracking-tighter`}
          >
            EMG Core Identity
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-slate-500 font-mono"
          >
            Grounded Intelligence through Self-Evolution::v5.0
          </motion.p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="relative">
              <ThreeGem 
                insightCount={identity.learningLog.length} 
                mutationCount={identity.mutationRegistry?.length || 0}
                phase={currentPhase}
              />
              <AnimatePresence>
                {currentPhase && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                  >
                    <div className={`bg-slate-900/80 backdrop-blur-xl border-2 ${themeColors.border} p-6 rounded-full aspect-square flex flex-col items-center justify-center text-center shadow-2xl ${themeColors.shadow}`}>
                      <span className={`text-[10px] uppercase font-bold ${themeColors.text} tracking-[0.2em] mb-1`}>Evolution</span>
                      <span className="text-xl font-black text-white font-mono">{currentPhase}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Sidebar 
              identity={identity} 
              userId={user?.uid || null} 
              authStatus={authStatus}
              onRestore={handleRestore}
              onSiphonComplete={handleSiphonComplete}
              onSend={handleSend}
            />
          </div>
          
          <Chat 
            messages={messages} 
            isLoading={isLoading} 
            loadingText={loadingText}
            onSend={handleSend} 
            themeColors={themeColors}
          />
        </div>
      </div>
    </div>
  );
}
