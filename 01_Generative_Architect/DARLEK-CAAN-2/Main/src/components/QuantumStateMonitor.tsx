import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * @interface QuantumMetrics
 * Represents the telemetry data for the agent swarm's quantum state.
 */
interface QuantumMetrics {
  coherence: number;
  entanglement: number;
  superposition: number;
  activeNodes: number;
  latency: number;
}

/**
 * QuantumStateMonitor
 * 
 * An evolved visualization component that monitors the real-time state of the Agent Swarm.
 * Siphons architectural patterns from microsoft/vscode (performance) and google/material-design (clarity).
 */
export const QuantumStateMonitor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState<QuantumMetrics>({
    coherence: 0.982,
    entanglement: 0.845,
    superposition: 12,
    activeNodes: 128,
    latency: 14,
  });

  // Simulation loop for quantum telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        coherence: Math.min(1, Math.max(0.8, prev.coherence + (Math.random() - 0.5) * 0.01)),
        entanglement: Math.min(1, Math.max(0.7, prev.entanglement + (Math.random() - 0.5) * 0.02)),
        latency: Math.floor(10 + Math.random() * 15),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Neural Mesh Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: { x: number; y: number; vx: number; vy: number }[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/50 backdrop-blur-md shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Quantum State Monitor</h2>
          <p className="text-[10px] text-slate-500 font-mono">SYSTEM_ID: DARLEK-CANN-V3-CORE</p>
        </div>
        <div className="flex gap-4">
          <MetricBadge label="COHERENCE" value={`${(metrics.coherence * 100).toFixed(1)}%`} color="text-emerald-400" />
          <MetricBadge label="LATENCY" value={`${metrics.latency}ms`} color="text-amber-400" />
        </div>
      </div>

      <div className="relative h-48 w-full bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={200} 
          className="w-full h-full opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest animate-pulse">
            Neural Mesh Synchronized
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatBlock label="Entanglement" value={metrics.entanglement.toFixed(3)} sub="Quantum Link" />
        <StatBlock label="Superposition" value={metrics.superposition} sub="Active States" />
        <StatBlock label="Active Nodes" value={metrics.activeNodes} sub="Swarm Density" />
      </div>
    </div>
  );
};

const MetricBadge: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="text-right">
    <div className="text-[9px] text-slate-500 font-bold">{label}</div>
    <div className={`text-xs font-mono ${color}`}>{value}</div>
  </div>
);

const StatBlock: React.FC<{ label: string; value: string | number; sub: string }> = ({ label, value, sub }) => (
  <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
    <div className="text-[10px] text-slate-400 uppercase">{label}</div>
    <div className="text-lg font-mono text-slate-200 my-1">{value}</div>
    <div className="text-[9px] text-slate-500 italic">{sub}</div>
  </div>
);



