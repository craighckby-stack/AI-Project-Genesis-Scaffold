export type PieceColor = 'W' | 'B';

export type PieceKind = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export type PieceType = `${PieceColor}${Capitalize<PieceKind>}` | '.';

export type PlayerColor = PieceColor;

export type GameStatus = 
  | { type: 'active' }
  | { type: 'checkmate'; winner: PlayerColor }
  | { type: 'stalemate' }
  | { type: 'draw' };

export type PlayerController = 'human' | 'ai';

export interface Position {
  readonly r: number;
  readonly c: number;
}

export interface CastlingRights {
  readonly wKingSide: boolean;
  readonly wQueenSide: boolean;
  readonly bKingSide: boolean;
  readonly bQueenSide: boolean;
}

export interface ChessMove {
  readonly from: Position;
  readonly to: Position;
  readonly piece: PieceType;
  readonly captured?: PieceType;
  readonly promotion?: PieceKind;
  readonly isCastle?: boolean;
  readonly isEnPassant?: boolean;
}

export interface GameSnapshot {
  readonly board: readonly (readonly PieceType[])[];
  readonly turn: PlayerColor;
  readonly capturedWhite: readonly PieceType[];
  readonly capturedBlack: readonly PieceType[];
  readonly lastMove: ChessMove | null;
  readonly enPassantTarget: Position | null;
  readonly castlingRights: CastlingRights;
}

export interface GameState extends GameSnapshot {
  readonly history: readonly GameSnapshot[];
  readonly moveHistory: readonly ChessMove[];
  readonly status: GameStatus;
  readonly announcement: string;
}

export interface MoveLogItem {
  readonly id: string;
  readonly moveNumber: number;
  readonly whiteMove: string;
  readonly blackMove?: string;
}

export interface AIStats {
  readonly depth: number;
  readonly nodesEvaluated: number;
  readonly nps: number;
  readonly timeSpentMs: number;
  readonly logs: readonly string[];
}
