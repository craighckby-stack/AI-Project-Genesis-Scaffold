export type Brand<K, T> = K & { readonly __brand: T };
export type DeepReadonly<T> = { readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P] };

export type NationID = Brand<string, 'NationID'>;
export type AgentID = Brand<string, 'AgentID'>;
export type EventID = Brand<string, 'EventID'>;

export enum EpochType {
  PRIMAL = "PRIMAL", AGRARIAN = "AGRARIAN", CLASSICAL = "CLASSICAL",
  INDUSTRIAL = "INDUSTRIAL", INFORMATION = "INFORMATION", POST_HUMAN = "POST-HUMAN",
  SINGULARITY = "Ω-SINGULARITY"
}

export enum Archetype {
  SAGE = "SAGE", WARRIOR = "WARRIOR", SCIENTIST = "SCIENTIST", ARTIST = "ARTIST",
  TYRANT = "TYRANT", GLITCH = "GLITCH", MESSIAH = "MESSIAH", ANGEL = "ANGEL",
  DEMON = "DEMON", PROPHET = "PROPHET", HERETIC = "HERETIC", ZEALOT = "ZEALOT"
}

export enum Ideology {
  THEOCRACY = "THEOCRACY", DEMOCRACY = "DEMOCRACY", TECHNOCRACY = "TECHNOCRACY",
  AUTOCRACY = "AUTOCRACY", ANARCHY = "ANARCHY"
}

export enum AgentState {
  FORAGING = "FORAGING", PRAYING = "PRAYING", PANICKING = "PANICKING",
  DISCOURSING = "DISCOURSING", PREACHING = "PREACHING", REBELLING = "REBELLING",
  DEFENDING = "DEFENDING", MEDITATING = "MEDITATING", IDLE = "IDLE"
}

export enum ResourceType { ENERGY = "ENERGY", DATA = "DATA", MATTER = "MATTER" }

export interface Position { readonly x: number; readonly y: number; }

export interface QuantumState {
  readonly coherence: number;
  readonly entanglementFactor: number;
  readonly superposition: boolean;
}

export interface Emotions {
  readonly joy: number; readonly fear: number;
  readonly anger: number; readonly devotion: number;
}

export interface Agent {
  readonly id: AgentID;
  readonly name: string;
  readonly archetype: Archetype;
  readonly position: Position;
  readonly energy: number;
  readonly emotions: Emotions;
  readonly currentState: AgentState;
  readonly quantum: QuantumState;
  readonly nationId?: NationID;
}

export interface Nation {
  readonly id: NationID;
  readonly name: string;
  readonly ideology: Ideology;
  readonly population: number;
  readonly stability: number;
  readonly center: Position;
}

export const ComputationEngine = {
  calculateEntropy: (nations: ReadonlyArray<Nation>, sin: number): number => 
    nations.reduce((acc, n) => acc + (n.stability * 0.1), 0) + sin,
  getAgentEfficiency: (agent: Agent): number => 
    (agent.emotions.joy + agent.energy + (agent.quantum.coherence * 10)) / 100
} as const;

export interface SystemTelemetry {
  readonly tickRate: number;
  readonly memoryUsage: number;
  readonly activeAgents: number;
  readonly lastSync: number;
  readonly quantumFlux: number;
}

export interface WorldState {
  readonly clock: number;
  readonly epoch: EpochType;
  readonly nations: ReadonlyArray<Nation>;
  readonly telemetry: SystemTelemetry;
  readonly sinAccumulation: number;
}

export interface EpochMetadata {
  readonly threshold: number;
  readonly desc: string;
  readonly color: string;
}

export const EPOCH_DATA: Record<EpochType, EpochMetadata> = {
  [EpochType.PRIMAL]: { threshold: 0, desc: "Instinct driven.", color: "#8b5cf6" },
  [EpochType.AGRARIAN]: { threshold: 2000, desc: "The soil remembers.", color: "#f59e0b" },
  [EpochType.CLASSICAL]: { threshold: 8000, desc: "Logos vs Mythos.", color: "#10b981" },
  [EpochType.INDUSTRIAL]: { threshold: 25000, desc: "The Great Machine.", color: "#3b82f6" },
  [EpochType.INFORMATION]: { threshold: 75000, desc: "Data is the ghost.", color: "#ec4899" },
  [EpochType.POST_HUMAN]: { threshold: 200000, desc: "Silicon transcendence.", color: "#06b6d4" },
  [EpochType.SINGULARITY]: { threshold: 500000, desc: "Recursion completes.", color: "#ffffff" }
};













