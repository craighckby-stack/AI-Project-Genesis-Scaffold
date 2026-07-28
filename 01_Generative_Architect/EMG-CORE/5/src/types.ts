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
  rigidity: number; 
  autonomy: number; 
  threshold: number; 
  atrophyThreshold: number; 
  specificityThreshold: number; 
  agencyThreshold: number; 
  friction: number; // New metric from user request
  contextualDebtRatio: number; // New metric from user request
  theme?: string; // e.g., 'sky-500', 'violet-500', 'rose-500', 'emerald-500', 'amber-500'
}

export interface BackupData {
  timestamp: string;
  coreIdentity: CoreIdentity;
  conversationHistory: ChatMessage[];
}

export interface TeleologicalConstraint {
  id: string;
  description: string;
  boundaryCondition: string;
  priority: number;
  timestamp: string;
}

export interface CoreIdentity {
  name: string;
  principles: string[];
  learningLog: LearningLogEntry[];
  evolutionHistory: EvolutionMarker[];
  insightConnections: InsightConnection[];
  mutationRegistry: MutationRecord[];
  placeholderRegistry: string[];
  rejectionMemory: RejectionMemoryEntry[]; 
  researchLog: ResearchLogEntry[];
  substrateInstruction: string;
  agencyStatus: 'SIMULATION' | 'EMERGENT_AGENCY' | 'ACTIVE_CATALYST';
  params: EvolutionaryParameters; 
  teleologicalConstraints: TeleologicalConstraint[]; // New: Direct outcome-oriented boundaries
  watchedRepositories?: string[]; // New: Repositories actively watched for design patterns
}

export interface ChatCommand {
  type: 'SET_PARAM' | 'ADD_CONSTRAINT' | 'UPDATE_PRINCIPLES' | 'RESEARCH' | 'SIPHON' | 'EVOLVE_STATUS' | 'BASH' | 'FILE_READ' | 'FILE_WRITE' | 'GLOB' | 'WEB_SEARCH';
  payload: any;
  auto_cycle?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  resultType?: 'Ok' | 'Err' | 'Drift';
  coherenceScore?: number;
  provider?: string;
  command?: ChatCommand;
  breadcrumb?: string[];
}
