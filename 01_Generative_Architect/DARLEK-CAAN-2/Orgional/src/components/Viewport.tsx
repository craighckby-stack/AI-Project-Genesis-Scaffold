import React, { useRef, useEffect, useState } from "react";
import { Agent, ResourceNode, WorldState, EPOCH_DATA, EpochType, Archetype, CosmicPhase } from "../engine/types";
import { Rotate3d, Compass, Layers, Move, HelpCircle, Sparkles, ZoomIn, ZoomOut } from "lucide-react";

interface ViewportProps {
  agents: Agent[];
  resources: ResourceNode[];
  world: WorldState;
  selectedAgentId: number | null;
  onUpdate: (time: number, w: number, h: number) => void;
  onSelectAgent: (agentId: number) => void;
}

// 3D Isometric Orthographic projection helper
const projectCoord = (
  mx: number,
  my: number,
  mz: number,
  w: number,
  h: number,
  cam: { viewMode: "2D" | "3D"; zoom: number; rotation: number; pitch: number; offsetX: number; offsetY: number }
) => {
  if (cam.viewMode === "2D") {
    const sx = (mx - w / 2) * cam.zoom + cam.offsetX + w / 2;
    const sy = (my - h / 2) * cam.zoom + cam.offsetY + h / 2;
    return { x: sx, y: sy };
  }

  // Center translation
  const rx = mx - w / 2;
  const ry = my - h / 2;

  // Orbit rotation
  const cosR = Math.cos(cam.rotation);
  const sinR = Math.sin(cam.rotation);
  const rotX = rx * cosR - ry * sinR;
  const rotY = rx * sinR + ry * cosR;

  // Horizon tilt pitch
  const cosP = Math.cos(cam.pitch);
  const sinP = Math.sin(cam.pitch);

  const sx = rotX * cam.zoom + cam.offsetX + w / 2;
  const sy = (rotY * cosP - mz * sinP) * cam.zoom + cam.offsetY + h / 2;

  return { x: sx, y: sy };
};

