import React, { useMemo, useEffect, useState } from 'react';
import { EvolutionPhase } from '../types';
import { calculateQuantumState, QUANTUM_THEMES } from '../utils/quantum-physics';

interface ThreeGemProps {
  insightCount: number;
  mutationCount: number;
  phase: EvolutionPhase | 'IDLE' | null;
  className?: string;
}

/**
 * ThreeGem: Quantum Visualization Engine v3.0
 * 
 * Siphoned Architectures:
 * - Orbital Mechanics: nbody_gravitational_simulator
 * - Quantum State Mapping: unitary-core
 * - Phase Transition Logic: sovereign-final
 */
export const ThreeGem: React.FC<ThreeGemProps> = ({ 
  insightCount, 
  mutationCount, 
  phase = 'IDLE', 
  className = "" 
}) => {
  const [fluctuation, setFluctuation] = useState(0);

  // Quantum Fluctuation Loop (Siphoned from DARLEK-CAAN-2 World Sim)
  useEffect(() => {
    let frameId: number;
    const update = () => {
      setFluctuation(prev => (prev + 0.05) % (Math.PI * 2));
      frameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const totalSubstrates = insightCount + mutationCount;
  
  const state = useMemo(() => 
    calculateQuantumState(insightCount, mutationCount, phase || 'IDLE'),
    [insightCount, mutationCount, phase]
  );

  const theme = QUANTUM_THEMES[phase || 'IDLE'] || QUANTUM_THEMES.IDLE;

  // Dynamic SVG Path for the 'Quantum Shard'
  const shardPath = useMemo(() => {
    const jitter = phase === 'MUTATION' ? Math.sin(fluctuation) * 2 : 0;
    return `M 50 ${10 + jitter} L 90 30 L 90 70 L 50 ${90 - jitter} L 10 70 L 10 30 Z`;
  }, [phase, fluctuation]);

  return (
    <div className={`relative h-[320px] w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/50 flex flex-col items-center justify-center p-8 shadow-2xl transition-colors duration-1000 ${className}`}>
      {/* Background Quantum Field */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${theme.gradient}`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Primary Visualization */}
      <div className="relative z-10 w-64 h-64 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
            <filter id="quantum-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Orbital Rings (N-Body Siphoned) */}
          {[1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx="50"
              cy="50"
              rx={30 + i * 10}
              ry={15 + i * 5}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.2"
              className={`${theme.color} opacity-20 ${theme.spin}`}
              style={{ 
                transformOrigin: 'center', 
                animationDuration: `${state.rotationSpeed * (1 + i * 0.5)}s`,
                animationDirection: i % 2 === 0 ? 'reverse' : 'normal'
              }}
            />
          ))}

          {/* The Core Shard */}
          <path
            d={shardPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`${theme.color} ${theme.pulse} transition-all duration-700`}
            filter="url(#quantum-glow)"
          />

          {/* Singularity Point */}
          <circle
            cx="50"
            cy="50"
            r={state.coreRadius}
            fill="currentColor"
            className={`${theme.color} transition-all duration-1000 ease-out`}
          />
          
          {/* Entropy Particles */}
          {phase === 'MUTATION' && Array.from({ length: 8 }).map((_, i) => (
            <circle
              key={i}
              cx={50 + Math.cos(fluctuation + i) * 35}
              cy={50 + Math.sin(fluctuation + i) * 35}
              r="0.8"
              className={`${theme.color} animate-ping`}
            />
          ))}
        </svg>
      </div>

      {/* Telemetry Overlay */}
      <div className="mt-8 w-full max-w-[200px] space-y-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold tracking-tighter">PHASE_STATUS</span>
            <span className={`font-mono text-sm font-black tracking-widest ${theme.color}`}>
              {phase || 'SYSTEM_IDLE'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold tracking-tighter">COHERENCE</span>
            <div className="text-xs font-mono text-slate-300">{(state.coherence * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Progress Bar (Substrate Density) */}
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${theme.bg}`}
            style={{ width: `${Math.min((totalSubstrates / 200) * 100, 100)}%` }}
          />
        </div>

        <div className="flex justify-between font-mono text-[9px] text-slate-600">
          <span>ENTROPY: {state.entropy.toFixed(3)}</span>
          <span>NODES: {totalSubstrates.toString().padStart(4, '0')}</span>
        </div>
      </div>
    </div>
  );
};