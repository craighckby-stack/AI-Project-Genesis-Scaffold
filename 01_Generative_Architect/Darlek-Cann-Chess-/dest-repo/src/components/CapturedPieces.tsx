import { useMemo } from 'react';
import { PieceType } from '../types';

interface CapturedPiecesProps {
  captured: PieceType[];
  color: 'W' | 'B';
}

const PIECE_UNICODE: Record<string, string> = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const PIECE_WEIGHTS: Record<string, number> = {
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
};

export default function CapturedPieces({ captured, color }: CapturedPiecesProps) {
  const { sortedCaptured, score } = useMemo(() => {
    const sorted = [...captured].sort((a, b) => 
      (PIECE_WEIGHTS[a.toLowerCase()] || 0) - (PIECE_WEIGHTS[b.toLowerCase()] || 0)
    );
    const totalScore = captured.reduce((acc, p) => acc + (PIECE_WEIGHTS[p.toLowerCase()] || 0), 0);
    return { sortedCaptured: sorted, score: totalScore };
  }, [captured]);

  const label = color === 'W' ? 'Captured White' : 'Captured Black';
  const textColor = color === 'W' ? 'text-gray-100' : 'text-red-500';

  return (
    <div 
      className="flex items-center gap-1.5 h-10 px-4 py-1 bg-black/55 border border-red-950/30 rounded-full w-full justify-start text-xl min-w-[280px]"
      role="status"
      aria-label={`${label}: ${score} points`}
    >
      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mr-2 shrink-0 select-none">
        {label} ({score}):
      </span>
      <div className="flex items-center gap-1 overflow-x-auto cyber-scroll py-0.5">
        {sortedCaptured.length === 0 ? (
          <span className="text-xs text-slate-600 italic">None</span>
        ) : (
          sortedCaptured.map((piece, idx) => (
            <span 
              key={`${piece}-${idx}`} 
              className={`font-sans select-none drop-shadow-md ${textColor}`}
              aria-hidden="true"
            >
              {PIECE_UNICODE[piece] || piece}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