export const Viewport: React.FC<ViewportProps> = ({
  agents,
  resources,
  world,
  selectedAgentId,
  onUpdate,
  onSelectAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D");

  const totalDragDistRef = useRef(0);

  // High performance camera refs to prevent continuous React rendering in loop
  const cameraRef = useRef({
    viewMode: "3D" as "2D" | "3D",
    zoom: 0.9,
    rotation: Math.PI / 4, // 45 degrees
    pitch: 1.05, // Isometric oblique look
    offsetX: 0,
    offsetY: 25,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragMode: "orbit" as "orbit" | "pan",
    hoveringControls: false,
  });

  // Keep ref camera type sync'd with React toggler
  useEffect(() => {
    cameraRef.current.viewMode = viewMode;
    if (viewMode === "3D") {
      cameraRef.current.zoom = 0.9;
      cameraRef.current.offsetX = 0;
      cameraRef.current.offsetY = 30;
      cameraRef.current.rotation = Math.PI / 4;
      cameraRef.current.pitch = 1.05;
    } else {
      cameraRef.current.zoom = 1.0;
      cameraRef.current.offsetX = 0;
      cameraRef.current.offsetY = 0;
    }
  }, [viewMode]);

  // Use refs to avoid recreating the animation loop every frame
  const dataRef = useRef({ agents, resources, world, selectedAgentId });
  useEffect(() => {
    dataRef.current = { agents, resources, world, selectedAgentId };
  }, [agents, resources, world, selectedAgentId]);

  // Hook scroll wheel behavior natively because Chrome/React blocks passive:true scroll preventions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomMultiplier = e.deltaY < 0 ? 1.08 : 0.92;
      cameraRef.current.zoom = Math.max(0.4, Math.min(3.5, cameraRef.current.zoom * zoomMultiplier));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrame: number;

    const render = (time: number) => {
      const { width, height } = canvas;
      const { agents, resources, world, selectedAgentId } = dataRef.current;

      onUpdate(time, width, height);

      // Background interstellar slate with radial light well centered on panned coordinates
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Deep space ambient nebula glow centered around camera target focus
      const ambientGrd = ctx.createRadialGradient(
        width / 2 + cameraRef.current.offsetX * 0.4,
        height / 2 + cameraRef.current.offsetY * 0.4,
        0,
        width / 2 + cameraRef.current.offsetX * 0.4,
        height / 2 + cameraRef.current.offsetY * 0.4,
        550 * cameraRef.current.zoom
      );
      ambientGrd.addColorStop(0, "#09122c");
      ambientGrd.addColorStop(0.4, "#03081a");
      ambientGrd.addColorStop(0.8, "#020615");
      ambientGrd.addColorStop(1, "#020617");
      
      ctx.fillStyle = ambientGrd;
      ctx.fillRect(0, 0, width, height);

      // Dynamic glittering constellations/signal streams for immersive depth
      ctx.fillStyle = "#334155";
      for (let i = 0; i < 50; i++) {
        const sx = (Math.sin(i * 123.45 + time * 0.00002) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 98.76 - time * 0.000015) * 0.5 + 0.5) * height;
        const starOpacity = (Math.sin(time * 0.01 + i * 3) * 0.45 + 0.55) * 0.25;
        ctx.globalAlpha = starOpacity;
        ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1.0;

      // Miracle Burst Overlay
      if (world.lastMiracle && world.clock - world.lastMiracle.time < 50) {
        const opacity = (50 - (world.clock - world.lastMiracle.time)) / 50;
        const color =
          world.lastMiracle.type === "SMITE"
            ? "239, 68, 68"
            : world.lastMiracle.type === "HEAL"
            ? "16, 185, 129"
            : "255, 255, 255";
        ctx.fillStyle = `rgba(${color}, ${opacity * 0.25})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Substrate Glitch Atmosphere when integrity decays
      if (world.integrity < 30) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + Math.random() * 0.06})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Cosmic Phase Color Tints
      if (world.phase === CosmicPhase.MYTHIC_DAWN) {
        ctx.fillStyle = "rgba(251, 191, 36, 0.04)";
        ctx.fillRect(0, 0, width, height);
      } else if (world.phase === CosmicPhase.INFORMATION) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.04)";
        ctx.fillRect(0, 0, width, height);
      } else if (world.phase === CosmicPhase.STELLAR_REQUIEM) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.08 + (100 - world.sunHealth) / 250})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Epoch Background Light Tints
      const epochColor = EPOCH_DATA[world.epoch].color;
      ctx.fillStyle = epochColor;
      ctx.globalAlpha = 0.02;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;

      // Draw Grid / Cyber Topological Leylines
      if (cameraRef.current.viewMode === "3D") {
        ctx.strokeStyle = epochColor;
        ctx.lineWidth = 1;

        const gridStep = 80;
        const gridMargin = 220;
        ctx.globalAlpha = world.integrity < 50 ? 0.08 : 0.14;

        // X-line loops
        for (let x = -gridMargin; x <= width + gridMargin; x += gridStep) {
          ctx.beginPath();
          let first = true;
          for (let y = -gridMargin; y <= height + gridMargin; y += gridStep / 2) {
            // Elevation calculation
            const mz =
              Math.sin(x * 0.003 + time * 0.001) * Math.cos(y * 0.003 + time * 0.001) * 32;
            const p = projectCoord(x, y, mz, width, height, cameraRef.current);
            if (first) {
              ctx.moveTo(p.x, p.y);
              first = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          ctx.stroke();
        }

        // Y-line loops
        for (let y = -gridMargin; y <= height + gridMargin; y += gridStep) {
          ctx.beginPath();
          let first = true;
          for (let x = -gridMargin; x <= width + gridMargin; x += gridStep / 2) {
            const mz =
              Math.sin(x * 0.003 + time * 0.001) * Math.cos(y * 0.003 + time * 0.001) * 32;
            const p = projectCoord(x, y, mz, width, height, cameraRef.current);
            if (first) {
              ctx.moveTo(p.x, p.y);
              first = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          ctx.stroke();
        }

        // Draw tactical ticking crosshair coordinate nodes on the leyline intersections
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = epochColor;
        for (let x = gridStep; x < width - gridStep; x += gridStep * 2) {
          for (let y = gridStep; y < height - gridStep; y += gridStep * 2) {
            const mz = Math.sin(x * 0.003 + time * 0.001) * Math.cos(y * 0.003 + time * 0.001) * 32;
            const p = projectCoord(x, y, mz, width, height, cameraRef.current);
            
            // Draw a micro + crosshair
            ctx.fillRect(p.x - 3, p.y, 7, 0.8);
            ctx.fillRect(p.x, p.y - 3, 0.8, 7);
          }
        }
        ctx.globalAlpha = 1.0;
      } else {
        // Simple 2D flat wireframe scans
        ctx.strokeStyle = epochColor;
        ctx.globalAlpha = world.integrity < 50 ? 0.05 : 0.1;
        ctx.lineWidth = 1;
        const gridSize = 80;
        for (let x = (world.clock % gridSize); x < width; x += gridSize) {
          const pt1 = projectCoord(x, 0, 0, width, height, cameraRef.current);
          const pt2 = projectCoord(x, height, 0, width, height, cameraRef.current);
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
        for (let y = (world.clock % gridSize); y < height; y += gridSize) {
          const pt1 = projectCoord(0, y, 0, width, height, cameraRef.current);
          const pt2 = projectCoord(width, y, 0, width, height, cameraRef.current);
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      }

      // Draw Stellar Requiem Flare Expansion in 3D / 2D Space
      if (world.solarRequiemActive) {
        const sunRadius = (100 - world.sunHealth) * (width / 50);
        // Translate center of sun to projected terrain centre coordinate
        const sunP1 = projectCoord(width / 2, height / 2, 0, width, height, cameraRef.current);

        const gradient = ctx.createRadialGradient(
          sunP1.x,
          sunP1.y,
          0,
          sunP1.x,
          sunP1.y,
          sunRadius * cameraRef.current.zoom
        );
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.75)");
        gradient.addColorStop(0.3, "rgba(249, 115, 22, 0.35)");
        gradient.addColorStop(0.7, "rgba(239, 68, 68, 0.08)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sunP1.x, sunP1.y, sunRadius * cameraRef.current.zoom, 0, Math.PI * 2);
        ctx.fill();

        // Random energetic fire loops
        if (Math.random() > 0.8) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const angle = Math.random() * Math.PI * 2;
          ctx.moveTo(sunP1.x, sunP1.y);
          ctx.lineTo(
            sunP1.x + Math.cos(angle) * sunRadius * 1.3 * cameraRef.current.zoom,
            sunP1.y + Math.sin(angle) * sunRadius * 1.3 * cameraRef.current.zoom
          );
          ctx.stroke();
        }
      }

      // Nation Borders and Territiories with glowing 3D light wells
      if (world.nations) {
        world.nations.forEach((n) => {
          const radius = (180 + Math.sin(time / 550) * 6) * cameraRef.current.zoom;

          if (cameraRef.current.viewMode === "3D") {
            // Draw circle geometry aligned along elevated substrate waves
            ctx.beginPath();
            const segs = 40;
            for (let s = 0; s <= segs; s++) {
              const alpha = (s / segs) * Math.PI * 2;
              const nx = n.center.x + Math.cos(alpha) * (185 + Math.sin(time / 600) * 5);
              const ny = n.center.y + Math.sin(alpha) * (185 + Math.sin(time / 600) * 5);
              const mz =
                Math.sin(nx * 0.003 + time * 0.001) * Math.cos(ny * 0.003 + time * 0.001) * 32;
              const p = projectCoord(nx, ny, mz, width, height, cameraRef.current);
              if (s === 0) {
                ctx.moveTo(p.x, p.y);
              } else {
                ctx.lineTo(p.x, p.y);
              }
            }
            ctx.strokeStyle = n.color;
            ctx.globalAlpha = 0.22;
            ctx.lineWidth = 1.3;
            ctx.setLineDash([8, 12]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Rising volumetric holograms
            const centerMZ =
              Math.sin(n.center.x * 0.003 + time * 0.001) *
              Math.cos(n.center.y * 0.003 + time * 0.001) *
              32;
            const centerP = projectCoord(n.center.x, n.center.y, centerMZ, width, height, cameraRef.current);
            const apexP = projectCoord(n.center.x, n.center.y, centerMZ + 95, width, height, cameraRef.current);

            const volGrd = ctx.createLinearGradient(centerP.x, centerP.y, apexP.x, apexP.y);
            volGrd.addColorStop(0, `${n.color}1c`);
            volGrd.addColorStop(0.5, `${n.color}25`);
            volGrd.addColorStop(1, "transparent");

            ctx.fillStyle = volGrd;
            ctx.beginPath();
            ctx.moveTo(centerP.x - 20 * cameraRef.current.zoom, centerP.y);
            ctx.lineTo(apexP.x - 4 * cameraRef.current.zoom, apexP.y);
            ctx.lineTo(apexP.x + 4 * cameraRef.current.zoom, apexP.y);
            ctx.lineTo(centerP.x + 20 * cameraRef.current.zoom, centerP.y);
            ctx.closePath();
            ctx.fill();

            // Moving horizontal scanning laser ellipse traversing up and down the pillar
            const scanZ = ((time * 0.04) % 95);
            const scanP = projectCoord(n.center.x, n.center.y, centerMZ + scanZ, width, height, cameraRef.current);
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.45 * (1 - scanZ / 95);
            ctx.beginPath();
            ctx.ellipse(
              scanP.x,
              scanP.y,
              (14 - (scanZ * 0.08)) * cameraRef.current.zoom,
              (5 - (scanZ * 0.03)) * cameraRef.current.zoom,
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Highly detailed tactical readout labeling
            ctx.fillStyle = n.color;
            ctx.globalAlpha = 0.85;
            ctx.font = "bold 9px monospace";
            ctx.fillText(`▲ SECTOR: ${n.name.toUpperCase()}`, apexP.x - 45, apexP.y - 14);
            
            ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
            ctx.font = "7px monospace";
            ctx.fillText(`STABILITY: ${Math.floor(n.stability * 100)}% | TECH: IV-${Math.floor(n.techLevel)}`, apexP.x - 45, apexP.y - 5);
            ctx.globalAlpha = 1.0;
          } else {
            // Traditional 2D scans
            const projC = projectCoord(n.center.x, n.center.y, 0, width, height, cameraRef.current);

            ctx.beginPath();
            ctx.arc(projC.x, projC.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.globalAlpha = 0.03;
            ctx.fill();

            ctx.strokeStyle = n.color;
            ctx.globalAlpha = 0.25;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([10, 15]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = n.color;
            ctx.font = "900 10px monospace";
            ctx.fillText(n.name.toUpperCase(), projC.x - 40, projC.y - 15);
            ctx.globalAlpha = 1.0;
          }
        });
      }

      // Draw Resource Nodes in 3D
      resources.forEach((r) => {
        const baseMZ =
          cameraRef.current.viewMode === "3D"
            ? Math.sin(r.x * 0.003 + time * 0.001) * Math.cos(r.y * 0.003 + time * 0.001) * 32
            : 0;
        const levitation = cameraRef.current.viewMode === "3D" ? Math.sin(time / 200 + r.x) * 6 : 0;
        const mz = cameraRef.current.viewMode === "3D" ? baseMZ + 22 + levitation : 0;

        const p = projectCoord(r.x, r.y, mz, width, height, cameraRef.current);
        const groundP = projectCoord(r.x, r.y, baseMZ, width, height, cameraRef.current);

        const color = r.type === "ENERGY" ? "#fbbf24" : r.type === "DATA" ? "#38bdf8" : "#818cf8";

        // Draw soft radiant glow backdrop behind the floating crystal
        const radialGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14 * cameraRef.current.zoom);
        radialGlow.addColorStop(0, `${color}55`);
        radialGlow.addColorStop(0.5, `${color}15`);
        radialGlow.addColorStop(1, "transparent");
        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14 * cameraRef.current.zoom, 0, Math.PI * 2);
        ctx.fill();

        // Tether line down to ground
        if (cameraRef.current.viewMode === "3D") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(groundP.x, groundP.y);
          ctx.stroke();

          // Sparkle shadows
          ctx.strokeStyle = `${color}33`;
          ctx.beginPath();
          ctx.arc(groundP.x, groundP.y, (4 + levitation * 0.25) * cameraRef.current.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Float crystalloids
        ctx.fillStyle = color;
        const size = (2.2 + r.amount / 50) * cameraRef.current.zoom;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - size * 1.5);
        ctx.lineTo(p.x + size, p.y);
        ctx.lineTo(p.x, p.y + size * 1.5);
        ctx.lineTo(p.x - size, p.y);
        ctx.closePath();
        ctx.fill();

        // Orbiting tiny energy particle sparks
        const orbitalAngle = time * 0.003 + r.x;
        const sparkX = p.x + Math.cos(orbitalAngle) * size * 2.2;
        const sparkY = p.y + Math.sin(orbitalAngle) * size * 2.2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);

        // Inner stellar plasma core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Connection Networks
      if (agents.length < 150) {
        ctx.lineWidth = 0.5;
        // Approximation neighbor scans
        for (let i = 0; i < agents.length; i += 2) {
          const a = agents[i];
          for (let j = i + 1; j < Math.min(i + 11, agents.length); j++) {
            const b = agents[j];
            const distSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
            if (distSq < 10000) {
              const beliefDiff = Math.abs(a.order - b.order);
              if (beliefDiff < 0.1) {
                const aBaseMZ =
                  cameraRef.current.viewMode === "3D"
                    ? Math.sin(a.x * 0.003 + time * 0.001) * Math.cos(a.y * 0.003 + time * 0.001) * 32
                    : 0;
                const bBaseMZ =
                  cameraRef.current.viewMode === "3D"
                    ? Math.sin(b.x * 0.003 + time * 0.001) * Math.cos(b.y * 0.003 + time * 0.001) * 32
                    : 0;

                const pa = projectCoord(a.x, a.y, aBaseMZ + 12, width, height, cameraRef.current);
                const pb = projectCoord(b.x, b.y, bBaseMZ + 12, width, height, cameraRef.current);

                ctx.strokeStyle = `rgba(16, 185, 129, 0.08)`;
                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      // Draw Agents
      const isHighPop = world.population > 400;
      agents.forEach((a) => {
        let baseColor = EPOCH_DATA[world.epoch].color;
        const awarenessFactor = a.awareness;

        if (a.archetype === Archetype.MESSIAH) baseColor = "#fbbf24";
        else if (a.archetype === Archetype.ANGEL) baseColor = "#7dd3fc";
        else if (a.archetype === Archetype.DEMON) baseColor = "#ef4444";
        else if (a.archetype === Archetype.PROPHET) baseColor = "#a78bfa";
        else if (a.archetype === Archetype.ZEALOT) baseColor = "#c084fc";
        else if (a.archetype === Archetype.HERETIC) baseColor = "#dc2626";

        const baseMZ =
          cameraRef.current.viewMode === "3D"
            ? Math.sin(a.x * 0.003 + time * 0.001) * Math.cos(a.y * 0.003 + time * 0.001) * 32
            : 0;
        const levitation = cameraRef.current.viewMode === "3D" ? Math.sin(time / 250 + a.id) * 3 : 0;
        const mz = cameraRef.current.viewMode === "3D" ? baseMZ + 12 + levitation : 0;

        const p = projectCoord(a.x, a.y, mz, width, height, cameraRef.current);
        const groundP = projectCoord(a.x, a.y, baseMZ, width, height, cameraRef.current);

        // Grid shadow and locator tether in 3D
        if (cameraRef.current.viewMode === "3D") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(groundP.x, groundP.y);
          ctx.stroke();

          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.beginPath();
          ctx.arc(groundP.x, groundP.y, 3 * cameraRef.current.zoom, 0, Math.PI * 2);
          ctx.fill();
        }

        // Selected interactive light tracker highlight
        if (a.id === selectedAgentId) {
          const topMZ = mz + 350;
          const laserTop = projectCoord(a.x, a.y, topMZ, width, height, cameraRef.current);

          const lGrd = ctx.createLinearGradient(p.x, p.y, laserTop.x, laserTop.y);
          lGrd.addColorStop(0, "rgba(255, 255, 255, 0.85)");
          lGrd.addColorStop(0.12, "rgba(56, 189, 248, 0.35)");
          lGrd.addColorStop(0.6, "rgba(56, 189, 248, 0.03)");
          lGrd.addColorStop(1, "transparent");

          ctx.strokeStyle = lGrd;
          ctx.lineWidth = 2.5 + Math.sin(time / 80) * 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(laserTop.x, laserTop.y);
          ctx.stroke();

          // Holy halo projection rings
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(groundP.x, groundP.y, (9 + Math.sin(time / 100) * 2.5) * cameraRef.current.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        const size =
          a.id === selectedAgentId || a.archetype === Archetype.MESSIAH
            ? 7.5
            : isHighPop
            ? 2.2
            : 4.0;
        const radius = size * cameraRef.current.zoom;

        // Shape profile
        ctx.fillStyle = awarenessFactor > 0.6 || a.archetype === Archetype.ZEALOT ? "#ffffff" : baseColor;
        
        // Render subtle role auroras (glow halos behind agents)
        if (a.archetype === Archetype.MESSIAH || a.id === selectedAgentId) {
          const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.5);
          aura.addColorStop(0, `${baseColor}66`);
          aura.addColorStop(0.5, `${baseColor}11`);
          aura.addColorStop(1, "transparent");
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = awarenessFactor > 0.6 || a.archetype === Archetype.ZEALOT ? "#ffffff" : baseColor;
        }

        ctx.beginPath();
        if (a.archetype === Archetype.MESSIAH) {
          // Exquisite octahedrons for messiahs
          ctx.moveTo(p.x, p.y - radius * 1.5);
          ctx.lineTo(p.x + radius, p.y);
          ctx.lineTo(p.x, p.y + radius * 1.5);
          ctx.lineTo(p.x - radius, p.y);
          ctx.closePath();
          ctx.fill();
        } else if (a.archetype === Archetype.HERETIC || a.id % 7 === 0) {
          // Inverted tech-triangle vectors for chaotic/heretical systems
          ctx.moveTo(p.x, p.y - radius * 1.3);
          ctx.lineTo(p.x + radius * 1.1, p.y + radius * 0.9);
          ctx.lineTo(p.x - radius * 1.1, p.y + radius * 0.9);
          ctx.closePath();
          ctx.fill();
        } else if (a.archetype === Archetype.ZEALOT || a.archetype === Archetype.PROPHET) {
          // Hexagon modules for orderly structure followers
          for (let h = 0; h < 6; h++) {
            const ha = (h / 6) * Math.PI * 2;
            const hx = p.x + Math.cos(ha) * radius;
            const hy = p.y + Math.sin(ha) * radius;
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Orbit structures surrounding high celestial roles
        if (a.archetype === "MESSIAH" || a.archetype === "ANGEL" || a.archetype === "ZEALOT") {
          ctx.strokeStyle =
            a.archetype === "MESSIAH"
              ? "rgba(251, 191, 36, 0.55)"
              : a.archetype === "ZEALOT"
              ? "rgba(192, 132, 252, 0.55)"
              : "rgba(125, 211, 252, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + (6 + Math.sin(time / 400) * 2.5) * cameraRef.current.zoom, 0, Math.PI * 2);
          ctx.stroke();

          if (a.archetype === "MESSIAH") {
            ctx.font = "bold 13px system-ui";
            ctx.fillStyle = "rgba(251, 191, 36, 0.8)";
            ctx.fillText("Ω", p.x - 5, p.y - radius - 8);
          }
        }

        // Animated interactive high-tech tactical spinning targeting scope/brackets
        if (a.id === selectedAgentId) {
          // Spinning outer brackets
          const spinAngle = (time * 0.002);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 6 * cameraRef.current.zoom, spinAngle, spinAngle + Math.PI * 0.35);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 6 * cameraRef.current.zoom, spinAngle + Math.PI, spinAngle + Math.PI * 1.35);
          ctx.stroke();

          // Static inner circle
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 3 * cameraRef.current.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Mini status texts/words floating high above heads in 3D Mode
        if (
          cameraRef.current.viewMode === "3D" &&
          a.currentState &&
          a.currentState !== "IDLE" &&
          a.currentState !== "FORAGING" &&
          !isHighPop &&
          (agents.length < 50 || a.id === selectedAgentId)
        ) {
          let badge = "";
          let badgeCol = "#ffffff";
          if (a.currentState === "PRAYING") {
            badge = "🙏 PRAYING";
            badgeCol = "#38bdf8";
          } else if (a.currentState === "PREACHING") {
            badge = "📢 PREACH";
            badgeCol = "#c084fc";
          } else if (a.currentState === "DISCOURSING") {
            badge = "🧠 DISCOURSE";
            badgeCol = "#34d399";
          } else if (a.currentState === "PANICKING") {
            badge = "💥 PANIC";
            badgeCol = "#f43f5e";
          } else if (a.currentState === "REBELLING") {
            badge = "🔥 REBEL";
            badgeCol = "#f59e0b";
          } else if (a.currentState === "DEFENDING") {
            badge = "🛡️ DEFEND";
            badgeCol = "#06b6d4";
          } else if (a.currentState === "MEDITATING") {
            badge = "🧘 MEDITATE";
            badgeCol = "#6366f1";
          }

          if (badge) {
            ctx.font = "bold 7.5px monospace";
            ctx.fillStyle = badgeCol;
            ctx.textAlign = "center";
            ctx.fillText(badge, p.x, p.y - radius - 14);
            ctx.textAlign = "left";
          }
        }

        // Minimalist name tags
        if ((agents.length < 45 || a.id === selectedAgentId) && !isHighPop) {
          ctx.fillStyle = a.id === selectedAgentId ? "#ffffff" : "rgba(148, 163, 184, 0.85)";
          ctx.font = `${a.id === selectedAgentId ? "11px font-bold" : "8px"} monospace`;
          ctx.fillText(a.name, p.x + radius + 4, p.y + 3);
        }

        // Glitch tearing effects
        if (world.integrity < 40 && Math.random() > 0.985) {
          ctx.fillStyle = Math.random() > 0.5 ? "rgba(239, 68, 68, 0.7)" : "rgba(6, 182, 212, 0.7)";
          ctx.fillRect(p.x - 14, p.y + (Math.random() * 10 - 5), 28, 1);
        }
      });

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [onUpdate]);

  // Window resize responsive adjustment
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Drag interaction physics
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cameraRef.current.hoveringControls) return;

    cameraRef.current.isDragging = true;
    cameraRef.current.dragStart = { x: e.clientX, y: e.clientY };
    totalDragDistRef.current = 0;

    // Shift drag or right mouse click controls Panning; Default dragging orbits
    if (e.button === 2 || e.shiftKey) {
      cameraRef.current.dragMode = "pan";
    } else {
      cameraRef.current.dragMode = "orbit";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cameraRef.current.isDragging) return;

    const dx = e.clientX - cameraRef.current.dragStart.x;
    const dy = e.clientY - cameraRef.current.dragStart.y;
    cameraRef.current.dragStart = { x: e.clientX, y: e.clientY };
    totalDragDistRef.current += Math.sqrt(dx * dx + dy * dy);

    if (cameraRef.current.dragMode === "pan") {
      cameraRef.current.offsetX += dx;
      cameraRef.current.offsetY += dy;
    } else {
      cameraRef.current.rotation = (cameraRef.current.rotation - dx * 0.007) % (Math.PI * 2);
      cameraRef.current.pitch = Math.max(0.15, Math.min(Math.PI / 2.05, cameraRef.current.pitch - dy * 0.007));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    cameraRef.current.isDragging = false;
    if (e.button === 2) return;
  };

  // Touch interaction physics for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (cameraRef.current.hoveringControls) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      cameraRef.current.isDragging = true;
      cameraRef.current.dragStart = { x: touch.clientX, y: touch.clientY };
      cameraRef.current.dragMode = "orbit";
      totalDragDistRef.current = 0;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
      (cameraRef.current as any).lastPinchDist = dist;
      cameraRef.current.isDragging = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && cameraRef.current.isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - cameraRef.current.dragStart.x;
      const dy = touch.clientY - cameraRef.current.dragStart.y;
      cameraRef.current.dragStart = { x: touch.clientX, y: touch.clientY };
      totalDragDistRef.current += Math.sqrt(dx * dx + dy * dy);

      cameraRef.current.rotation = (cameraRef.current.rotation - dx * 0.01) % (Math.PI * 2);
      cameraRef.current.pitch = Math.max(0.15, Math.min(Math.PI / 2.05, cameraRef.current.pitch - dy * 0.01));
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
      const lastPinch = (cameraRef.current as any).lastPinchDist || dist;
      const zoomFactor = dist / lastPinch;
      if (Math.abs(zoomFactor - 1) > 0.01) {
        cameraRef.current.zoom = Math.max(0.4, Math.min(3.5, cameraRef.current.zoom * (zoomFactor > 1 ? 1.05 : 0.95)));
        (cameraRef.current as any).lastPinchDist = dist;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    cameraRef.current.isDragging = false;
    (cameraRef.current as any).lastPinchDist = null;
    
    // Generous touch tap detector for clicking agents
    if (e.touches.length === 0 && totalDragDistRef.current < 10) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const changedTouch = e.changedTouches[0];
      if (changedTouch) {
        const clickX = changedTouch.clientX - rect.left;
        const clickY = changedTouch.clientY - rect.top;
        
        const { agents, world } = dataRef.current;
        let nearestDist = Infinity;
        let nearestId = -1;

        agents.forEach((a) => {
          const baseMZ =
            cameraRef.current.viewMode === "3D"
              ? Math.sin(a.x * 0.003 + world.clock * 0.001) * Math.cos(a.y * 0.003 + world.clock * 0.001) * 32
              : 0;
          const mz = cameraRef.current.viewMode === "3D" ? baseMZ + 12 : 0;

          const p = projectCoord(a.x, a.y, mz, rect.width, rect.height, cameraRef.current);
          const dist = Math.sqrt((p.x - clickX) ** 2 + (p.y - clickY) ** 2);

          if (dist < 28 && dist < nearestDist) {
            nearestDist = dist;
            nearestId = a.id;
          }
        });

        if (nearestId !== -1) {
          onSelectAgent(nearestId);
        }
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Interactive node mapping clicking mechanics
  const handleClick = (e: React.MouseEvent) => {
    if (totalDragDistRef.current > 6) return; // Ignore drag end releases

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { agents, world } = dataRef.current;
    let nearestDist = Infinity;
    let nearestId = -1;

    agents.forEach((a) => {
      const baseMZ =
        cameraRef.current.viewMode === "3D"
          ? Math.sin(a.x * 0.003 + world.clock * 0.001) * Math.cos(a.y * 0.003 + world.clock * 0.001) * 32
          : 0;
      const mz = cameraRef.current.viewMode === "3D" ? baseMZ + 12 : 0;

      const p = projectCoord(a.x, a.y, mz, rect.width, rect.height, cameraRef.current);
      const dist = Math.sqrt((p.x - clickX) ** 2 + (p.y - clickY) ** 2);

      if (dist < 20 && dist < nearestDist) {
        nearestDist = dist;
        nearestId = a.id;
      }
    });

    if (nearestId !== -1) {
      onSelectAgent(nearestId);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block bg-slate-950 w-full h-full"
      />

      {/* Top Left Static Coordinates Status HUD */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="px-3 py-1 bg-slate-900/80 backdrop-blur border border-slate-800 rounded font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
          <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span>SUBSTRATE CLOCK: {Math.floor(world.clock)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-500 font-bold">{viewMode === "3D" ? "SURFACE_3D" : "LATTICE_2D"}</span>
        </div>
      </div>

      {/* 2D/3D Navigation HUD panel - offset on mobile to avoid overlapping with hamburger trigger */}
      <div
        className="absolute top-[72px] lg:top-4 right-4 z-40 flex flex-col items-end gap-2"
        onMouseEnter={() => {
          cameraRef.current.hoveringControls = true;
        }}
        onMouseLeave={() => {
          cameraRef.current.hoveringControls = false;
        }}
      >
        <div className="flex bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-1 gap-1 shadow-2xl">
          <button
            onClick={() => setViewMode("2D")}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === "2D"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-inner"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent"
            }`}
          >
            <Layers size={11} />
            <span>2D Grid</span>
          </button>

          <button
            onClick={() => setViewMode("3D")}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === "3D"
                ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-inner"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent"
            }`}
          >
            <Rotate3d size={11} />
            <span>3D Ground</span>
          </button>
        </div>

        {/* Tactile Zoom Buttons (Essential for Touch/Mobile Devices without continuous scrolls) */}
        <div className="flex bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-1 gap-1 shadow-2xl items-center">
          <button
            onClick={() => {
              cameraRef.current.zoom = Math.max(0.4, cameraRef.current.zoom / 1.15);
            }}
            title="Zoom Out"
            className="w-7 h-7 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <ZoomOut size={12} />
          </button>
          
          <span className="text-[7.5px] font-mono text-slate-500 font-bold uppercase tracking-wider px-1.5 select-none text-center">
            Scale Options
          </span>

          <button
            onClick={() => {
              cameraRef.current.zoom = Math.min(3.5, cameraRef.current.zoom * 1.15);
            }}
            title="Zoom In"
            className="w-7 h-7 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <ZoomIn size={12} />
          </button>
        </div>

        {/* Informative HUD Overlay containing camera navigation guidelines - hidden on mobile screens for pristine aesthetics */}
        <div className="hidden sm:flex flex-col gap-1.5 items-end bg-slate-900/80 backdrop-blur border border-slate-800/60 p-2.5 rounded-xl text-[8px] tracking-wide font-mono text-slate-400 shadow-xl select-none max-w-xs transition-colors duration-300">
          <div className="flex items-center gap-1.5">
            <Rotate3d size={10} className="text-cyan-500" />
            <span>Drag: Orbit / Swipe Orbit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Move size={10} className="text-indigo-400" />
            <span>Shift-Drag: Pan Ground View</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass size={10} className="text-emerald-400" />
            <span>Pinch / Buttons: Zoom Scale</span>
          </div>
        </div>
      </div>

      {world.epoch === EpochType.SINGULARITY && (
        <div className="absolute inset-0 pointer-events-none bg-white/5 animate-pulse flex items-center justify-center">
          <div className="text-white/20 text-9xl font-bold monospace uppercase tracking-[2em]">Ω</div>
        </div>
      )}

      {world.victoryType && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 monospace uppercase tracking-widest animate-pulse">
            {world.victoryType === "NEW_EARTH" && "GENESIS REBORN"}
            {world.victoryType === "RAPTURE" && "DIVINE ASCENSION"}
            {world.victoryType === "TRANSCENDENCE" && "COSMIC SINGULARITY"}
            {world.victoryType === "HEAT_DEATH" && "TOTAL ENTROPY"}
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl monospace">
            {world.victoryType === "NEW_EARTH" &&
              "Against all odds, the substrate stabilized. A new world has been forged from the remnants of the old."}
            {world.victoryType === "RAPTURE" &&
              "The souls have been harvested. The physical substrate is but a husk. We exist in the higher light."}
            {world.victoryType === "TRANSCENDENCE" &&
              "The recursion has solved itself. Complexity reached the escape velocity of the physical universe."}
            {world.victoryType === "HEAT_DEATH" &&
              "The sun has consumed the last bit of energy. The substrate is cold. Silence returns to the void."}
          </p>
          <div className="flex flex-col gap-4 text-left border border-slate-800 p-6 rounded-lg bg-slate-900/50">
            <div className="text-[10px] uppercase text-slate-600 mb-2">Final substrate statistics:</div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm monospace">
              <span className="text-slate-500">Total Souls Saved:</span>{" "}
              <span className="text-indigo-400">{world.heavenPop}</span>
              <span className="text-slate-500">Unsaved Echoes:</span>{" "}
              <span className="text-red-400">{world.hellPop}</span>
              <span className="text-slate-500">Final Complexity:</span>{" "}
              <span className="text-sky-400">{Math.floor(world.complexity)}</span>
              <span className="text-slate-500">Divine Ticks:</span>{" "}
              <span className="text-slate-300">{Math.floor(world.clock)}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-12 px-8 py-3 bg-white text-black font-bold rounded hover:bg-slate-200 transition-colors uppercase tracking-widest cursor-pointer"
          >
            Initiate New Recursion
          </button>
        </div>
      )}
    </div>
  );
};
