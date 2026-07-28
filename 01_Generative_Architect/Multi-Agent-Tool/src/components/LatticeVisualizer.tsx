import React, { useMemo } from 'react';
import { Persona, Perspective } from '../types';

interface LatticeVisualizerProps {
  activePersonaIds: string[];
  activePerspectiveIds: string[];
  personas: Persona[];
  perspectives: Perspective[];
  isSynthesizing: boolean;
}

export const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({
  activePersonaIds,
  activePerspectiveIds,
  personas,
  perspectives,
  isSynthesizing
}) => {
  const width = 450;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;

  // Compute positions for 6 Personas in an inner hexagon ring
  const personaPositions = useMemo(() => {
    const r = 85; // inner ring radius
    return personas.map((p, i) => {
      const angle = (i * 2 * Math.PI) / personas.length - Math.PI / 2;
      return {
        id: p.id,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        name: p.name,
        color: i % 2 === 0 ? '#38bdf8' : '#a855f7' // alternate sky-blue and purple
      };
    });
  }, [personas, cx, cy]);

  // Compute positions for 8 Perspectives in an outer octagonal ring
  const perspectivePositions = useMemo(() => {
    const r = 145; // outer ring radius
    return perspectives.map((p, i) => {
      const angle = (i * 2 * Math.PI) / perspectives.length;
      return {
        id: p.id,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        name: p.name
      };
    });
  }, [perspectives, cx, cy]);

  // Connections between personas (Lattice meshes)
  const links = useMemo(() => {
    const list: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    for (let i = 0; i < personaPositions.length; i++) {
      for (let j = i + 1; j < personaPositions.length; j++) {
        const p1 = personaPositions[i];
        const p2 = personaPositions[j];
        const active = activePersonaIds.includes(p1.id) && activePersonaIds.includes(p2.id);
        list.push({
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          active,
          id: `${p1.id}-${p2.id}`
        });
      }
    }
    return list;
  }, [personaPositions, activePersonaIds]);

  return (
    <div id="lattice-visualizer" className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden shadow-2xl flex flex-col items-center">
      <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
        <span className={`w-2 h-2 rounded-full ${isSynthesizing ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></span>
        <span>Agent Network</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-md">

        {/* Outer Perspective Nodes to Inner Persona Nodes Lines */}
        {perspectivePositions.map((pNode, index) => {
          const isPerspActive = activePerspectiveIds.includes(pNode.id);
          // Find closest persona nodes
          return personaPositions.map((perNode) => {
            const isPersonaActive = activePersonaIds.includes(perNode.id);
            const lineActive = isPerspActive && isPersonaActive;

            return (
              <line
                key={`${pNode.id}-${perNode.id}`}
                x1={pNode.x}
                y1={pNode.y}
                x2={perNode.x}
                y2={perNode.y}
                stroke={lineActive ? '#10b981' : '#334155'}
                strokeWidth={lineActive ? 1.5 : 0.5}
                strokeDasharray={lineActive ? 'none' : '2,4'}
                opacity={lineActive ? 0.6 : 0.25}
                className="transition-all duration-500"
              />
            );
          });
        })}

        {/* Inner Persona Wires / Lattice Wires */}
        {links.map((link) => (
          <g key={link.id}>
            <line
              x1={link.x1}
              y1={link.y1}
              x2={link.x2}
              y2={link.y2}
              stroke={link.active ? '#a855f7' : '#1e293b'}
              strokeWidth={link.active ? 1.8 : 0.8}
              opacity={link.active ? 0.75 : 0.2}
              className="transition-all duration-500"
            />
            {/* Pulsing signal transfer when synthesizing */}
            {link.active && isSynthesizing && (
              <circle r="4" fill="#38bdf8">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M ${link.x1} ${link.y1} L ${link.x2} ${link.y2}`}
                />
              </circle>
            )}
          </g>
        ))}

        {/* Center Quantum Singularity */}
        <circle cx={cx} cy={cy} r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" filter="url(#glow-blue)" opacity="0.8" />
        <circle cx={cx} cy={cy} r="6" fill="#a855f7" className={isSynthesizing ? 'animate-ping' : ''} />

        {/* Render Outer Perspective Nodes */}
        {perspectivePositions.map((node) => {
          const isActive = activePerspectiveIds.includes(node.id);
          return (
            <g key={node.id} className="cursor-default select-none">
              <circle
                cx={node.x}
                cy={node.y}
                r="6"
                fill={isActive ? '#10b981' : '#1e293b'}
                stroke={isActive ? '#34d399' : '#475569'}
                strokeWidth="1.5"
                className="transition-all duration-500"
              />
              {/* Optional Text Overlay */}
              <text
                x={node.x}
                y={node.y - 10}
                textAnchor="middle"
                fill={isActive ? '#a7f3d0' : '#475569'}
                className="text-[9px] font-mono font-bold uppercase transition-all duration-500"
              >
                {node.name.split(' ')[0]}
              </text>
            </g>
          );
        })}

        {/* Render Inner Persona Nodes */}
        {personaPositions.map((node) => {
          const isActive = activePersonaIds.includes(node.id);
          return (
            <g key={node.id} className="cursor-default select-none">
              {/* Pulsing outer ring */}
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="24"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1.5"
                  className="animate-ping"
                  opacity="0.3"
                />
              )}
              {/* Solid Background */}
              <circle
                cx={node.x}
                cy={node.y}
                r="18"
                fill={isActive ? '#1e1b4b' : '#0f172a'}
                stroke={isActive ? node.color : '#334155'}
                strokeWidth="2"
                className="transition-all duration-500"
              />
              {/* Label inside node */}
              <text
                cx={node.x}
                cy={node.y}
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill={isActive ? '#ffffff' : '#64748b'}
                className="text-[10px] font-sans font-extrabold tracking-tight transition-all duration-500"
              >
                {node.name.split(' ')[0][0]}
                {node.name.split(' ').length > 1 ? node.name.split(' ')[1][0] : ''}
              </text>
              {/* Label outside node */}
              <text
                x={node.x}
                y={node.y + 28}
                textAnchor="middle"
                fill={isActive ? '#f1f5f9' : '#475569'}
                className="text-[9px] font-sans font-semibold tracking-wide transition-all duration-500"
              >
                {node.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
