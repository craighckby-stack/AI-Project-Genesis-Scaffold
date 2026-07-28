export interface ChessState {
  fen: string;
  lastMove: string;
  playerColor: 'w' | 'b';
  mode: string;
  history: string[];
}

export interface DalekResponse {
  text: string;
  emotion: 'prophetic' | 'maniacal' | 'furious' | 'calculating' | 'victorious' | 'panicked';
  prophecyLevel: number;
  apiKeyProvided: boolean;
}





