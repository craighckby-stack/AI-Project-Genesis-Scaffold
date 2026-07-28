import { useMemo } from 'react';
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

export default function Chessboard({ board, focusedCell, selectedCell, validMoves, lastMove, highContrast, showFreeze, onSquareClick }: ChessboardProps) {
  const targetSet = useMemo(() => new Set(validMoves.map(m => `${m.to.r},${m.to.c}`)), [validMoves]);

  const getSquareStyles = (r: number, c: number, isCellLight: boolean) => {
    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
    const isLastMove = (lastMove?.from.r === r && lastMove?.from.c === c) || (lastMove?.to.r === r && lastMove?.to.c === c);
    const isFocused = focusedCell.r === r && focusedCell.c === c;

    let base = isCellLight ? 'bg-chess-light' : 'bg-chess-dark';
    if (highContrast) base = isCellLight ? 'bg-white border border-black' : 'bg-black border border-white';

    let highlight = '';
    if (isSelected) highlight = highContrast ? 'outline-4 outline-amber-500 z-10' : 'bg-red-500/20 ring-inset ring-2 ring-red-500 z-10';
    else if (isLastMove) highlight = highContrast ? 'bg-amber-400 text-black' : 'bg-amber-500/15 ring-inset ring-2 ring-amber-500/60';
    
    return `${base} ${highlight} ${isFocused ? 'outline-4 outline-red-500 z-10 ring-4 ring-red-500/40' : ''}`;
  };

  return (
    <div className="relative flex p-1 bg-black rounded-xl shadow-2xl border-4 border-red-950/40">
      <div id="board-wrapper" className="relative rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 relative" role="grid">
          {board.map((row, r) => row.map((piece, c) => {
            const isTarget = targetSet.has(`${r},${c}`);
            return (
              <button
                key={`${r}-${c}`}
                className={`square-btn relative flex items-center justify-center h-12 w-12 md:h-16 md:w-16 ${getSquareStyles(r, c, (r + c) % 2 === 0)}`}
                onClick={() => onSquareClick(r, c)}
                aria-label={`${convertToAlgebraic(r, c)}: ${piece !== '.' ? PIECE_NAMES[piece] : 'Empty'}`}
              >
                {piece !== '.' && (
                  <span className={`text-3xl md:text-4xl ${getPieceColor(piece) === 'W' ? 'text-gray-100' : 'text-slate-900'}`}>
                    {PIECE_UNICODE[piece]}
                  </span>
                )}
                {isTarget && <div className={`absolute rounded-full ${piece === '.' ? 'w-3 h-3 bg-green-500/80' : 'w-7 h-7 border-4 border-green-500/80'}`} />}
              </button>
            );
          }))}
        </div>
        {showFreeze && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/80 z-40">
            <span className="text-5xl">❄️</span>
            <p className="text-blue-100 font-bold">Quantum Processor Active</p>
          </div>
        )}
      </div>
    </div>
  );
}
