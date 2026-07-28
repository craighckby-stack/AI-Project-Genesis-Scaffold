import { useState, useReducer, useCallback } from 'react';
import { PieceType, PlayerColor, Position, ChessMove, CastlingRights } from './types';
import { getPieceColor, hasAnyLegalMoves, isKingInCheck } from './chessEngine';
import { playSound } from './audio';
import Chessboard from './components/Chessboard';
import AriaStatus from './components/AriaStatus';
import CapturedPieces from './components/CapturedPieces';
import GameTerminal from './components/GameTerminal';
import MoveHistory from './components/MoveHistory';

type GameState = {
  board: PieceType[][];
  turn: PlayerColor;
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  gameResult: 'active' | 'checkmate_W' | 'checkmate_B' | 'stalemate';
  announcement: string;
};

type Action = { type: 'MOVE'; payload: { move: ChessMove; castling: CastlingRights; ep: Position | null } };

const INITIAL_BOARD: PieceType[][] = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'MOVE':
      const { move, castling, ep } = action.payload;
      const newBoard = state.board.map(r => [...r]);
      newBoard[move.to.r][move.to.c] = move.piece;
      newBoard[move.from.r][move.from.c] = '.';
      
      const nextTurn = state.turn === 'W' ? 'B' : 'W';
      const hasMoves = hasAnyLegalMoves(nextTurn, newBoard, castling, ep);
      const inCheck = isKingInCheck(nextTurn, newBoard);

      let result: GameState['gameResult'] = 'active';
      let announcement = '';

      if (!hasMoves) {
        result = inCheck ? (nextTurn === 'W' ? 'checkmate_W' : 'checkmate_B') : 'stalemate';
        announcement = inCheck ? 'Checkmate!' : 'Stalemate.';
      } else if (inCheck) {
        announcement = 'Check!';
      }

      return {
        ...state,
        board: newBoard,
        turn: nextTurn,
        gameResult: result,
        announcement,
        capturedWhite: move.captured && getPieceColor(move.captured) === 'W' ? [...state.capturedWhite, move.captured] : state.capturedWhite,
        capturedBlack: move.captured && getPieceColor(move.captured) === 'B' ? [...state.capturedBlack, move.captured] : state.capturedBlack
      };
    default:
      return state;
  }
};

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, {
    board: INITIAL_BOARD,
    turn: 'W',
    capturedWhite: [],
    capturedBlack: [],
    gameResult: 'active',
    announcement: 'System Ready.'
  });
  const [soundEnabled] = useState(true);

  const handleMove = useCallback((move: ChessMove, castling: CastlingRights, ep: Position | null) => {
    dispatch({ type: 'MOVE', payload: { move, castling, ep } });
    playSound(move.captured ? 'capture' : 'move', soundEnabled);
  }, [soundEnabled]);

  return (
    <div className="app-container">
      <AriaStatus message={state.announcement} />
      <div className="main-layout">
        <Chessboard board={state.board} onMove={handleMove} disabled={state.gameResult !== 'active'} />
        <aside className="sidebar">
          <CapturedPieces white={state.capturedWhite} black={state.capturedBlack} />
          <MoveHistory />
          <GameTerminal />
        </aside>
      </div>
    </div>
  );
}
