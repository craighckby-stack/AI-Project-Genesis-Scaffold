import React from "react";
import { WorldState, EPOCH_DATA, EpochType, Ideology, CosmicPhase, PHASE_THRESHOLDS } from "../engine/types";
import { Play, Pause, RotateCcw, Activity, Globe, ShieldAlert, Cpu, Zap, Flame, Radiation, ZapOff, Sparkles, AlertTriangle, Heart, Skull, Crown, Book, Cross, Wind, Ghost, Sun, Github, Mail, Inbox, Folder, FolderOpen, ExternalLink } from "lucide-react";
import { auth } from "../lib/firebase";

import { PlanetMap } from "./PlanetMap";
import { PrayerInboxModal } from "./PrayerInboxModal";

interface HUDProps {
  agents: any[]; // Use any or Agent[] from types
  world: WorldState;
  selectedAgentId: number | null;
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
  simSpeed: number;
  setSimSpeed: (s: number) => void;
  onReset: () => void;
  onTriggerCataclysm: (type: "FAMINE" | "GLITCH" | "WAR" | "ASCENSION") => void;
  onTriggerMiracle: (type: "HEAL" | "SMITE" | "REVEAL" | "RESURRECT") => void;
  onSetNationIdeology: (nationId: string, ideology: Ideology) => void;
  onInjectGitHubTech?: (techArr: any[]) => void;
  onResolvePrayer?: (prayerId: string, replyText: string) => void;
  onIgnorePrayer?: (prayerId: string) => void;
  logFilter: string;
  setLogFilter: (s: string) => void;
  isInboxOpen: boolean;
  setIsInboxOpen: (open: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({ 
  agents, 
  world, 
  selectedAgentId, 
  isPaused, 
  setIsPaused, 
  simSpeed, 
  setSimSpeed, 
  onReset, 
  onTriggerCataclysm, 
  onTriggerMiracle, 
  onSetNationIdeology, 
  onInjectGitHubTech, 
  onResolvePrayer,
  onIgnorePrayer,
  logFilter, 
  setLogFilter,
  isInboxOpen,
  setIsInboxOpen
}) => {
  const epoch = EPOCH_DATA[world.epoch];

  const [ghUsername, setGhUsername] = React.useState(() => localStorage.getItem("af_github_username") || "");
  const [ghRepo, setGhRepo] = React.useState(() => localStorage.getItem("af_github_repo") || "");
  const [ghToken, setGhToken] = React.useState(() => localStorage.getItem("af_github_token") || "");
  const [ingestStatus, setIngestStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleUsernameChange = (val: string) => {
    setGhUsername(val);
    localStorage.setItem("af_github_username", val.trim());
  };

  const handleRepoChange = (val: string) => {
    setGhRepo(val);
    localStorage.setItem("af_github_repo", val.trim());
  };

  const handleTokenChange = (val: string) => {
    setGhToken(val);
    localStorage.setItem("af_github_token", val.trim());
  };

  const handleGitHubIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghUsername.trim()) return;

    // Save references explicitly
    localStorage.setItem("af_github_username", ghUsername.trim());
    localStorage.setItem("af_github_repo", ghRepo.trim());
    localStorage.setItem("af_github_token", ghToken.trim());

    setIngestStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch("/api/github-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: ghUsername.trim(),
          repoName: ghRepo.trim() || undefined,
          token: ghToken.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Substrate API rejected connection.");
      }

      // Automatically initialize the required folders by pushing README files
      if (ghToken.trim()) {
        const folders = ["agent worlds", "prayers"];
        for (const folder of folders) {
          fetch("/api/github-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: ghUsername.trim(),
              repoName: data.repoName || ghRepo.trim(),
              path: `${folder}/README.md`,
              content: `# ${folder}\n\nThis directory is automatically managed by the AetherForge Ω simulation framework. Agent generated substrate configurations and divine prayers will be written here.`,
              token: ghToken.trim(),
              commitMessage: `🌌 Genesis: Initialize simulation directory ${folder}`
            })
          }).catch(e => console.warn(`Silent fail attempting to initialize folder ${folder}`, e));
        }
      }

      setIngestStatus("success");
      if (onInjectGitHubTech) {
        onInjectGitHubTech(data.technologies);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to communicate with Aether server.");
      setIngestStatus("error");
    }
  };

  const filteredEvents = React.useMemo(() => 
    world.events.filter(e => 
      e.message.toLowerCase().includes(logFilter.toLowerCase())
    )
  , [world.events, logFilter]);

  return (
    <div className="flex flex-col h-full border-r border-slate-800 bg-slate-900/90 backdrop-blur-3xl w-full lg:w-80 p-6 space-y-8 select-none overflow-y-auto overflow-x-hidden relative">
      {/* Glitch Overlay for low integrity */}
      {world.integrity < 30 && (
        <div className="absolute inset-0 pointer-events-none bg-red-500/5 animate-pulse z-[-1]" />
      )}

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tighter text-white monospace uppercase flex items-center gap-2">
          AetherForge <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 animate-pulse">Ω-PRIME</span>
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-slate-500 monospace uppercase tracking-widest">Recursive Divine Substrate</p>
          <div className={`w-1.5 h-1.5 rounded-full ${auth.currentUser ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-slate-700"}`} title={auth.currentUser ? "Cloud Synchronized" : "Local Mode"} />
        </div>
      </div>

      {/* Global Status */}
      <div className="space-y-4">
        <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-indigo-300 font-bold monospace uppercase tracking-wider">{world.phase}</span>
            <span className="text-[9px] text-slate-500 monospace uppercase">Cosmic Phase</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 group relative"
              style={{ width: `${Math.min(100, (world.complexity / 300000) * 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
            </div>
          </div>
        </div>

        {world.solarRequiemActive && (
          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30 animate-pulse">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-red-500 font-bold monospace uppercase flex items-center gap-1"><Sun size={10} /> Stellar Requiem</span>
              <span className="text-[9px] text-red-400 monospace uppercase">Sun Health: {Math.max(0, world.sunHealth).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-500"
                style={{ width: `${Math.max(0, world.sunHealth)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatusCard label="Epoch" value={world.epoch} color={(epoch as any)?.color || "text-emerald-400"} />
          <StatusCard label="Population" value={(world.population ?? 0).toString()} color="text-white" />
          
          <StatusCard label="Nations" value={(world.nationCount ?? 0).toString()} color="text-indigo-400" />
          <StatusCard label="Schisms" value={(world.totalSchisms ?? 0).toString()} color="text-fuchsia-400" />

          <StatusCard label="Wars" value={(world.totalWars ?? 0).toString()} color="text-red-400" />
          <StatusCard label="Peace Acts" value={(world.totalPeaceTreaties ?? 0).toString()} color="text-sky-400" />

          <div className={`relative ${(world.stability ?? 1) < 0.4 ? "animate-pulse" : ""}`}>
             <StatusCard label="Stability" value={`${Math.floor((world.stability ?? 1) * 100)}%`} color={(world.stability ?? 1) > 0.7 ? "text-emerald-400" : ((world.stability ?? 1) > 0.4 ? "text-amber-400" : "text-red-500")} />
             {(world.stability ?? 1) < 0.4 && <div className="absolute -inset-1 bg-red-500/20 blur-sm rounded-lg -z-10" />}
          </div>

          <StatusCard label="Revolutions" value={(world.totalRevolutions ?? 0).toString()} color="text-amber-500" />
          
          <StatusCard label="Tech Level" value={(world.techLevel ?? 0).toFixed(1)} color="text-sky-400" />
          <StatusCard label="Resources" value={`${Math.floor((world.resourceDensity ?? 0) * 100)}%`} color="text-lime-400" />
          
          <StatusCard label="Divine Points" value={Math.floor(world.faithPoints ?? 0).toString()} color="text-cyan-400" />
          <StatusCard label="Sin Load" value={(world.sinAccumulation ?? 0).toFixed(1)} color="text-red-500" />
          
          <StatusCard label="Entropy" value={(world.entropy ?? 0).toFixed(2)} color="text-slate-400" />
        </div>

        {/* Global Map Overlay */}
        <div className="pt-2">
          <PlanetMap world={world} agents={agents} selectedAgentId={selectedAgentId} />
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-slate-500 uppercase monospace">Substrate Integrity</span>
            <span className={`text-[9px] monospace ${world.integrity < 50 ? "text-red-400 animate-pulse font-bold" : "text-emerald-400"}`}>{world.integrity.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${world.integrity < 50 ? "bg-red-500" : (world.integrity < 80 ? "bg-amber-500" : "bg-emerald-500")}`} 
              style={{ width: `${world.integrity}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-slate-500 uppercase monospace">Judgment Countdown</span>
            <span className="text-[9px] monospace text-purple-400">{world.judgmentMeter.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500" 
              style={{ width: `${world.judgmentMeter}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nations Overview */}
      <div className="space-y-4 flex-1 min-h-0 flex flex-col">
        <SectionTitle icon={<Globe size={12} />} label="Substrate Nations" />
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {world.nations.map(n => (
            <div key={n.id} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-2 transition-all hover:bg-slate-800/60 group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(var(--color-rgb),0.5)]" style={{ backgroundColor: n.color }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-bold monospace uppercase group-hover:text-indigo-300 transition-colors">{n.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] bg-indigo-500/10 text-indigo-400 px-1 rounded border border-indigo-500/20 monospace uppercase font-bold">{n.ideology}</span>
                      <span className="text-[7px] text-slate-600 uppercase monospace">{n.faithType}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <Activity size={8} className="text-slate-600" />
                    <span className="text-[10px] text-indigo-100 monospace">{n.population}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu size={8} className="text-sky-600" />
                    <span className="text-[8px] text-sky-500/80 monospace">T{n.techLevel.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={8} className="text-slate-600" />
                    <span className="text-[8px] text-slate-500 monospace">AGE: {Math.floor(world.clock - n.establishedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[7px] monospace uppercase text-slate-600">
                  <span>Stability</span>
                  <span className={n.stability > 0.7 ? "text-emerald-500" : "text-amber-500"}>{Math.floor(n.stability * 100)}%</span>
                </div>
                <div className="h-0.5 bg-slate-900 rounded-full overflow-hidden">
                   <div 
                    className={`h-full transition-all duration-500 ${n.stability > 0.7 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${n.stability * 100}%` }}
                  />
                </div>
              </div>

              {/* Ideology Selector */}
              <div className="flex flex-wrap gap-1 mt-1 opacity-20 group-hover:opacity-100 transition-opacity">
                {Object.values(Ideology).map(id => (
                  <button
                    key={id}
                    onClick={() => onSetNationIdeology(n.id, id)}
                    className={`text-[5px] px-1 rounded border transition-all ${n.ideology === id ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                  >
                    {id}
                  </button>
                ))}
              </div>

              {/* Hostility Bars (mini
