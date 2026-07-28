export type EvolutionPhase = 'QUESTION' | 'RESEARCH' | 'ANSWER' | 'COHERENCE' | 'DEBATE' | 'DECISION' | 'MUTATION' | 'COMMIT' | 'DEPLOYMENT';

export type AgencyStatus = 'SIMULATION' | 'EMERGENT_AGENCY' | 'ACTIVE_CATALYST';

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
  cdr: number;
}

export interface ResearchLogEntry {
  id: string;
  topic: string;
  findings: string;
  suggestedNextQueries: string[];
  timestamp: string;
}

export interface MutationRecord {
  id: string;
  phase: EvolutionPhase;
  content: string;
  timestamp: string;
  ccrrScore: number;
  source: string;
  utilityScore: number;
}

export interface RejectionMemoryEntry {
  id: string;
  pattern: string;
  reason: string;
  timestamp: string;
  vectorId?: string;
}

export interface EvolutionaryParameters {
  rigidity: number;
  autonomy: number;
  threshold: number;
  atrophyThreshold: number;
  specificityThreshold: number;
  agencyThreshold: number;
  friction: number;
  contextualDebtRatio: number;
  theme?: string;
}

export interface TeleologicalConstraint {
  id: string;
  description: string;
  boundaryCondition: string;
  priority: number;
  timestamp: string;
}

export interface QuantumState {
  entanglementId: string;
  coherenceLevel: number;
  dimensionalDepth: number;
  lastSync: string;
}

export interface CoreIdentity {
  name: string;
  principles: string[];
  learningLog: LearningLogEntry[];
  evolutionHistory: EvolutionMarker[];
  insightConnections: InsightConnection[];
  mutationRegistry: MutationRecord[];
  rejectionMemory: RejectionMemoryEntry[];
  researchLog: ResearchLogEntry[];
  substrateInstruction: string;
  agencyStatus: AgencyStatus;
  params: EvolutionaryParameters;
  teleologicalConstraints: TeleologicalConstraint[];
  watchedRepositories: string[];
  quantumState: QuantumState;
}

export type ChatCommandType = 
  | 'SET_PARAM' | 'ADD_CONSTRAINT' | 'UPDATE_PRINCIPLES' | 'RESEARCH' 
  | 'SIPHON' | 'EVOLVE_STATUS' | 'BASH' | 'FILE_READ' | 'FILE_WRITE' 
  | 'GLOB' | 'WEB_SEARCH';

export interface ChatCommand {
  type: ChatCommandType;
  payload: Record<string, unknown>;
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

export interface BackupData {
  timestamp: string;
  coreIdentity: CoreIdentity;
  conversationHistory: ChatMessage[];
}























