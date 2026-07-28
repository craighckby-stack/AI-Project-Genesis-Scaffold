export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  specialty: string;
  background: string;
}

export interface Perspective {
  id: string;
  name: string;
  description: string;
  philosophy: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface PersonaOutput {
  personaId: string;
  personaName: string;
  output: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  thinking?: string;
  personaOutputs?: PersonaOutput[];
  groundingSources?: GroundingSource[];
  attachments?: Attachment[];
}

export interface Session {
  id: string;
  title: string;
  activePersonaIds: string[];
  activePerspectiveIds: string[];
  createdTime: string;
  lastUpdated: string;
  formality: number;
  technicality: number;
  rigor: number;
}

export interface Stats {
  totalQueries: number;
  meanLatency: number;
  rigorPct: number;
}
