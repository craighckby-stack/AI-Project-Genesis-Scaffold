import { EvolutionPhase } from '../types';

export interface QuantumState {
  coreRadius: number;
  glowStrength: number;
  rotationSpeed: number;
  entropy: number;
  coherence: number;
}

export const QUANTUM_THEMES: Record<string, any> = {
  IDLE: {
    color: 'text-blue-500',
    bg: 'bg-blue-500',
    gradient: 'from-blue-900/20 via-slate-950 to-black',
    spin: 'animate-spin-slow',
    pulse: 'animate-pulse'
  },
  MUTATION: {
    color: 'text-amber-500',
    bg: 'bg-amber-500',
    gradient: 'from-amber-900/20 via-slate-950 to-black',
    spin: 'animate-spin-fast',
    pulse: 'animate-ping'
  },
  COHERENCE: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-400',
    gradient: 'from-emerald-900/20 via-slate-950 to-black',
    spin: 'animate-spin-slower',
    pulse: 'animate-pulse'
  },
  DEBATE: {
    color: 'text-violet-500',
    bg: 'bg-violet-500',
    gradient: 'from-violet-900/20 via-slate-950 to-black',
    spin: 'animate-spin-hyper',
    pulse: 'animate-pulse'
  }
};

export const calculateQuantumState = (
  insights: number, 
  mutations: number, 
  phase: string
): QuantumState => {
  const total = insights + mutations;
  const entropyBase = mutations / (insights + 1);
  
  // Siphoned from unitary-core: Quantum Coherence Formula
  const coherence = insights > 0 ? Math.min(insights / (mutations + insights), 1) : 0;
  
  return {
    coreRadius: Math.min(4 + (total * 0.1), 12),
    glowStrength: Math.min(5 + (total * 0.5), 30),
    rotationSpeed: phase === 'MUTATION' ? 2 : Math.max(1, 8 - (total * 0.02)),
    entropy: Math.min(entropyBase, 10),
    coherence
  };
};