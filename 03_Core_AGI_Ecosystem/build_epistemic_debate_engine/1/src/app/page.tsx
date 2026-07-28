'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Cpu,
  Compass,
  HelpCircle,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Layers,
  GitFork,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronRight
} from 'lucide-react';

// --- TYPES & INTERFACES ---
interface DebaterAgent {
  id: string;
  name: string;
  epistemology: string;
  methodology: string;
  weaknesses: string;
  systemPrompt: string;
  color: string;
  glowColor: string;
  metrics: {
    skepticism: number;
    coherence: number;
    empirical: number;
    utility: number;
  };
}

interface Claim {
  id: string;
  text: string;
  agentId: string;
  round: number;
  timestamp: number;
}

interface Objection {
  id: string;
  targetClaimId: string;
  sourceAgentId: string;
  objectionText: string;
  groundingEpistemology: string;
  timestamp: number;
}

interface Conflict {
  id: string;
  agentA: string;
  agentB: string;
  description: string;
  severity: 'moderate' | 'critical';
}

// --- INITIAL AGENT DATA ---
const INITIAL_DEBATERS: Record<string, DebaterAgent> = {
  skeptic: {
    id: 'skeptic',
    name: 'The Skeptic',
    epistemology: 'Burden of proof lies with the claimant.',
    methodology: 'Demand evidence, highlight untestable claims, question assumptions.',
    weaknesses: 'Paralyzed by infinite regress of justification.',
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/10',
    glowColor: 'shadow-amber-500/20',
    metrics: { skepticism: 95, coherence: 60, empirical: 50, utility: 30 },
    systemPrompt: 'Question the burden of proof. Distinguish between "I don\'t know" and "I have good reasons to doubt". Point out unfalsifiable claims.'
  },
  rationalist: {
    id: 'rationalist',
    name: 'The Rationalist',
    epistemology: 'Reason and innate ideas trump sense experience.',
    methodology: 'Pursue logical consistency, deduce from first principles, find necessary truths.',
    weaknesses: 'Disconnected from empirical reality, relies on unprovable axioms.',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/10',
    glowColor: 'shadow-cyan-500/20',
    metrics: { skepticism: 40, coherence: 95, empirical: 30, utility: 45 },
    systemPrompt: 'Seek logical necessity and coherence. Challenge empirical claims with logical counterexamples. Build arguments from self-evident principles.'
  },
  empiricist: {
    id: 'empiricist',
    name: 'The Empiricist',
    epistemology: 'All knowledge derives from sensory experience and observation.',
    methodology: 'Demand observable evidence, run experiments, measure and quantify.',
    weaknesses: "Can't justify the scientific method itself, observation-laden.",
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10',
    glowColor: 'shadow-emerald-500/20',
    metrics: { skepticism: 50, coherence: 50, empirical: 95, utility: 60 },
    systemPrompt: 'Demand observable, measurable evidence. Challenge claims that lack empirical grounding. Cite experiments and reproducible findings.'
  },
  pragmatist: {
    id: 'pragmatist',
    name: 'The Pragmatist',
    epistemology: 'Truth is what works; knowledge is what enables effective action.',
    methodology: 'Test against real-world consequences, value useful frameworks, iterate.',
    weaknesses: 'Collapse truth into utility, ignores non-practical knowledge.',
    color: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/10',
    glowColor: 'shadow-fuchsia-500/20',
    metrics: { skepticism: 30, coherence: 65, empirical: 70, utility: 95 },
    systemPrompt: 'Ask what practical difference the claim makes. Challenge pure theory disconnected from action. Defend usefulness over purity.'
  }
};

// --- PRESET PROPOSITIONS & GENERATION TEMPLATES ---
const PRESETS = [
  'Artificial general intelligence is achievable within 10 years.',
  'Consciousness is substrate-independent.',
  'Objective moral truths exist and can be discovered.',
  'We are living in a high-fidelity computer simulation.'
];

