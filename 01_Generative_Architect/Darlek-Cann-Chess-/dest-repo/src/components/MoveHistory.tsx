import { useEffect, useRef, useMemo } from 'react';
import { ChessMove } from '../types';
import { convertToAlgebraic } from '../chessEngine';

interface MoveHistoryProps {
  moves: ChessMove[];
}

const formatMove = (move: ChessMove): string => {
  const from = convertToAlgebraic(move.from.r, move.from.c);
  const to = convertToAlgebraic(move.to.r, move.to.c);
  const promo = move.promotion ? `=${move.promotion.toUpperCase()}` : '';
  return `${from}→${to}${promo}`;
};

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pairedMoves = useMemo(() => {
    return moves.reduce((acc, move, i) => {
      if (i % 2 === 0) {
        acc.push({ moveNum: Math.floor(i / 2) + 1, white: formatMove(move), black: undefined });
      } else {
        acc[acc.length - 1].black = formatMove(move);
      }
      return acc;
    }, [] as { moveNum: number; white: string; black?: string }[]);
  }, [moves]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [pairedMoves.length]);

  return (
    <div className="w-full bg-[#0a0202]/85 p-4 rounded-xl border border-red-900/30 shadow-xl flex flex-col flex-grow transition-all duration-1000">
      <div className="border-b border-red-900/20 pb-2 mb-4">
        <h2 className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
          <span>⌬</span> Move Log
        </h2>
      </div>
      
      <div 
        ref={containerRef}
        className="bg-black/60 rounded p-3 flex-1 min-h-[120px] overflow-y-auto space-y-1.5 text-[11px] font-mono border border-red-950/30 cyber-scroll select-none"
      >
        {pairedMoves.length === 0 ? (
          <div className="text-slate-500 italic text-center py-8">No moves made yet</div>
        ) : (
          pairedMoves.map(({ moveNum, white, black }) => (
            <div key={moveNum} className="flex justify-between py-1 px-1.5 border-b border-red-950/10 text-slate-300 hover:bg-red-950/20 rounded transition-all">
              <span className="text-slate-500 w-10">{moveNum}.</span>
              <span className="flex-1 font-semibold text-red-200">{white}</span>
              <span className="flex-1 font-semibold text-red-400">{black || '...'}</span>
            </div>
          ))
        )}
      </div>

      <div className="text-center text-[10px] text-slate-500 font-mono mt-auto pt-2">
        Darlek Cann Engine &bull; Red-Black Tactician State
      </div>
    </div>
  );
}
