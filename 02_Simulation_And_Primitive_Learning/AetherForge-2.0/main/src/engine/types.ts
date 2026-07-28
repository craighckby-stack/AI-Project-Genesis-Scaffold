export enum CosmicPhase { GENESIS = "GENESIS", STELLAR_VOID = "STELLAR_VOID", RECONSTRUCTION = "RECONSTRUCTION", JUDGMENT = "JUDGMENT", REQUIEM_EXPLOSION = "REQUIEM_EXPLOSION", STELLAR_REQUIEM = "STELLAR_REQUIEM" }
export enum EpochType { PRIMAL = "PRIMAL", AWAKENING = "AWAKENING", ENLIGHTENMENT = "ENLIGHTENMENT", TRANSCENDENCE = "TRANSCENDENCE", SINGULARITY = "SINGULARITY", AGRARIAN = "AGRARIAN", CLASSICAL = "CLASSICAL", INDUSTRIAL = "INDUSTRIAL", INFORMATION = "INFORMATION", POST_HUMAN = "POST_HUMAN" }
export enum Ideology { THEOCRACY = "THEOCRACY", TECHNOCRACY = "TECHNOCRACY", DEMOCRACY = "DEMOCRACY", AUTOCRACY = "AUTOCRACY", ANARCHY = "ANARCHY" }
export enum Archetype { PRIEST = "PRIEST", SCHOLAR = "SCHOLAR", WARRIOR = "WARRIOR", ARTISAN = "ARTISAN", PROPHET = "PROPHET", ZEALOT = "ZEALOT", SCIENTIST = "SCIENTIST", HERETIC = "HERETIC", ANGEL = "ANGEL", DEMON = "DEMON", MESSIAH = "MESSIAH", TYRANT = "TYRANT", GLITCH = "GLITCH" }
export const EPOCH_DATA = { 
  [EpochType.PRIMAL]: { label: 'Primal Foundation', threshold: 0 }, 
  [EpochType.AWAKENING]: { label: 'Age of Awakening', threshold: 100 },
  [EpochType.ENLIGHTENMENT]: { label: 'Age of Enlightenment', threshold: 200 },
  [EpochType.TRANSCENDENCE]: { label: 'Era of Transcendence', threshold: 300 },
  [EpochType.SINGULARITY]: { label: 'Singularity', threshold: 400 },
  [EpochType.AGRARIAN]: { label: 'Agrarian', threshold: 50 },
  [EpochType.CLASSICAL]: { label: 'Classical', threshold: 150 },
  [EpochType.INDUSTRIAL]: { label: 'Industrial', threshold: 250 },
  [EpochType.INFORMATION]: { label: 'Information', threshold: 350 },
  [EpochType.POST_HUMAN]: { label: 'Post-Human', threshold: 450 }
};
export const PHASE_THRESHOLDS = {};
export interface ResourceNode { id: string; x: number; y: number; energy: number; amount: number; type: string; maxAmount?: number; }
export interface PrayerEmail { id: string; agentId: number; agentName: string; archetype: Archetype; subject: string; body: string; status: "answered" | "pending" | "ignored"; receivedAt: number; resolvedAt?: number; response?: string; }
export interface EventRecord { id?: string; timestamp: number; message: string; type: string; }
export interface Nation { id: string; name: string; color: string; faithType: string; ideology: Ideology; population: number; prosperity: number; techLevel: number; stability: number; center: { x: number, y: number }; hostilities: any; lastIdeologyChange: number; establishedAt: number; }
export interface Agent { id: number; name: string; archetype: Archetype; x: number; y: number; vx: number; vy: number; health: number; energy: number; faith: number; stress: number; consciousness: number; trueAwareness: number; isSubstrateAware: boolean; currentState: string; currentTask: string | null; targetId: string | null; nationId: string | null; memories: string[]; age: number; memory: string[]; awareness: number; sanity: number; devotion: number; fear: number; joy: number; anger: number; rationalism: number; generation: number; order: number; lifespan: number; politicalBias?: number; opinions?: any; lastInteractionTime?: number; }
export interface WorldState { clock: number; complexity: number; integrity: number; population: number; epoch: EpochType; phase: CosmicPhase; sunHealth: number; solarRequiemActive: boolean; techLevel: number; stability: number; resourceDensity: number; nationCount: number; totalRevolutions: number; totalSchisms: number; events: EventRecord[]; activeMiracle?: string; prayers?: PrayerEmail[]; faithPoints: number; githubTech?: any[]; nations: Nation[]; }








































































































