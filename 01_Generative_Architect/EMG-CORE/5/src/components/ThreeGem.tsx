import React, { useMemo } from 'react';
import { EvolutionPhase } from '../types';

interface ThreeGemProps {
  insightCount: number;
  mutationCount: number;
  phase: EvolutionPhase | 'IDLE' | null;
}

export const ThreeGem: React.FC<ThreeGemProps> = ({ insightCount, mutationCount, phase }) => {
  const totalSubstrates = insightCount + mutationCount;
  
  // Calculate dynamic visual metrics based on learning logs & mutations
  const coreRadius = useMemo(() => {
    return Math.min(6 + (totalSubstrates * 0.2), 24);
  }, [totalSubstrates]);

  const glowStrength = useMemo(() => {
    return Math.min(10 + (totalSubstrates * 0.5), 30);
  }, [totalSubstrates]);

  // Determine colors and animation rates based on evolution phase
  const visualConfig = useMemo(() => {
    switch (phase) {
      case 'MUTATION':
        return {
          primaryColor: '#f59e0b', // Amber
          secondaryColor: '#d97706',
          glowColor: 'rgba(245, 158, 11, 0.6)',
          innerGlow: 'rgba(217, 119, 6, 0.4)',
          phaseLabel: 'MUTATION CYCLE ACTIVE',
          spinDuration: '4s',
          pulseDuration: '1s',
          orbitOpacity: 0.9,
          particleSpeed: '1.5s',
        };
      case 'COHERENCE':
        return {
          primaryColor: '#ffffff', // Pure White
          secondaryColor: '#cbd5e1', // Slate
          glowColor: 'rgba(255, 255, 255, 0.7)',
          innerGlow: 'rgba(203, 213, 225, 0.3)',
          phaseLabel: 'COHERENCE CHECK',
          spinDuration: '16s',
          pulseDuration: '4s',
          orbitOpacity: 0.8,
          particleSpeed: '4s',
        };
      case 'DEBATE':
        return {
          primaryColor: '#8b5cf6', // Violet
          secondaryColor: '#ec4899', // Pink
          glowColor: 'rgba(139, 92, 246, 0.6)',
          innerGlow: 'rgba(236, 72, 153, 0.3)',
          phaseLabel: 'BICAMERAL DEBATE',
          spinDuration: '2s',
          pulseDuration: '0.8s',
          orbitOpacity: 0.9,
          particleSpeed: '1s',
        };
      default:
        return {
          primaryColor: '#3b82f6', // Bright Blue
          secondaryColor: '#06b6d4', // Cyan
          glowColor: 'rgba(59, 130, 246, 0.4)',
          innerGlow: 'rgba(6, 182, 212, 0.2)',
          phaseLabel: 'SUBSTRATE LINK SECURE',
          spinDuration: '10s',
          pulseDuration: '2.5s',
          orbitOpacity: 0.5,
          particleSpeed: '2.5s',
        };
    }
  }, [phase]);

  return (
    <div 
      id="core-gem-container" 
      className="h-[250px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 shadow-2xl border border-slate-800 flex flex-col items-center justify-center relative p-6 select-none"
    >
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-slate-950/80 pointer-events-none" />

      {/* SVG Projection Canvas */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full filter drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 ${glowStrength}px ${visualConfig.glowColor})`
          }}
        >
          {/* Radial glow filter */}
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={visualConfig.primaryColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={visualConfig.secondaryColor} stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={visualConfig.primaryColor} stopOpacity={visualConfig.orbitOpacity} />
              <stop offset="100%" stopColor={visualConfig.secondaryColor} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Core glow backdrop */}
          <circle cx="50%" cy="50%" r="22" fill="url(#coreGlow)" className="opacity-40 animate-pulse" style={{ animationDuration: visualConfig.pulseDuration }} />

          {/* Outer Rotating Astrolabe Ring 1 */}
          <g 
            className="origin-center" 
            style={{ 
              animation: `spin ${visualConfig.spinDuration} linear infinite`,
            }}
          >
            {/* Standard Dodecahedron skeleton projection */}
            <polygon 
              points="50,10 85,30 85,70 50,90 15,70 15,30" 
              fill="none" 
              stroke="url(#orbitGrad)" 
              strokeWidth="1.5" 
              strokeLinejoin="round" 
              className="transition-colors duration-500"
            />
            {/* Structural projection lines */}
            <line x1="50" y1="10" x2="50" y2="90" stroke={visualConfig.primaryColor} strokeWidth="0.5" strokeDasharray="2,2" className="opacity-40" />
            <line x1="15" y1="30" x2="85" y2="70" stroke={visualConfig.primaryColor} strokeWidth="0.5" strokeDasharray="2,2" className="opacity-40" />
            <line x1="15" y1="70" x2="85" y2="30" stroke={visualConfig.primaryColor} strokeWidth="0.5" strokeDasharray="2,2" className="opacity-40" />
            
            {/* Corner Nodes */}
            <circle cx="50" cy="10" r="1.5" fill={visualConfig.primaryColor} />
            <circle cx="85" cy="30" r="1.5" fill={visualConfig.primaryColor} />
            <circle cx="85" cy="70" r="1.5" fill={visualConfig.primaryColor} />
            <circle cx="50" cy="90" r="1.5" fill={visualConfig.primaryColor} />
            <circle cx="15" cy="70" r="1.5" fill={visualConfig.primaryColor} />
            <circle cx="15" cy="30" r="1.5" fill={visualConfig.primaryColor} />
          </g>

          {/* Inner Counter-Rotating Ring 2 */}
          <g 
            className="origin-center" 
            style={{ 
              animation: `spin-reverse ${visualConfig.spinDuration} linear infinite`,
            }}
          >
            <polygon 
              points="50,22 75,36 75,64 50,78 25,64 25,36" 
              fill="none" 
              stroke={visualConfig.secondaryColor} 
              strokeWidth="1" 
              className="opacity-60 transition-colors duration-500"
            />
          </g>

          {/* Central Quantum Node */}
          <circle 
            cx="50" 
            cy="50" 
            r={coreRadius} 
            fill={visualConfig.primaryColor} 
            className="transition-all duration-500"
          />
          
          {/* Breathing inner core ring */}
          <circle 
            cx="50" 
            cy="50" 
            r={coreRadius + 3} 
            fill="none" 
            stroke={visualConfig.secondaryColor} 
            strokeWidth="1.5" 
            className="animate-ping opacity-30" 
            style={{ animationDuration: '2s' }} 
          />
        </svg>

        {/* Dynamic overlay indicators */}
        <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none p-1">
          <span className="text-[8px] font-mono text-slate-500 tracking-[0.2em]">INTELLIGENCE CORE</span>
          <span className="text-[8px] font-mono text-slate-500 tracking-[0.2em]">{totalSubstrates} PATTERNS</span>
        </div>
      </div>

      {/* Evolution Status text overlay */}
      <div className="mt-2 text-center z-10">
        <span 
          className="text-[9px] font-mono tracking-[0.25em] uppercase font-semibold transition-colors duration-500 block"
          style={{ color: visualConfig.primaryColor }}
        >
          {visualConfig.phaseLabel}
        </span>
      </div>

      {/* Inject custom reverse spin keyframes if not present */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
