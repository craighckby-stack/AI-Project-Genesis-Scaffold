'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Settings,
  Activity,
  Globe,
  Compass,
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Info,
  Sparkles,
  Sliders,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Types & Interfaces
interface CelestialBody {
  id: string;
  name: string;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  trail: { x: number; y: number }[];
}

interface EnergyMetric {
  time: string;
  kinetic: number;
  potential: number;
  total: number;
}

// Presets
const PRESETS: Record<string, { name: string; description: string; bodies: CelestialBody[] }> = {
  solarSystem: {
    name: 'Solar System',
    description: 'A massive central star orbited by three planets at varying distances.',
    bodies: [
      { id: 'sun', name: 'Sun', mass: 12000, x: 0, y: 0, vx: 0, vy: 0, color: '#f59e0b', radius: 16, trail: [] },
      { id: 'earth', name: 'Earth', mass: 12, x: 130, y: 0, vx: 0, vy: 9.6, color: '#06b6d4', radius: 6, trail: [] },
      { id: 'mars', name: 'Mars', mass: 6, x: 190, y: 0, vx: 0, vy: 7.9, color: '#ef4444', radius: 5, trail: [] },
      { id: 'jupiter', name: 'Jupiter', mass: 150, x: 280, y: 0, vx: 0, vy: 6.5, color: '#f97316', radius: 10, trail: [] }
    ]
  },
  binaryStars: {
    name: 'Binary Stars',
    description: 'Two stars of equal mass orbiting their common barycenter.',
    bodies: [
      { id: 'star-a', name: 'Alpha Centauri A', mass: 6000, x: -90, y: 0, vx: 0, vy: -5.8, color: '#3b82f6', radius: 12, trail: [] },
      { id: 'star-b', name: 'Alpha Centauri B', mass: 6000, x: 90, y: 0, vx: 0, vy: 5.8, color: '#ec4899', radius: 12, trail: [] }
    ]
  },
  chaoticThreeBody: {
    name: 'Chaotic Three-Body',
    description: 'Three equal-mass stars interacting in a highly chaotic, unpredictable dance.',
    bodies: [
      { id: 'body-1', name: 'Proxima', mass: 5000, x: -120, y: -50, vx: 3.2, vy: 3.2, color: '#a855f7', radius: 9, trail: [] },
      { id: 'body-2', name: 'Centauri', mass: 5000, x: 120, y: -50, vx: -3.2, vy: 3.2, color: '#10b981', radius: 9, trail: [] },
      { id: 'body-3', name: 'Sol Prime', mass: 5000, x: 0, y: 100, vx: 0, vy: -6.4, color: '#f43f5e', radius: 9, trail: [] }
    ]
  },
  slingshot: {
    name: 'Gravity Slingshot',
    description: 'A light probe gaining velocity as it swings past a massive binary system.',
    bodies: [
      { id: 'heavy-1', name: 'Gargantua', mass: 15000, x: -60, y: -30, vx: 0.5, vy: -1.2, color: '#8b5cf6', radius: 14, trail: [] },
      { id: 'heavy-2', name: 'Pantagruel', mass: 10000, x: 60, y: 30, vx: -0.5, vy: 1.2, color: '#3b82f6', radius: 11, trail: [] },
      { id: 'probe', name: 'Voyager III', mass: 0.1, x: -250, y: 150, vx: 7.5, vy: -2.5, color: '#10b981', radius: 4, trail: [] }
    ]
  }
};

