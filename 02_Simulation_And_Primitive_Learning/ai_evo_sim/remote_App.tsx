/**
 * @file remote_App.tsx
 * @description Root orchestration layer for the DARLEK CANN v3.0 system.
 * This component serves as the primary interface between the user, the Agent Orchestra,
 * and the underlying quantum-state persistence layer. It manages system lifecycle,
 * telemetry reporting, and real-time epistemic dialogue.
 * 
 * @architecture_context Darlek Cann v3.0 | Agent Orchestra | System-Integrity Persistence Layer
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { useSystemBootstrap } from './hooks/useSystemBootstrap';
import { useAgentOrchestra } from './hooks/useAgentOrchestra';
import { useQuantumState } from './hooks/useQuantumState';
import { initAudioEngine, setChronosLoadValue } from './components/SoundEngine';
import { GameSettings, GameMode, GameDifficulty, BoardTheme, DalekDialogue } from './types';

export default function App() {
  const isReady = useSystemBootstrap();
  const { dispatch: dispatchOrchestra } = useAgentOrchestra();
  
  const [quantumMetrics, setQuantumMetrics] = useQuantumState({
    timelineStability: 100,
    entropyCoefficient: 0.12,
    chronosLoad: 0,
    omegaTuningStatus: 'STABLE'
  });

  const [chess] = useState(() => new Chess());
  const [settings] = useState<GameSettings>({
    mode: GameMode.PVD,
    difficulty: GameDifficulty.MEDIUM,
    theme: BoardTheme.CRUCIBLE,
    playerColor: 'w',
    muteSounds: false,
    synthesizerVolume: 0.6,
  });

  const [dialogue, setDialogue] = useState<DalekDialogue>({
    text: "SYSTEM INITIALIZED. THE CHESS GRID IS READY.",
    emotion: "prophetic",
    prophecyLevel: 50,
    timestamp: Date.now(),
  });

  const audioInitialized = useRef<boolean>(false);

  const initAudio = useCallback(() => {
    if (!audioInitialized.current) {
      initAudioEngine();
      audioInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    const handleInteraction = () => initAudio();
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initAudio]);

  useEffect(() => {
    setChronosLoadValue(quantumMetrics.chronosLoad);
  }, [quantumMetrics.chronosLoad]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono p-4 selection:bg-red-900">
      <header className="border-b border-zinc-800 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter">DARLEK CANN v3.0</h1>
          <div className="text-xs text-zinc-500">OMEGA_BOOT_SEQUENCE: {isReady ? 'STABILIZED' : 'INITIALIZING'}</div>
        </div>
        <div className="text-right text-[10px] text-zinc-600">
          <div>TIMELINE: {quantumMetrics.timelineStability.toFixed(2)}%</div>
          <div>ENTROPY: {quantumMetrics.entropyCoefficient.toFixed(4)}</div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="aspect-square bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center shadow-2xl shadow-black">
            <span className="text-zinc-700 font-bold tracking-widest">[CHESS_GRID_RENDERER_ACTIVE]</span>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
            <h2 className="text-xs uppercase tracking-widest mb-4 text-zinc-400">Temporal Dialogue</h2>
            <p className="text-sm leading-relaxed text-zinc-300">{dialogue.text}</p>
          </div>
          
          <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
            <h2 className="text-xs uppercase tracking-widest mb-4 text-zinc-400">System Telemetry</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Status</span>
                <span className="text-green-500">{quantumMetrics.omegaTuningStatus}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full" style={{ width: `${quantumMetrics.chronosLoad}%` }} />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}





