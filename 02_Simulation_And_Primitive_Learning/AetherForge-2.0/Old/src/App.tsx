/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { Viewport } from "./components/Viewport";
import { HUD } from "./components/HUD";
import { AgentProbe } from "./components/AgentProbe";
import { PrayerInboxModal } from "./components/PrayerInboxModal";
import { useAetherForge } from "./engine/useAetherForge";
import { Agent, Ideology } from "./engine/types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const { 
    agents, 
    world, 
    resources, 
    isPaused, 
    setIsPaused, 
    simSpeed, 
    setSimSpeed, 
    triggerCataclysm,
    triggerMiracle,
    setNationIdeology,
    injectGitHubTech,
    resolvePrayer,
    ignorePrayer,
    triggerAwarenessSpike,
    agentSelfCreateWorld,
    init, 
    update,
    isStoryPlaying,
    setIsStoryPlaying,
    storyFrames,
    setStoryFrames
  } = useAetherForge();

  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [logFilter, setLogFilter] = useState("");

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId) || null
  , [agents, selectedAgentId]);

  const handleReset = useCallback(() => {
    init(window.innerWidth > 1024 ? window.innerWidth - 320 : window.innerWidth, window.innerHeight);
  }, [init]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSplash) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
      if (e.code === "KeyR") {
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSplash, isPaused, setIsPaused, handleReset]);

  useEffect(() => {
    if (!showSplash) {
      handleReset();
    }
  }, [showSplash, handleReset]);

  // Memoize HUD props to prevent unnecessary re-renders
  const hudProps = useMemo(() => ({
    agents,
    world,
    selectedAgentId,
    isPaused,
    setIsPaused,
    simSpeed,
    setSimSpeed,
    onReset: () => { handleReset(); setIsMobileMenuOpen(false); },
    onTriggerCataclysm: triggerCataclysm,
    onTriggerMiracle: triggerMiracle,
    onSetNationIdeology: setNationIdeology,
    onInjectGitHubTech: injectGitHubTech,
    onResolvePrayer: resolvePrayer,
    onIgnorePrayer: ignorePrayer,
    logFilter,
    setLogFilter,
    isInboxOpen,
    setIsInboxOpen
  }), [agents, world, selectedAgentId, isPaused, setIsPaused, simSpeed, setSimSpeed, handleReset, triggerCataclysm, triggerMiracle, setNationIdeology, injectGitHubTech, resolvePrayer, ignorePrayer, logFilter, setLogFilter, isInboxOpen, setIsInboxOpen]);

  // Memoize Viewport props
  const viewportProps = useMemo(() => ({
    agents,
    resources,
    world,
    onUpdate: update,
    onSelectAgent: setSelectedAgentId,
    selectedAgentId,
    isStoryPlaying,
    setIsStoryPlaying,
    storyFrames
  }), [agents, resources, world, update, setSelectedAgentId, selectedAgentId, isStoryPlaying, setIsStoryPlaying, storyFrames]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans text-slate-200">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="space-y-6 max-w-xl my-auto"
            >
              <h1 className="text-6xl font-black tracking-tighter text-white monospace uppercase glitch-text">
                AetherForge
              </h1>
              <div className="h-[1px] w-full bg-indigo-500/30 relative overflow-hidden">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                />
              </div>
              <p className="text-slate-400 monospace text-sm leading-relaxed uppercase tracking-widest opacity-80">
                Recursive Evolutionary Simulation Engine <br/> 
                <span className="text-indigo-400 text-xs">Aesthetica v3.0-Ω | Substrate Protocol Loaded</span>
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSplash(false)}
                className="mt-12 px-12 py-4 bg-white text-slate-950 font-bold uppercase tracking-widest text-sm rounded-full hover:bg-indigo-400 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                Initialize Genesis
              </motion.button>
            </motion.div>
            
            <div className="p-8 text-[10px] monospace text-slate-700 uppercase flex flex-col sm:flex-row gap-4 justify-center w-full">
              <span>© 2026 craighckby-stack | ALL RIGHTS RESERVED</span>
              <span className="hidden sm:inline">|</span>
              <span>DECRYPT_LATTICE: 0x8F22A0...</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex flex-1 overflow-hidden"
          >
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden fixed top-4 right-4 z-[100] p-3 bg-slate-900 border border-slate-700 rounded-full text-indigo-400 shadow-lg"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                <span className={`h-0.5 w-full bg-current transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`h-0.5 w-full bg-current transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 w-full bg-current transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>

            {/* Left Panel: Sidebar HUD */}
            <div className={`fixed inset-0 lg:relative z-[90] lg:z-auto transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <HUD {...hudProps} />
              {/* Mobile Overlay */}
              {isMobileMenuOpen && (
                <div 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden fixed inset-0 -z-10 bg-black/60 backdrop-blur-sm"
                />
              )}
            </div>

            {/* Center Panel: Viewport */}
            <main className="flex-1 relative overflow-hidden bg-slate-950">
              <Viewport {...viewportProps} />
            </main>

            {/* Agent Detail Modal */}
            <AgentProbe 
              agent={selectedAgent}
              world={world}
              agents={agents}
              onClose={() => setSelectedAgentId(null)}
              onTriggerAwarenessSpike={triggerAwarenessSpike}
              onAgentSelfCreateWorld={(agentId) => {
                agentSelfCreateWorld(agentId, window.innerWidth, window.innerHeight);
              }}
            />

            {/* Divine Prayer Terminal Modal */}
            <PrayerInboxModal
              isOpen={isInboxOpen}
              onClose={() => setIsInboxOpen(false)}
              world={world}
              agents={agents}
              onResolvePrayer={resolvePrayer}
              onIgnorePrayer={ignorePrayer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

