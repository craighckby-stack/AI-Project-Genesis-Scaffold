import { useMemo, memo } from 'react';
import { PieceType, Position, ChessMove } from '../types';
import { getPieceColor, convertToAlgebraic } from '../chessEngine';

interface ChessboardProps {
  board: PieceType[][];
  focusedCell: Position;
  selectedCell: Position | null;
  validMoves: ChessMove[];
  lastMove: ChessMove | null;
  highContrast: boolean;
  isThinking: boolean;
  showFreeze: boolean;
  onSquareClick: (r: number, c: number) => void;
}

const PIECE_UNICODE: Record<string, string> = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const PIECE_NAMES: Record<string, string> = {
  'p': 'Black Pawn', 'r': 'Black Rook', 'n': 'Black Knight', 'b': 'Black Bishop', 'q': 'Black Queen', 'k': 'Black King',
  'P': 'White Pawn', 'R': 'White Rook', 'N': 'White Knight', 'B': 'White Bishop', 'Q': 'White Queen', 'K': 'White King'
};

const Square = memo(({ r, c, piece, isTarget, isSelected, isLastMove, isFocused, highContrast, onClick }: any) => {
  const isLight = (r + c) % 2 === 0;
  const baseClass = highContrast 
    ? (isLight ? 'bg-white border border-black' : 'bg-black border border-white')
    : (isLight ? 'bg-chess-light' : 'bg-chess-dark');
  
  const highlight = isSelected 
    ? (highContrast ? 'outline-4 outline-amber-500' : 'bg-red-500/20 ring-inset ring-2 ring-red-500')
    : isLastMove ? (highContrast ? 'bg-amber-400' : 'bg-amber-500/15 ring-inset ring-2 ring-amber-500/60') : '';

  return (
    <button
      className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative ${baseClass} ${highlight} ${isFocused ? 'ring-4 ring-red-500 z-10' : ''}`}
      onClick={() => onClick(r, c)}
      aria-label={`${convertToAlgebraic(r, c)}: ${piece !== '.' ? PIECE_NAMES[piece] : 'Empty'}`}
    >
      {piece !== '.' && (
        <span className={`text-3xl md:text-4xl ${highContrast ? (getPieceColor(piece) === 'W' ? 'text-blue-600' : 'text-red-600') : (getPieceColor(piece) === 'W' ? 'text-gray-100' : 'text-slate-900')}`}>
          {PIECE_UNICODE[piece]}
        </span>
      )}
      {isTarget && <div className={`absolute rounded-full ${piece === '.' ? 'w-3 h-3 bg-green-500/80' : 'w-7 h-7 border-4 border-green-500/80'}`} />}
    </button>
  );
});

export default function Chessboard({ board, focusedCell, selectedCell, validMoves, lastMove, highContrast, showFreeze, onSquareClick }: ChessboardProps) {
  const moveMap = useMemo(() => new Set(validMoves.map(m => `${m.to.r},${m.to.c}`)), [validMoves]);

  return (
    <div className="relative flex p-1 bg-black rounded-xl shadow-2xl border-4 border-red-950/40">
      <div className="relative rounded-lg overflow-hidden grid grid-cols-8">
        {board.map((row, r) => 
          row.map((piece, c) => (
            <Square 
              key={`${r}-${c}`} 
              r={r} c={c} piece={piece} 
              isTarget={moveMap.has(`${r},${c}`)}
              isSelected={selectedCell?.r === r && selectedCell?.c === c}
              isLastMove={(lastMove?.from.r === r && lastMove?.from.c === c) || (lastMove?.to.r === r && lastMove?.to.c === c)}
              isFocused={focusedCell.r === r && focusedCell.c === c}
              highContrast={highContrast}
              onClick={onSquareClick}
            />
          ))
        )}
        {showFreeze && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/80 backdrop-blur-sm z-20">
            <span className="text-5xl animate-spin">❄️</span>
            <p className="text-blue-100 font-bold mt-2">Quantum Processor Active</p>
          </div>
        )}
      </div>
    </div>
  );
}


