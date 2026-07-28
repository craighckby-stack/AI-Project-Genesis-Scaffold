import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

export const useChessEngine = () => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());

  const makeMove = useCallback((move: any) => {
    const result = game.move(move);
    if (result) setFen(game.fen());
    return result;
  }, [game]);

  return { fen, makeMove, game };
};