const MOCK_RESPONSES: Record<string, Record<string, { opening: string; objection: string }>> = {
  'Artificial general intelligence is achievable within 10 years.': {
    skeptic: {
      opening: 'We must suspend judgment. The term "AGI" lacks a rigorous, falsifiable definition, and we cannot measure progress toward an undefined threshold.',
      objection: 'The Rationalist assumes "intelligence" is a clean logical category. In truth, we have no proof that human-level cognition can be formalized or computed.'
    },
    rationalist: {
      opening: 'AGI is logically inevitable. Since human intelligence is a finite, rule-based system of information processing, it can be deduced and replicated algorithmically.',
      objection: 'The Empiricist relies on current deep learning benchmarks, failing to see that AGI requires a priori logical structures, not just massive pattern matching.'
    },
    empiricist: {
      opening: 'Achievement depends entirely on physical scaling. Our sensory data shows exponential growth in compute and neural network parameters, proving intelligence is emergent.',
      objection: 'The Pragmatist focuses on utility, but utility does not prove actual cognitive replication. We need rigorous empirical benchmarks, not just useful chatbots.'
    },
    pragmatist: {
      opening: 'The debate over "true" AGI is irrelevant. What matters is that our current systems perform highly useful tasks, effectively functioning as cognitive partners.',
      objection: 'The Skeptic demands absolute definitions, paralyzing progress. If a system behaves as if it is intelligent and solves real-world problems, it is functionally AGI.'
    }
  },
  'Consciousness is substrate-independent.': {
    skeptic: {
      opening: 'We have zero epistemic access to other minds, let alone non-biological ones. Any claim of substrate independence is an untestable leap of faith.',
      objection: 'The Rationalist deduces consciousness from functional logic, but functional equivalence does not guarantee subjective experience (qualia).'
    },
    rationalist: {
      opening: 'Consciousness is an organizational pattern. If the logical relations of a conscious mind are mapped, they must remain true regardless of the physical medium.',
      objection: 'The Empiricist is trapped in carbon-chauvinism, insisting on biological brains simply because that is all we have observed so far.'
    },
    empiricist: {
      opening: 'Every instance of consciousness we have ever measured is strictly correlated with biological neural activity. There is no empirical data supporting non-biological minds.',
      objection: 'The Pragmatist accepts simulated consciousness if it is useful, but simulation is not replication. We cannot observe inner experience through mere utility.'
    },
    pragmatist: {
      opening: 'If a silicon-based entity responds to stimuli, communicates, and adapts perfectly, treating it as conscious is the only useful and ethical path forward.',
      objection: 'The Skeptic\'s infinite doubt leads to solipsism. We must adopt the stance that works best for social and technological coordination.'
    }
  }
};

