import { Chess, Square } from 'chess.js';

export const ChessEngine = {
  safeRemove: (board: Chess, square: Square) => {
    if (board.get(square)?.type === 'k') return false;
    board.remove(square);
    return true;
  },
  safePut: (board: Chess, piece: { type: string; color: string }, square: Square) => {
    if (board.get(square)?.type === 'k') return false;
    board.put(piece as any, square);
    return true;
  }
};