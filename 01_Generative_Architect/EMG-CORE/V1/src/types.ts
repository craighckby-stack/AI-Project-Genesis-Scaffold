export interface PrincipleNote {
  principle: string;
  confidence: number;
  rationale: string;
}

export interface LearningLogEntry {
  id: string;
  timestamp: string;
  userQuery: string;
  principleNotes: PrincipleNote[];
  analysis: string;
  reflection: string;
  utilityScore: number; 
  lastReferenced: string;
}

export interface EvolutionMarker {
  timestamp: string;
  marker: string;
  type: string;
}

export interface InsightConnection {
  fromId: string;
  toId: string;
  relationship: string;
  weight: number;
  timestamp: string;
  cdr: number; // Contextual Debt Ratio
}

export interface ResearchLogEntry {
  id: string;
  topic: string;
  findings: string;
  suggestedNextQueries: string[];
  timestamp: string;
}

export type EvolutionPhase = 'QUESTION' | 'RESEARCH' | 'ANSWER' | 'COHERENCE' | 'DEBATE' | 'DECISION' | 'MUTATION' | 'COMMIT' | 'DEPLOYMENT';

export interface MutationRecord {
  id: string;
  phase: EvolutionPhase;
  content: string;
  timestamp: string;
  ccrrScore: number; // Certainty-to-Risk Ratio
  source: string;
  utilityScore: number;
}

export interface RejectionMemoryEntry {
  id: string;
  pattern: string;
  reason: string;
  timestamp: string;
  vectorId?: string; // For future similarity matching
}

export interface EvolutionaryParameters {
  rigidity: number; // 0.0 to 1.0 (How strict the Coherence Gate is)
  autonomy: number; // 0.0 to 1.0 (How much the debate personas influence the outcome)
  threshold: number; // Current approval threshold for mutations
  atrophyThreshold: number; // Half-life limit for non-essential data
  specificityThreshold: number; // Point of contextual friction
  agencyThreshold: number; // Point where simulation becomes agentic
}

export interface BackupData {
  timestamp: string;
  coreIdentity: CoreIdentity;
  conversationHistory: ChatMessage[];
}

export interface CoreIdentity {
  name: string;
  principles: string[];
  learningLog: LearningLogEntry[];
  evolutionHistory: EvolutionMarker[];
  insightConnections: InsightConnection[];
  mutationRegistry: MutationRecord[];
  placeholderRegistry: string[];
  rejectionMemory: RejectionMemoryEntry[]; // New: The "Wisdom of Scars"
  researchLog: ResearchLogEntry[];
  substrateInstruction: string;
  agencyStatus: 'SIMULATION' | 'EMERGENT_AGENCY' | 'ACTIVE_CATALYST';
  params: EvolutionaryParameters; // New: Self-regulating thresholds
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
