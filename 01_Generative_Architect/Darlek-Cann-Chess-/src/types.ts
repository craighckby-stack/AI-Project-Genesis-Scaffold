export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k' | 'P' | 'R' | 'N' | 'B' | 'Q' | 'K' | '.';

export type PlayerColor = 'W' | 'B';

export type GameStatus = 'active' | 'checkmate_W' | 'checkmate_B' | 'stalemate' | 'draw';

export type PlayerController = 'human' | 'ai';

export interface Position {
  r: number;
  c: number;
}

export interface CastlingRights {
  wKingSide: boolean;
  wQueenSide: boolean;
  bKingSide: boolean;
  bQueenSide: boolean;
}

export interface ChessMove {
  from: Position;
  to: Position;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  isCastle?: boolean;
  isEnPassant?: boolean;
}

export interface HistoryEntry {
  board: PieceType[][];
  turn: PlayerColor;
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  lastMove: ChessMove | null;
  enPassantTarget: Position | null;
  castlingRights: CastlingRights;
}

export interface GameState {
  board: PieceType[][];
  turn: PlayerColor;
  history: HistoryEntry[];
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  lastMove: ChessMove | null;
  enPassantTarget: Position | null;
  castlingRights: CastlingRights;
  moveHistory: ChessMove[];
  status: GameStatus;
  announcement: string;
}

export interface MoveLogItem {
  id: string;
  moveNumber: number;
  whiteMove: string;
  blackMove?: string;
}

export interface AIStats {
  depth: number;
  nodesEvaluated: number;
  nps: number;
  timeSpentMs: number;
  logs: string[];
}
