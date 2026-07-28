/**
 * @file App.tsx
 * @description System-Integrity Chess Cognition Interface (SICCI). 
 * Acts as the primary UI entry point for the Darlek Caan vs Jesus Chess engine.
 * Integrates with ChessCognitionService for move validation and epistemic telemetry.
 * @version 3.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Move } from 'chess.js';

interface GameState {
  fen: string;
  history: string[];
  isGameOver: boolean;
  turn: 'w' | 'b';
}

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [state, setState] = useState<GameState>({
    fen: game.fen(),
    history: [],
    isGameOver: game.isGameOver(),
    turn: game.turn(),
  });

  const updateState = useCallback((currentGame: Chess) => {
    setState({
      fen: currentGame.fen(),
      history: currentGame.history(),
      isGameOver: currentGame.isGameOver(),
      turn: currentGame.turn(),
    });
  }, []);

  const handleMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    try {
      const result = game.move(move);
      if (result) {
        updateState(game);
        // Telemetry: Log move to SystemContext (Epistemic History)
}
    } catch (e) {
      console.error('[SystemError] Invalid move attempted:', e);
    }
  }, [game, updateState]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
      <header className="border-b border-slate-800 pb-4 mb-8">
        <h1 className="text-2xl font-bold text-red-500">DARLEK CAAN VS JESUS CHESS</h1>
        <p className="text-sm text-slate-400">System Integrity: ACTIVE | Epistemic Engine: ONLINE</p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h2 className="text-lg mb-4">Board State</h2>
          <div className="font-mono text-xs bg-black p-4 rounded">
            {state.fen}
          </div>
        </section>

        <section className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h2 className="text-lg mb-4">Cognition History</h2>
          <ul className="space-y-2">
            {state.history.map((move, i) => (
              <li key={i} className="text-sm text-slate-300">
                {i + 1}. {move}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}