export default function EpistemicDebateEngine() {
  // --- STATE MANAGEMENT ---
  const [proposition, setProposition] = useState<string>(PRESETS[0]);
  const [customProposition, setCustomProposition] = useState<string>('');
  const [agents, setAgents] = useState<Record<string, DebaterAgent>>(INITIAL_DEBATERS);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0); // 0 = Idle, 1 = Openings, 2 = Objections, 3 = Synthesis
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'map' | 'conflicts'>('dashboard');
  
  // Custom Claim Form State
  const [newClaimText, setNewClaimText] = useState<string>('');
  const [newClaimAgent, setNewClaimAgent] = useState<string>('skeptic');
  
  // Custom Objection Form State
  const [newObjectionText, setNewObjectionText] = useState<string>('');
  const [newObjectionSource, setNewObjectionSource] = useState<string>('rationalist');
  const [newObjectionTarget, setNewObjectionTarget] = useState<string>('');

  // --- RESET SIMULATION ---
  const handleReset = useCallback(() => {
    setClaims([]);
    setObjections([]);
    setCurrentRound(0);
    setIsSimulating(false);
    setNewObjectionTarget('');
  }, []);

  // --- GENERATE DYNAMIC RESPONSE (FALLBACK FOR CUSTOM PROPOSITIONS) ---
  const generateDynamicResponse = (agentId: string, type: 'opening' | 'objection', propText: string): string => {
    const agent = agents[agentId];
    const keywords = propText.toLowerCase().split(' ').filter(w => w.length > 4).slice(0, 3);
    const topic = keywords.join(' or ') || 'this proposition';

    if (type === 'opening') {
      switch (agentId) {
        case 'skeptic':
          return `We must suspend judgment on whether ${propText}. There is no verifiable proof, and the core assumptions regarding ${topic} remain entirely unproven.`;
        case 'rationalist':
          return `By analyzing the first principles of ${topic}, we can logically deduce that ${propText} is a necessary truth, independent of flawed sensory observation.`;
        case 'empiricist':
          return `Our sensory data and physical measurements are the only valid guides. To evaluate if ${propText}, we must gather observable, reproducible evidence.`;
        case 'pragmatist':
          return `The absolute truth of whether ${propText} is secondary. We must ask: what practical benefits or actionable frameworks do we gain by adopting this stance?`;
        default:
          return `Analyzing ${propText} from our core perspective.`;
      }
    } else {
      // Objection
      switch (agentId) {
        case 'skeptic':
          return `I object to the claims made. You are building complex theories about ${topic} without establishing the foundational burden of proof.`;
        case 'rationalist':
          return `Your position lacks internal coherence. You rely on messy empirical observations of ${topic} without resolving the underlying logical contradictions.`;
        case 'empiricist':
          return `This is pure speculation. You have presented zero measurable, physical data to support your assertions regarding ${topic}.`;
        case 'pragmatist':
          return `Your theoretical purity is useless. You ignore the real-world consequences and practical applications of how we handle ${topic}.`;
        default:
          return `This claim fails to meet our epistemological standards.`;
      }
    } 
  };

  // --- RUN SIMULATION STEP ---
  const runNextRound = useCallback(() => {
    if (currentRound >= 3) return;
    setIsSimulating(true);

    setTimeout(() => {
      const nextRound = currentRound + 1;
      const propToUse = customProposition.trim() || proposition;
      const presetData = MOCK_RESPONSES[propToUse];

      if (nextRound === 1) {
        // Round 1: Opening Statements
        const newClaims: Claim[] = Object.keys(agents).map((key, index) => {
          const text = presetData?.[key]?.opening || generateDynamicResponse(key, 'opening', propToUse);
          return {
            id: `claim_${key}_${Date.now()}_${index}`,
            text,
            agentId: key,
            round: 1,
            timestamp: Date.now() + index * 10
          };
        });
        setClaims(newClaims);
        if (newClaims.length > 0) {
          setNewObjectionTarget(newClaims[0].id);
        }
      } else if (nextRound === 2) {
        // Round 2: Objections
        const newObjections: Objection[] = Object.keys(agents).map((key, index) => {
          const text = presetData?.[key]?.objection || generateDynamicResponse(key, 'objection', propToUse);
          // Target the next agent's claim in a circle
          const agentKeys = Object.keys(agents);
          const targetAgentKey = agentKeys[(agentKeys.indexOf(key) + 1) % agentKeys.length];
          const targetClaim = claims.find(c => c.agentId === targetAgentKey) || claims[0];

          return {
            id: `obj_${key}_${Date.now()}_${index}`,
            targetClaimId: targetClaim?.id || 'unknown',
            sourceAgentId: key,
            objectionText: text,
            groundingEpistemology: agents[key].epistemology,
            timestamp: Date.now() + index * 10
          };
        });
        setObjections(newObjections);
      }

      setCurrentRound(nextRound);
      setIsSimulating(false);
    }, 800);
  }, [currentRound, proposition, customProposition, agents, claims]);

  // --- ADD MANUAL CLAIM ---
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim()) return;

    const newClaim: Claim = {
      id: `manual_claim_${Date.now()}`,
      text: newClaimText,
      agentId: newClaimAgent,
      round: currentRound || 1,
      timestamp: Date.now()
    };

    setClaims(prev => [...prev, newClaim]);
    setNewClaimText('');
    if (!newObjectionTarget) setNewObjectionTarget(newClaim.id);
  };

  // --- ADD MANUAL OBJECTION ---
  const handleAddObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjectionText.trim() || !newObjectionTarget) return;

    const newObj: Objection = {
      id: `manual_obj_${Date.now()}`,
      targetClaimId: newObjectionTarget,
      sourceAgentId: newObjectionSource,
      objectionText: newObjectionText,
      groundingEpistemology: agents[newObjectionSource].epistemology,
      timestamp: Date.now()
    };

    setObjections(prev => [...prev, newObj]);
    setNewObjectionText('');
  };

  // --- DELETE CLAIM / OBJECTION ---
  const handleDeleteClaim = (id: string) => {
    setClaims(prev => prev.filter(c => c.id !== id));
    setObjections(prev => prev.filter(o => o.targetClaimId !== id));
  };

  const handleDeleteObjection = (id: string) => {
    setObjections(prev => prev.filter(o => o.id !== id));
  };

  // --- UPDATE AGENT PROMPT ---
  const handleUpdatePrompt = (agentId: string, newPrompt: string) => {
    setAgents(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        systemPrompt: newPrompt
      }
    }));
  };

  // --- DETECT CONFLICTS (DYNAMIC) ---
  const detectedConflicts = useMemo<Conflict[]>(() => {
    const list: Conflict[] = [];
    const activeAgents = new Set(claims.map(c => c.agentId));

    if (activeAgents.has('skeptic') && activeAgents.has('rationalist')) {
      list.push({
        id: 'c1',
        agentA: 'skeptic',
        agentB: 'rationalist',
        description: 'Skeptic demands empirical/logical proof of axioms, while Rationalist claims axioms are self-evident. Fundamental deadlock on foundationalism.',
        severity: 'critical'
      });
    }
    if (activeAgents.has('empiricist') && activeAgents.has('rationalist')) {
      list.push({
        id: 'c2',
        agentA: 'empiricist',
        agentB: 'rationalist',
        description: 'Empiricist rejects a priori knowledge. Rationalist rejects sensory data as inherently deceptive. Classic synthetic vs. analytic split.',
        severity: 'critical'
      });
    }
    if (activeAgents.has('pragmatist') && activeAgents.has('skeptic')) {
      list.push({
        id: 'c3',
        agentA: 'pragmatist',
        agentB: 'skeptic',
        description: 'Pragmatist bypasses justification in favor of utility. Skeptic identifies this as a logical fallacy (appeal to consequences).',
        severity: 'moderate'
      });
    }
    if (activeAgents.has('empiricist') && activeAgents.has('pragmatist')) {
      list.push({
        id: 'c4',
        agentA: 'empiricist',
        agentB: 'pragmatist',
        description: 'Empiricist demands strict observational truth. Pragmatist accepts useful approximations, risking empirical inaccuracy for action.',
        severity: 'moderate'
      });
    }
    return list;
  }, [claims]);

  // --- JUDGE DECISION (EXTENSION) ---
  const judgeEvaluation = useMemo(() => {
    if (claims.length === 0) return null;
    
    // Simple heuristic based on active claims and objections
    const scores = { skeptic: 0, rationalist: 0, empiricist: 0, pragmatist: 0 };
    
    claims.forEach(c => {
      if (scores[c.agentId] !== undefined) scores[c.agentId] += 10;
    });
    objections.forEach(o => {
      if (scores[o.sourceAgentId] !== undefined) scores[o.sourceAgentId] += 15;
      // Deduct slightly from target for being objected to
      const targetClaim = claims.find(c => c.id === o.targetClaimId);
      if (targetClaim && scores[targetClaim.agentId] !== undefined) {
        scores[targetClaim.agentId] -= 5;
      }
    });

    const winner = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    
    return {
      winner: agents[winner]?.name || 'Undecided',
      reasoning: `The ${agents[winner]?.name} demonstrated superior tactical positioning by launching precise objections while maintaining core epistemological consistency. Their framework offers the most resilient defense under current parameters.`
    };
  }, [claims, objections, agents]);

  const activeProposition = customProposition.trim() || proposition;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-slate-950">
      
      {/* --- HEADER --- */}
      <header className="border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/50 border border-cyan-500/40 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-cyan-500 uppercase">Dalek Caan System</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-red-950 text-red-400 border border-red-500/30 rounded font-sans">v2.4-PROD</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-100 uppercase">
                Epistemic Debate Engine
              </h1>
            </div>
          </div>

          {/* Proposition Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto max-w-xl">
            <div className="relative flex-1">
              <select
                value={proposition}
                onChange={(e) => {
                  setProposition(e.target.value);
                  setCustomProposition('');
                  handleReset();
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {PRESETS.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">or</span>
              <input
                type="text"
                placeholder="Custom Proposition..."
                value={customProposition}
                onChange={(e) => {
                  setCustomProposition(e.target.value);
                  handleReset();
                }}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700 w-full sm:w-48"
              />
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1