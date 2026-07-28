import React, { useState, useEffect, useMemo } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthSound } from './SoundEngine';
import { BoardTheme } from '../types';

interface ChessPieceSVGProps {
  type: PieceSymbol;
  color: 'w' | 'b';
  theme: BoardTheme;
}

export function ChessPieceSVG({ type, color, theme }: ChessPieceSVGProps) {
  const getColors = () => {
    const isWhite = color === 'w';
    const themes: Record<BoardTheme, { w: string[], b: string[], stroke: string, glow: string }> = {
      [BoardTheme.CRUCIBLE]: { w: ['#ffffff', '#fca5a5'], b: ['#4c0519', '#270208'], stroke: isWhite ? '#e11d48' : '#fb7185', glow: isWhite ? 'rgba(225, 29, 72, 0.5)' : 'rgba(251, 113, 133, 0.4)' },
      [BoardTheme.CYBER]: { w: ['#ffffff', '#a5f3fc'], b: ['#164e63', '#083344'], stroke: isWhite ? '#06b6d4' : '#22d3ee', glow: isWhite ? 'rgba(6, 182, 212, 0.6)' : 'rgba(34, 211, 238, 0.5)' },
      [BoardTheme.OBSIDIAN]: { w: ['#ffffff', '#fde68a'], b: ['#78350f', '#451a03'], stroke: isWhite ? '#f59e0b' : '#fbbf24', glow: isWhite ? 'rgba(245, 158, 11, 0.5)' : 'rgba(251, 191, 36, 0.4)' },
      [BoardTheme.CLASSIC]: { w: ['#ffffff', '#e2e8f0'], b: ['#334155', '#0f172a'], stroke: isWhite ? '#475569' : '#1e293b', glow: 'transparent' }
    };
    const config = themes[theme];
    return { fill1: isWhite ? config.w[0] : config.b[0], fill2: isWhite ? config.w[1] : config.b[1], stroke: config.stroke, glow: config.glow };
  };

  const { fill1, fill2, stroke, glow } = getColors();
  const gradId = `grad-${color}-${theme}-${type}`;

  return (
    <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: glow !== 'transparent' ? `drop-shadow(0 0 5px ${glow})` : 'none' }}>
      <defs><linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={fill1} /><stop offset="100%" stopColor={fill2} /></linearGradient></defs>
      <g fill={`url(#${gradId})`} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Simplified path logic for brevity and performance */}
        <circle cx="22.5" cy="22.5" r="15" />
      </g>
    </svg>
  );
}

export function ChessBoard({ chess, theme, playerColor, onMove, interactive, isMuted, synthVolume }: any) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  const handleSquareClick = (squareKey: Square) => {
    if (!interactive) return;
    if (possibleMoves.includes(squareKey)) {
      onMove(selectedSquare, squareKey);
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }
    const piece = chess.get(squareKey);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(squareKey);
      setPossibleMoves(chess.moves({ square: squareKey, verbose: true }).map((m: any) => m.to));
      playSynthSound('blip', isMuted, synthVolume);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const boardGrid = useMemo(() => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return playerColor === 'w' ? ranks.flatMap(r => files.map(f => `${f}${r}` as Square)) : ranks.reverse().flatMap(r => files.reverse().map(f => `${f}${r}` as Square));
  }, [playerColor]);

  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto bg-black/40 p-3 rounded-2xl border border-zinc-800/80">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-0.5">
        {boardGrid.map((sq) => (
          <motion.div key={sq} onClick={() => handleSquareClick(sq)} className={`relative flex items-center justify-center ${selectedSquare === sq ? 'bg-indigo-500/50' : 'bg-zinc-800/50'}`}>
            {chess.get(sq) && <ChessPieceSVG type={chess.get(sq).type} color={chess.get(sq).color} theme={theme} />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}



