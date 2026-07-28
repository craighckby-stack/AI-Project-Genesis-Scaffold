import { EncyclopediaData, Capability } from "../types";
import { useState, useMemo } from "react";
import { Compass, Network, Layers, GitFork, Milestone, HelpCircle } from "lucide-react";

interface ConceptMapProps {
  data: EncyclopediaData;
  selectedId: string | null;
  onSelectCapability: (id: string | null) => void;
}

interface Node {
  id: string;
  label: string;
  type: "root" | "volume" | "chapter" | "capability";
  x: number;
  y: number;
  color: string;
  size: number;
  refId?: string; // actual capability ID
  description?: string;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

export default function ConceptMap({ data, selectedId, onSelectCapability }: ConceptMapProps) {
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Layout the nodes beautifully in a responsive coordinate space
  // We will cluster them by Volumes -> Chapters -> Capabilities
  const { nodes, links } = useMemo(() => {
    const nodesList: Node[] = [];
    const linksList: Link[] = [];

    // 1. Central Hub
    const rootId = "root-engine";
    nodesList.push({
      id: rootId,
      label: "ENCYCLOPEDIA",
      type: "root",
      x: 350,
      y: 250,
      color: "bg-slate-900 border-slate-900 text-white shadow-lg",
      size: 55,
      description: "Universal semantic map of engineering knowledge."
    });

    // 2. Lay out Volumes around the center
    const volumes = data.volumes;
    volumes.forEach((vol, volIdx) => {
      // Polar coordinates for volumes
      const volAngle = (volIdx / volumes.length) * Math.PI * 2;
      const volRadius = 130;
      const volX = 350 + Math.cos(volAngle) * volRadius;
      const volY = 250 + Math.sin(volAngle) * volRadius;
      const volId = `vol-${vol.name}`;

      nodesList.push({
        id: volId,
        label: vol.name.toUpperCase(),
        type: "volume",
        x: volX,
        y: volY,
        color: "bg-white border-slate-800 text-slate-800 font-bold border-2 shadow-md",
        size: 38,
        description: `Technical Volume regarding ${vol.name}.`
      });

      linksList.push({
        source: rootId,
        target: volId,
        type: "vol-connection"
      });

      // 3. Lay out Chapters around each Volume
      vol.chapters.forEach((chapter, chapIdx) => {
        const totalChaps = vol.chapters.length;
        // Spread chapters out slightly away from the volume center
        const chapSpreadAngle = volAngle + ((chapIdx - (totalChaps - 1) / 2) * (Math.PI / 4));
        const chapRadius = 80;
        const chapX = volX + Math.cos(chapSpreadAngle) * chapRadius;
        const chapY = volY + Math.sin(chapSpreadAngle) * chapRadius;
        const chapId = `chap-${vol.name}-${chapter.name}`;

        nodesList.push({
          id: chapId,
          label: chapter.name,
          type: "chapter",
          x: chapX,
          y: chapY,
          color: "bg-slate-50 border-slate-400 text-slate-600 text-xs border border-dashed shadow-sm",
          size: 28,
          description: `Chapter on ${chapter.name}.`
        });

        linksList.push({
          source: volId,
          target: chapId,
          type: "chap-connection"
        });

        // 4. Lay out Capabilities around each Chapter
        chapter.capabilities.forEach((capId, capIdx) => {
          const cap = data.capabilities[capId];
          if (!cap) return;

          const totalCaps = chapter.capabilities.length;
          const capSpreadAngle = chapSpreadAngle + ((capIdx - (totalCaps - 1) / 2) * (Math.PI / 5));
          const capRadius = 60;
          const capX = chapX + Math.cos(capSpreadAngle) * capRadius;
          const capY = chapY + Math.sin(capSpreadAngle) * capRadius;

          nodesList.push({
            id: `cap-${capId}`,
            label: cap.name,
            type: "capability",
            x: capX,
            y: capY,
            color: selectedId === capId
              ? "bg-sky-600 border-sky-600 text-white shadow-[0_0_12px_rgba(14,165,233,0.5)] scale-110 font-medium"
              : "bg-white border-slate-200 text-slate-700 text-xs border shadow-sm hover:border-slate-400 hover:text-slate-900",
            size: 22,
            refId: capId,
            description: cap.purpose
          });

          linksList.push({
            source: chapId,
            target: `cap-${capId}`,
            type: "cap-connection"
          });
        });
      });
    });

    return { nodes: nodesList, links: linksList };
  }, [data, selectedId]);

  // Find position by ID to draw link lines
  const nodeMap = useMemo(() => {
    const map: Record<string, Node> = {};
    nodes.forEach(n => {
      map[n.id] = n;
    });
    return map;
  }, [nodes]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      <div className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Network size={20} className="text-sky-500" />
            Interactive Concept Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            A dynamic graphical view of software capabilities and their conceptual hierarchy.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>
            <span>Encyclopedia Root</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-white border border-slate-400 rounded-full"></span>
            <span>Volumes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
            <span>Capabilities</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative min-h-[450px]">
        {/* SVG lines and connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <g>
            {links.map((link, idx) => {
              const sourceNode = nodeMap[link.source];
              const targetNode = nodeMap[link.target];
              if (!sourceNode || !targetNode) return null;

              const isHighlighted =
                hoveredNode?.id === link.source ||
                hoveredNode?.id === link.target ||
                (hoveredNode?.type === "capability" && targetNode.refId === hoveredNode.refId);

              return (
                <line
                  key={idx}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? "#0ea5e9" : "#e2e8f0"}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  strokeDasharray={link.type === "chap-connection" ? "4 4" : undefined}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>
        </svg>

        {/* Floating interactive node elements */}
        <div className="absolute inset-0 w-full h-full overflow-auto p-4 flex items-center justify-center">
          <div className="relative w-[700px] h-[500px]">
            {nodes.map((node) => {
              const isSelected = node.refId && selectedId === node.refId;
              const isHovered = hoveredNode?.id === node.id;

              return (
                <button
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    transform: "translate(-50%, -50%)",
                    width: `${node.size * 2}px`,
                    height: `${node.size * 2}px`,
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    if (node.refId) {
                      onSelectCapability(node.refId);
                    }
                  }}
                  className={`rounded-full flex flex-col items-center justify-center text-center p-2 transition-all duration-300 outline-none select-none ${
                    node.color
                  } ${
                    node.type === "capability" ? "cursor-pointer" : "cursor-default"
                  } ${isHovered ? "scale-115 z-20 border-sky-500 shadow-md" : "z-10"}`}
                >
                  <span
                    className={`font-mono leading-tight tracking-tight block ${
                      node.type === "root"
                        ? "text-[10px] font-black"
                        : node.type === "volume"
                        ? "text-[9px] font-bold"
                        : node.type === "chapter"
                        ? "text-[8px]"
                        : "text-[7px] font-semibold"
                    }`}
                  >
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hover details / context panel */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur border border-slate-100 p-4 shadow-lg rounded-xl flex items-start gap-3 transition-all duration-300 max-w-md mx-auto md:mx-0 z-30 min-h-[80px]">
          {hoveredNode ? (
            <div className="space-y-1">
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded uppercase tracking-wider">
                {hoveredNode.type}
              </span>
              <h3 className="font-bold text-sm text-slate-800">{hoveredNode.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {hoveredNode.description}
              </p>
              {hoveredNode.type === "capability" && (
                <p className="text-[10px] text-sky-600 font-medium animate-pulse mt-1">
                  Click to drill down into structural implementation lineage
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1 flex items-start gap-2">
              <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <div>
                <h3 className="font-semibold text-xs text-slate-600">Explore Semantic Lineage</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Hover over any circular hub to reveal connections. Click on any specific blue Capability node to view its concrete source code variations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
