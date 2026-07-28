import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Agent, ResourceNode, WorldState, EPOCH_DATA } from '../engine/types';

interface Camera {
  zoom: number;
  rotation: number;
  pitch: number;
  offsetX: number;
  offsetY: number;
  viewMode: '2D' | '3D';
}

interface ViewportProps {
  agents: Agent[];
  resources: ResourceNode[];
  world: WorldState;
  onUpdate: (time: number, w: number, h: number) => void;
}

const projectCoord = (mx: number, my: number, mz: number, w: number, h: number, cam: Camera) => {
  const rx = mx - w / 2;
  const ry = my - h / 2;
  if (cam.viewMode === '2D') {
    return { x: rx * cam.zoom + cam.offsetX + w / 2, y: ry * cam.zoom + cam.offsetY + h / 2 };
  }
  const rotX = rx * Math.cos(cam.rotation) - ry * Math.sin(cam.rotation);
  const rotY = rx * Math.sin(cam.rotation) + ry * Math.cos(cam.rotation);
  return { 
    x: rotX * cam.zoom + cam.offsetX + w / 2, 
    y: (rotY * Math.cos(cam.pitch) - mz * Math.sin(cam.pitch)) * cam.zoom + cam.offsetY + h / 2 
  };
};

export const Viewport: React.FC<ViewportProps> = ({ agents, resources, world, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const camera = useRef<Camera>({ zoom: 0.9, rotation: Math.PI / 4, pitch: 1.05, offsetX: 0, offsetY: 30, viewMode: '3D' });

  useEffect(() => { camera.current.viewMode = viewMode; }, [viewMode]);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;
    onUpdate(time, w, h);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = EPOCH_DATA[world.epoch]?.color || '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;
    
    const gridStep = 80;
    for (let i = -5; i <= 5; i++) {
      const p1 = projectCoord(i * gridStep, -400, 0, w, h, camera.current);
      const p2 = projectCoord(i * gridStep, 400, 0, w, h, camera.current);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    agents.forEach(agent => {
      const pos = projectCoord(agent.x, agent.y, 0, w, h, camera.current);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [world.epoch, agents, onUpdate]);

  useEffect(() => {
    let frameId: number;
    const loop = (time: number) => {
      render(time);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [render]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <button 
          className="bg-slate-800/80 p-2 text-white rounded hover:bg-slate-700 transition-colors pointer-events-auto"
          onClick={() => setViewMode(v => v === '2D' ? '3D' : '2D')}>
          Mode: {viewMode}
        </button>
      </div>
    </div>
  );
};





























