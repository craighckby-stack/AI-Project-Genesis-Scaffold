import { useReducer, useEffect, useCallback, useState } from 'react';
import { PieceType, PlayerColor, Position, ChessMove, CastlingRights } from './types';
import { playSound } from './audio';

export type GameState = {
  board: PieceType[][];
  turn: PlayerColor;
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  gameResult: 'active' | 'checkmate' | 'draw';
  moveHistory: ChessMove[];
};

type GameAction = 
  | { type: 'MOVE_PIECE'; payload: { move: ChessMove; nextState: Partial<GameState> } }
  | { type: 'SET_RESULT'; payload: GameState['gameResult'] }
  | { type: 'RESTORE'; payload: GameState }
  | { type: 'RESET' };

const INITIAL_STATE: GameState = {
  board: [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    Array(8).fill('.'),
    Array(8).fill('.'),
    Array(8).fill('.'),
    Array(8).fill('.'),
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ],
  turn: 'W',
  capturedWhite: [],
  capturedBlack: [],
  castlingRights: { wKingSide: true, wQueenSide: true, bKingSide: true, bQueenSide: true },
  enPassantTarget: null,
  gameResult: 'active',
  moveHistory: []
};

const STORAGE_KEY = 'accessichess_pro_save';

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_PIECE': 
      return { 
        ...state, 
        ...action.payload.nextState, 
        moveHistory: [...state.moveHistory, action.payload.move] 
      };
    case 'SET_RESULT': return { ...state, gameResult: action.payload };
    case 'RESTORE': return action.payload;
    case 'RESET': return INITIAL_STATE;
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initial;
    } catch (e) {
      console.error('Failed to parse saved game', e);
      return initial;
    }
  });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'saving' | 'synced'>('synced');

  useEffect(() => {
    const saveGame = async () => {
      setCloudStatus('saving');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setCloudStatus('synced');
    };
    
    const timer = setTimeout(saveGame, 500);
    return () => clearTimeout(timer);
  }, [state]);

  const handleMove = useCallback((move: ChessMove, nextState: Partial<GameState>) => {
    playSound(move.captured ? 'capture' : 'move', soundEnabled);
    dispatch({ type: 'MOVE_PIECE', payload: { move, nextState } });
  }, [soundEnabled]);

  return (
    <div className="app-container">
      <main>Chessboard and HUD rendering...</main>
    </div>
  );
}

