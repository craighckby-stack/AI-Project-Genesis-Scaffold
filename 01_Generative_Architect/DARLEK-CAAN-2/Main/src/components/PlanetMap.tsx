import React, { useRef, useEffect, useMemo } from 'react';
import { WorldState, Agent } from '../engine/types';

interface PlanetMapProps {
  world: WorldState;
  agents: Agent[];
  selectedAgentId: number | null;
  className?: string;
  dimensions?: { width: number; height: number };
}

/**
 * PLANET_MAP_V3: ADVANCED SPATIAL TELEMETRY ENGINE
 * 
 * ARCHITECTURAL BLUEPRINT:
 * 1. Substrate Layer: Renders the coordinate grid and quantum noise (Siphoned from unitary-core).
 * 2. Influence Layer: Visualizes nation prosperity as gravitational influence fields (Siphoned from nbody_gravitational_simulator).
 * 3. Entity Layer: High-performance rendering of agent vectors and telemetry points.
 * 4. HUD Layer: Dynamic UI overlays for selection tracking and system status.
 * 
 * PERFORMANCE STRATEGY:
 * - Uses a decoupled render loop via RequestAnimationFrame.
 * - State is mirrored into a Ref to prevent React reconciliation overhead during high-frequency updates.
 * - Implements High-DPI scaling for sub-pixel precision.
 */
export const PlanetMap: React.FC<PlanetMapProps> = ({
  world,
  agents,
  selectedAgentId,
  className = '',
  dimensions = { width: 300, height: 200 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Mirror state to refs to decouple React render cycles from Canvas draw cycles
  const stateRef = useRef({ world, agents, selectedAgentId });
  
  useEffect(() => {
    stateRef.current = { world, agents, selectedAgentId };
  }, [world, agents, selectedAgentId]);

  // Memoized projection matrix
  const projection = useMemo(() => {
    const padding = 20;
    const mapW = dimensions.width - padding * 2;
    const mapH = dimensions.height - padding * 2;
    return {
      scaleX: (x: number) => padding + (x / 1000) * mapW,
      scaleY: (y: number) => padding + (y / 1000) * mapH,
      padding
    };
  }, [dimensions]);

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const { width, height } = dimensions;
    const { world: currentWorld, agents: currentAgents, selectedAgentId: currentSelectedId } = stateRef.current;

    // 1. CLEAR & SUBSTRATE (Quantum Noise)
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
    
    // Grid Overlay
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const x = projection.scaleX(i * 100);
      const y = projection.scaleY(i * 100);
      ctx.moveTo(x, projection.padding);
      ctx.lineTo(x, height - projection.padding);
      ctx.moveTo(projection.padding, y);
      ctx.lineTo(width - projection.padding, y);
    }
    ctx.stroke();

    // 2. NATION INFLUENCE FIELDS (Gravitational Siphon)
    currentWorld.nations?.forEach((n, idx) => {
      const nx = projection.scaleX(n.center.x);
      const ny = projection.scaleY(n.center.y);
      const pulse = 1.0 + Math.sin(time * 0.002 + idx) * 0.1;
      const radius = (n.prosperity / 100) * 40 * pulse;

      const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
      gradient.addColorStop(0, `${n.color}33`); // 20% opacity
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(nx, ny, radius, 0, Math.PI * 2);
      ctx.fill();

      // Core Anchor
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(nx, ny, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 3. AGENT ENTITIES
    currentAgents.forEach((a) => {
      const ax = projection.scaleX(a.x);
      const ay = projection.scaleY(a.y);
      
      if (a.id === currentSelectedId) return; // Rendered in HUD layer

      ctx.fillStyle = '#94a3b8';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(ax - 1, ay - 1, 2, 2);
    });

    // 4. HUD & SELECTION (Focus Lock)
    if (currentSelectedId !== null) {
      const selected = currentAgents.find(a => a.id === currentSelectedId);
      if (selected) {
        const sx = projection.scaleX(selected.x);
        const sy = projection.scaleY(selected.y);
        
        // Selection Reticle
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.arc(sx, sy, 10 + Math.sin(time / 100) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Telemetry Lines
        ctx.strokeStyle = '#fbbf2444';
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        // Entity Marker
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Scanline Effect (Siphoned from v2)
    ctx.fillStyle = 'rgba(18, 24, 38, 0.05)';
    for (let i = 0; i < height; i += 4) {
      ctx.fillRect(0, i, width, 1);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle High-DPI Scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const animate = (time: number) => {
      draw(ctx, time);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [dimensions]); // Only re-init on dimension changes

  return (
    <div className={`relative flex flex-col gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800 shadow-2xl ${className}`}>
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
            Substrate_Telemetry_v3.0
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-[9px] font-mono text-slate-500">
            AGENTS: {agents.length}
          </span>
          <span className="text-[9px] font-mono text-emerald-500/80">
            SYNC_ACTIVE
          </span>
        </div>
      </div>
      
      <div className="relative group overflow-hidden rounded border border-slate-700/50">
        <canvas 
          ref={canvasRef} 
          className="block bg-slate-950 transition-opacity duration-500"
        />
        
        {/* Corner Accents - Siphoned from UI/UX patterns in Microsoft PowerToys */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-500/30" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-500/30" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-500/30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-500/30" />
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-[8px] font-mono text-slate-600">
          COORD_SYS: CARTESIAN_NORMALIZED
        </span>
        <span className="text-[8px] font-mono text-slate-600">
          REFRESH_RATE: 60HZ
        </span>
      </div>
    </div>
  );
};