export default function NBodySimulator() {
  // Simulation Parameters
  const [bodies, setBodies] = useState<CelestialBody[]>(() => JSON.parse(JSON.stringify(PRESETS.solarSystem.bodies)));
  const [selectedPreset, setSelectedPreset] = useState<string>('solarSystem');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [dt, setDt] = useState<number>(0.015); // Time step
  const [softening, setSoftening] = useState<number>(12); // Softening factor to prevent infinite forces
  const [gConstant, setGConstant] = useState<number>(10); // Gravitational constant
  const [trailLength, setTrailLength] = useState<number>(200);
  const [substeps, setSubsteps] = useState<number>(8); // Physics steps per frame for accuracy
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Canvas Viewport State
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected Body for Editing
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);

  // New Body Form State
  const [newBody, setNewBody] = useState({
    name: 'New Planet',
    mass: 100,
    x: 100,
    y: 100,
    vx: 0,
    vy: 5,
    color: '#06b6d4',
    radius: 6
  });

  // Metrics & History
  const [simTime, setSimTime] = useState<number>(0);
  const [energyHistory, setEnergyHistory] = useState<EnergyMetric[]>([]);
  const [totalEnergy, setTotalEnergy] = useState<{ kinetic: number; potential: number; total: number }>({ kinetic: 0, potential: 0, total: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Reset Simulation
  const handleReset = useCallback(() => {
    const preset = PRESETS[selectedPreset];
    if (preset) {
      setBodies(JSON.parse(JSON.stringify(preset.bodies)));
      setSimTime(0);
      setEnergyHistory([]);
      setPan({ x: 0, y: 0 });
      setZoom(1.2);
    }
  }, [selectedPreset]);

  // Load Preset
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = PRESETS[presetKey];
    setBodies(JSON.parse(JSON.stringify(preset.bodies)));
    setSimTime(0);
    setEnergyHistory([]);
    setPan({ x: 0, y: 0 });
    setZoom(1.2);
    setSelectedBodyId(null);
  };

  // Physics Engine Step
  const runPhysicsStep = useCallback((currentBodies: CelestialBody[], stepSize: number) => {
    const nextBodies = currentBodies.map(b => ({
      ...b,
      trail: [...b.trail]
    }));
    
    const n = nextBodies.length;
    const ax = new Array(n).fill(0);
    const ay = new Array(n).fill(0);

    // Calculate Gravitational Accelerations
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = nextBodies[j].x - nextBodies[i].x;
        const dy = nextBodies[j].y - nextBodies[i].y;
        const distSq = dx * dx + dy * dy + softening * softening;
        const dist = Math.sqrt(distSq);
        
        // Force magnitude F = G * m1 * m2 / distSq
        // Acceleration a = F / m1 = G * m2 / distSq
        const accel = (gConstant * nextBodies[j].mass) / (distSq * dist);
        ax[i] += accel * dx;
        ay[i] += accel * dy;
      }
    }

    // Update Velocities and Positions (Euler-Cromer Integration)
    for (let i = 0; i < n; i++) {
      nextBodies[i].vx += ax[i] * stepSize;
      nextBodies[i].vy += ay[i] * stepSize;
      nextBodies[i].x += nextBodies[i].vx * stepSize;
      nextBodies[i].y += nextBodies[i].vy * stepSize;
    }

    return nextBodies;
  }, [gConstant, softening]);

  // Calculate System Energies
  const calculateEnergy = useCallback((currentBodies: CelestialBody[]) => {
    let kinetic = 0;
    let potential = 0;
    const n = currentBodies.length;

    for (let i = 0; i < n; i++) {
      const b1 = currentBodies[i];
      // Kinetic Energy: 0.5 * m * v^2
      const vSq = b1.vx * b1.vx + b1.vy * b1.vy;
      kinetic += 0.5 * b1.mass * vSq;

      // Potential Energy: -G * m1 * m2 / r
      for (let j = i + 1; j < n; j++) {
        const b2 = currentBodies[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy + softening * softening);
        potential -= (gConstant * b1.mass * b2.mass) / dist;
      }
    }

    return { kinetic, potential, total: kinetic + potential };
  }, [gConstant, softening]);

  // Main Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const updateFrame = () => {
      setBodies(prevBodies => {
        let updated = prevBodies;
        const stepSize = dt / substeps;

        // Run multiple substeps for numerical stability
        for (let s = 0; s < substeps; s++) {
          updated = runPhysicsStep(updated, stepSize);
        }

        // Update Trails (only once per frame for performance)
        return updated.map(b => {
          const newTrail = [...b.trail, { x: b.x, y: b.y }];
          if (newTrail.length > trailLength) {
            newTrail.shift();
          }
          return { ...b, trail: newTrail };
        });
      });

      setSimTime(prev => prev + dt);
      requestRef.current = requestAnimationFrame(updateFrame);
    };

    requestRef.current = requestAnimationFrame(updateFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, dt, substeps, runPhysicsStep, trailLength]);

  // Update Energy History Chart periodically
  useEffect(() => {
    const energy = calculateEnergy(bodies);
    setTotalEnergy(energy);

    setEnergyHistory(prev => {
      const next = [...prev, {
        time: simTime.toFixed(1),
        kinetic: Math.round(energy.kinetic),
        potential: Math.round(energy.potential),
        total: Math.round(energy.total)
      }];
      if (next.length > 40) next.shift();
      return next;
    });
  }, [bodies, simTime, calculateEnergy]);

  // Calculate Center of Mass
  const getCenterOfMass = useCallback(() => {
    let totalMass = 0;
    let cx = 0;
    let cy = 0;
    bodies.forEach(b => {
      totalMass += b.mass;
      cx += b.x * b.mass;
      cy += b.y * b.mass;
    });
    if (totalMass === 0) return { x: 0, y: 0 };
    return { x: cx / totalMass, y: cy / totalMass };
  }, [bodies]);

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Center of canvas is origin
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply Pan & Zoom
    let currentPan = { ...pan };
    if (autoCenter && bodies.length > 0) {
      const com = getCenterOfMass();
      currentPan = { x: -com.x * zoom, y: -com.y * zoom };
    }
    ctx.translate(currentPan.x, currentPan.y);
    ctx.scale(zoom, zoom);

    // Draw Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1 / zoom;
      const gridSize = 100;
      const limit = 1000;
      for (let x = -limit; x <= limit; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -limit);
        ctx.lineTo(x, limit);
        ctx.stroke();
      }
      for (let y = -limit; y <= limit; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-limit, y);
        ctx.lineTo(limit, y);
        ctx.stroke();
      }
    }

    // Draw Trails
    bodies.forEach(body => {
      if (body.trail.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(body.trail[0].x, body.trail[0].y);
      for (let i = 1; i < body.trail.length; i++) {
        ctx.lineTo(body.trail[i].x, body.trail[i].y);
      }
      ctx.strokeStyle = body.color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // Draw Bodies
    bodies.forEach(body => {
      // Glow effect
      const gradient = ctx.createRadialGradient(
        body.x, body.y, 1 / zoom,
        body.x, body.y, body.radius * 1.8
      );
      gradient.addColorStop(0, body.color);
      gradient.addColorStop(0.4, body.color + '88');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Solid core
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2