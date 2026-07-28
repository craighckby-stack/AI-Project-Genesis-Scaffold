import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { OMEGA_BOOT_SEQUENCE } from './lib/omega-bootstrap';
import { useSystemBootstrap } from './hooks/useSystemBootstrap';
import { useQuantumState } from './hooks/useQuantumState';
import { useAgentOrchestra } from './hooks/useAgentOrchestra';
import { speakDalekText, speakJesusText, stopSpeaking, initAudioEngine } from './components/SoundEngine';
import { GameMode, GameSettings, BoardTheme, GameDifficulty } from './types';

export default function App() {
  const isReady = useSystemBootstrap();
  const { dispatch: dispatchOrchestra } = useAgentOrchestra();
  const [quantumMetrics, setQuantumMetrics] = useQuantumState({
    timelineStability: 100,
    entropyCoefficient: 0.12,
    omegaTuningStatus: 'STABILIZED'
  });

  const [chess] = useState(() => new Chess());
  const [settings, setSettings] = useState<GameSettings>({
    mode: GameMode.PVD,
    difficulty: GameDifficulty.MEDIUM,
    theme: BoardTheme.CRUCIBLE,
    playerColor: 'w',
    muteSounds: false,
    synthesizerVolume: 0.6,
  });

  const [dialogue, setDialogue] = useState({ text: "SYSTEM INITIALIZED. AWAITING INPUT.", emotion: "prophetic" });

  const handleAudioInit = useCallback(() => {
    initAudioEngine();
    window.removeEventListener('click', handleAudioInit);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleAudioInit);
    OMEGA_BOOT_SEQUENCE.init().then(() => window.dispatchEvent(new CustomEvent('system-ready')));
    return () => window.removeEventListener('click', handleAudioInit);
  }, [handleAudioInit]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <header className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter">DARLEK CANN v3.0</h1>
        <div className="text-xs opacity-60">STABILITY: {quantumMetrics.timelineStability}%</div>
      </header>
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* ChessBoard component injection point */}
            <div className="aspect-square bg-zinc-900 rounded-lg border border-zinc-800" />
          </div>
          <aside className="space-y-6">
            <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
              <h2 className="text-sm uppercase mb-2">Temporal Dialogue</h2>
              <p className="text-sm leading-relaxed">{dialogue.text}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}



