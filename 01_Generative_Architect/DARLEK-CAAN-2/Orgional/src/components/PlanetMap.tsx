import React, { useRef, useEffect } from "react";
import { WorldState, Agent } from "../engine/types";

interface PlanetMapProps {
  world: WorldState;
  agents: Agent[];
  selectedAgentId: number | null;
}

export const PlanetMap: React.FC<PlanetMapProps> = ({ world, agents, selectedAgentId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ world, agents, selectedAgentId });

  // Keep references updated so that the animation frame loop has access to the freshest props
  useEffect(() => {
    propsRef.current = { world, agents, selectedAgentId };
  }, [world, agents, selectedAgentId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const { width, height } = canvas;
      const { world, agents, selectedAgentId } = propsRef.current;

      const padding = 5;
      const mapW = width - padding * 2;
      const mapH = height - padding * 2;

      // Cache dimensions or resolve dynamically based on viewpoint bounding conditions
      const worldW = window.innerWidth > 1024 ? window.innerWidth - 320 : window.innerWidth;
      const worldH = window.innerHeight;

      // High contrast deep slate background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      const scaleX = (x: number) => padding + (Math.max(0, Math.min(worldW, x)) / worldW) * mapW;
      const scaleY = (y: number) => padding + (Math.max(0, Math.min(worldH, y)) / worldH) * mapH;

      const currentTime = Date.now();

      // Render pulsing and expanding Nation territories
      if (world.nations) {
        world.nations.forEach((n, idx) => {
          const nx = scaleX(n.center.x);
          const ny = scaleY(n.center.y);

          // Pulse settings:
          // Prosperity increases the amplitude (richer nations have wider spheres of projection)
          // Population increases the pulse frequency (vibrancy of populous activity)
          const pulseSpeed = 0.0015 + (n.population * 0.000008) + (n.prosperity * 0.000005);
          const pulseAmount = 0.06 + (n.prosperity / 250);
          
          const pulseFactor = 1.0 + Math.sin(currentTime * pulseSpeed + idx * 1.5) * pulseAmount;
          
          const baseSize = (n.prosperity / 100) * 22 * (1 + n.techLevel / 5);
          const pulsingSize = baseSize * pulseFactor;

          // 1. Soft glowing filled influence gradient
          ctx.fillStyle = n.color;
          ctx.globalAlpha = 0.05 + Math.sin(currentTime * pulseSpeed + idx * 1.5) * 0.015;
          ctx.beginPath();
          ctx.arc(nx, ny, pulsingSize, 0, Math.PI * 2);
          ctx.fill();

          // 2. Outward traveling ripple line (representing the sphere of active propagation)
          const rippleDuration = 2200 - (n.techLevel * 100); // Higher tech ripples propagate faster
          const rippleTime = (currentTime % rippleDuration) / rippleDuration;
          const rippleRadius = baseSize * (1.0 + rippleTime * 1.5);
          const rippleAlpha = Math.max(0, 0.18 * (1.0 - rippleTime));

          ctx.strokeStyle = n.color;
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = rippleAlpha;
          ctx.beginPath();
          ctx.arc(nx, ny, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 3. Steady subtle borders (reference perimeter boundaries)
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 0.9;
          ctx.globalAlpha = 0.22;
          ctx.beginPath();
          ctx.arc(nx, ny, baseSize, 0, Math.PI * 2);
          ctx.stroke();

          // 4. Solid capitol mainframe coordinate core
          ctx.fillStyle = n.color;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Agent Distributions (Sparse selection for layout performance)
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.globalAlpha = 1.0;
      const agentStep = Math.max(2, Math.floor(agents.length / 50));
      for (let i = 0; i < agents.length; i += agentStep) {
          const a = agents[i];
          if (a.id === selectedAgentId) continue;
          ctx.fillRect(scaleX(a.x), scaleY(a.y), 1.2, 1.2);
      }

      // Highlight selected agents with a glowing golden laser orbit
      if (selectedAgentId !== null) {
        const selected = agents.find(a => a.id === selectedAgentId);
        if (selected) {
          const sx = scaleX(selected.x);
          const sy = scaleY(selected.y);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sx, sy, 6 + Math.sin(currentTime / 180) * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Outer Substrate Map HUD panel frame
      ctx.strokeStyle = "rgba(30, 41, 59, 1)";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1.0;
      ctx.strokeRect(0, 0, width, height);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative group">
      <div className="absolute -top-3 left-2 px-2 bg-slate-900 border border-slate-700 rounded text-[8px] text-slate-500 monospace uppercase tracking-tighter z-10">
        Global_Substrate_Map
      </div>
      <canvas 
        ref={canvasRef} 
        width={160} 
        height={100} 
        className="rounded-lg border border-slate-800 bg-slate-950 shadow-2xl transition-transform group-hover:scale-105"
      />
    </div>
  );
};
