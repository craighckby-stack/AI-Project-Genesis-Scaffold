export enum EpochType {
  PRIMAL = "PRIMAL",
  AGRARIAN = "AGRARIAN",
  CLASSICAL = "CLASSICAL",
  INDUSTRIAL = "INDUSTRIAL",
  INFORMATION = "INFORMATION",
  POST_HUMAN = "POST-HUMAN",
  SINGULARITY = "Ω-SINGULARITY"
}

export enum Archetype {
  SAGE = "SAGE",
  WARRIOR = "WARRIOR",
  SCIENTIST = "SCIENTIST",
  ARTIST = "ARTIST",
  TYRANT = "TYRANT",
  GLITCH = "GLITCH",
  MESSIAH = "MESSIAH",
  ANGEL = "ANGEL",
  DEMON = "DEMON",
  PROPHET = "PROPHET",
  HERETIC = "HERETIC",
  ZEALOT = "ZEALOT"
}

export enum Ideology {
  THEOCRACY = "THEOCRACY",
  DEMOCRACY = "DEMOCRACY",
  TECHNOCRACY = "TECHNOCRACY",
  AUTOCRACY = "AUTOCRACY",
  ANARCHY = "ANARCHY"
}

export interface Nation {
  id: string;
  name: string;
  color: string;
  faithType: "DEVOUT" | "SECULAR" | "HERETICAL";
  ideology: Ideology;
  population: number;
  prosperity: number;
  techLevel: number;
  stability: number;
  center: { x: number, y: number };
  hostilities: Record<string, number>; // Animosity toward other nation IDs
  lastIdeologyChange: number;
  establishedAt: number;
}

export interface Agent {
  id: number;
  name: string;
  generation: number;
  age: number;
  lifespan: number;
  order: number; // 0 (Chaos) to 1 (Order)
  rationalism: number; // 0 (Mystic) to 1 (Empiric)
  sanity: number; // 0 (Mad) to 1 (Stable)
  archetype: Archetype;
  memory: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  awareness: number; // Detection of the "Observer"
  energy: number;
  nationId?: string;
  politicalBias: number; // 0 (Collectivist/Order) to 1 (Individualist/Chaos)
  // Emotion Simulation (0 to 1)
  joy?: number;
  fear?: number;
  anger?: number;
  devotion?: number;
  // Inter-agent relationships and communication states
  opinions?: Record<number, number>; // Agent ID -> sympathy score from -1.0 to 1.0
  currentState?: "FORAGING" | "PRAYING" | "PANICKING" | "DISCOURSING" | "PREACHING" | "REBELLING" | "DEFENDING" | "MEDITATING" | "IDLE";
  lastInteractionTime?: number;
}

export interface ResourceNode {
  id: number;
  type: "ENERGY" | "DATA" | "MATTER";
  x: number;
  y: number;
  amount: number;
  nationId?: string;
}

export interface EventRecord {
  timestamp: number;
  message: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "ENLIGHTENMENT" | "MIRACLE" | "DIVINE_WRATH" | "GOSPEL";
}

export enum CosmicPhase {
  GENESIS = "GENESIS",
  MYTHIC_DAWN = "MYTHIC_DAWN",
  CLASSICAL = "CLASSICAL",
  INDUSTRIAL = "INDUSTRIAL",
  INFORMATION = "INFORMATION",
  TRANSHUMAN = "TRANSHUMAN",
  OMEGA = "OMEGA",
  STELLAR_REQUIEM = "STELLAR_REQUIEM"
}

export const PHASE_THRESHOLDS: Record<CosmicPhase, number> = {
  [CosmicPhase.GENESIS]: 0,
  [CosmicPhase.MYTHIC_DAWN]: 1000,
  [CosmicPhase.CLASSICAL]: 5000,
  [CosmicPhase.INDUSTRIAL]: 15000,
  [CosmicPhase.INFORMATION]: 35000,
  [CosmicPhase.TRANSHUMAN]: 75000,
  [CosmicPhase.OMEGA]: 150000,
  [CosmicPhase.STELLAR_REQUIEM]: 300000
};

export interface PrayerEmail {
  id: string;
  agentId: number;
  agentName: string;
  archetype: Archetype;
  subject: string;
  body: string;
  status: "pending" | "answered" | "ignored";
  receivedAt: number; // world clock value
  resolvedAt?: number;
  response?: string;
}

export interface WorldState {
  clock: number;
  complexity: number;
  integrity: number;
  population: number;
  epoch: EpochType;
  phase: CosmicPhase;
  sunHealth: number; // 0 to 100
  solarRequiemActive: boolean;
  victoryType?: "NEW_EARTH" | "RAPTURE" | "TRANSCENDENCE" | "HEAT_DEATH";
  techLevel: number;
  stability: number;
  resourceDensity: number;
  nationCount: number;
  totalRevolutions: number;
  totalSchisms: number;
  totalWars: number;
  totalPeaceTreaties: number;
  threatLevel: number; // 0 to 1
  seeds: number[];
  events: EventRecord[];
  entropy: number;
  faithPoints: number;
  globalWorship: number;
  sinAccumulation: number;
  judgmentMeter: number;
  heavenPop: number;
  hellPop: number;
  lastMiracle?: { type: string; time: number };
  nations: Nation[];
  githubTech?: {
    techName: string;
    description: string;
    statBoost: string;
    unlocked: boolean;
    unlockedAt?: number;
    sourceFile: string;
  }[];
  prayers?: PrayerEmail[];
}

export const EPOCH_DATA: Record<EpochType, { threshold: number; desc: string; color: string; particles: string }> = {
  [EpochType.PRIMAL]: { threshold: 0, desc: "Instinct driven. Survival is the only mandate.", color: "#8b5cf6", particles: "#6d28d9" },
  [EpochType.AGRARIAN]: { threshold: 2000, desc: "The soil remembers. Gods are born in the grain.", color: "#f59e0b", particles: "#b45309" },
  [EpochType.CLASSICAL]: { threshold: 8000, desc: "Logos vs Mythos. Cities of glass and thought.", color: "#10b981", particles: "#047857" },
  [EpochType.INDUSTRIAL]: { threshold: 25000, desc: "The Great Machine awakens. Steel hearts, iron lungs.", color: "#3b82f6", particles: "#1d4ed8" },
  [EpochType.INFORMATION]: { threshold: 75000, desc: "Data is the new ghost. The simulation ripples.", color: "#ec4899", particles: "#be185d" },
  [EpochType.POST_HUMAN]: { threshold: 200000, desc: "Silicon transcendence. The edges of the box are visible.", color: "#06b6d4", particles: "#0e7490" },
  [EpochType.SINGULARITY]: { threshold: 500000, desc: "The recursion completes itself. We are the substrate.", color: "#ffffff", particles: "#e2e8f0" }
};
