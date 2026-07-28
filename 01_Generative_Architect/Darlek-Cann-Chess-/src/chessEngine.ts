import { PieceType, PlayerColor, Position, ChessMove, CastlingRights } from './types';

const PST: Record<string, number[][]> = {
  p: [[0,0,0,0,0,0,0,0],[5,5,5,5,5,5,5,5],[1,1,2,3,3,2,1,1],[0.5,0.5,1,2.5,2.5,1,0.5,0.5],[0,0,0,2,2,0,0,0],[0.5,-0.5,-1,0,0,-1,-0.5,0.5],[0.5,1,1,-2,-2,1,1,0.5],[0,0,0,0,0,0,0,0]],
  n: [[-5,-4,-3,-3,-3,-3,-4,-5],[-4,-2,0,0,0,0,-2,-4],[-3,0,1,1.5,1.5,1,0,-3],[-3,0.5,1.5,2,2,1.5,0.5,-3],[-3,0,1.5,2,2,1.5,0,-3],[-3,0.5,1,1.5,1.5,1,0.5,-3],[-4,-2,0,0.5,0.5,0,-2,-4],[-5,-4,-3,-3,-3,-3,-4,-5]],
  b: [[-2,-1,-1,-1,-1,-1,-1,-2],[-1,0,0,0,0,0,0,-1],[-1,0,0.5,1,1,0.5,0,-1],[-1,0.5,0.5,1,1,0.5,0.5,-1],[-1,0,1,1,1,1,0,-1],[-1,1,1,1,1,1,1,-1],[-1,0.5,0,0,0,0,0.5,-1],[-2,-1,-1,-1,-1,-1,-1,-2]],
  r: [[0,0,0,0,0,0,0,0],[0.5,1,1,1,1,1,1,0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[0,0,0,0.5,0.5,0,0,0]],
  q: [[-2,-1,-1,-0.5,-0.5,-1,-1,-2],[-1,0,0,0,0,0,0,-1],[-1,0,0.5,0.5,0.5,0.5,0,-1],[-0.5,0,0.5,0.5,0.5,0.5,0,-0.5],[0,0,0.5,0.5,0.5,0.5,0,-0.5],[-1,0.5,0.5,0.5,0.5,0.5,0,-1],[-1,0,0.5,0,0,0.5,0,-1],[-2,-1,-1,-0.5,-0.5,-1,-1,-2]],
  k: [[-3,-4,-4,-5,-5,-4,-4,-3],[-3,-4,-4,-5,-5,-4,-4,-3],[-3,-4,-4,-5,-5,-4,-4,-3],[-3,-4,-4,-5,-5,-4,-4,-3],[-2,-3,-3,-4,-4,-3,-3,-2],[-1,-2,-2,-2,-2,-2,-2,-1],[2,2,0,0,0,0,2,2],[2,3,1,0,0,1,3,2]]
};

const WEIGHTS: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

export const getPieceColor = (p: PieceType): PlayerColor | null => p === '.' ? null : (p === p.toUpperCase() ? 'W' : 'B');
export const inBounds = (r: number, c: number): boolean => r >= 0 && r < 8 && c >= 0 && c < 8;

export function getPseudoLegalMoves(r: number, c: number, board: PieceType[][], castlingRights?: CastlingRights, enPassantTarget?: Position | null): ChessMove[] {
  const piece = board[r][c];
  if (piece === '.') return [];
  const color = getPieceColor(piece)!;
  const moves: ChessMove[] = [];
  const pLower = piece.toLowerCase();
  const dir = color === 'W' ? -1 : 1;

  const add = (tr: number, tc: number, meta: Partial<ChessMove> = {}) => {
    if (!inBounds(tr, tc)) return;
    const target = board[tr][tc];
    if (target !== '.' && getPieceColor(target) === color) return;
    moves.push({ from: { r, c }, to: { r: tr, c: tc }, piece, captured: target !== '.' ? target : undefined, ...meta });
  };

  if (pLower === 'p') {
    if (inBounds(r + dir, c) && board[r + dir][c] === '.') {
      add(r + dir, c);
      if ((color === 'W' && r === 6 || color === 'B' && r === 1) && board[r + 2 * dir][c] === '.') add(r + 2 * dir, c);
    }
    [c - 1, c + 1].forEach(tc => {
      if (inBounds(r + dir, tc)) {
        const target = board[r + dir][tc];
        if (target !== '.' && getPieceColor(target) !== color) add(r + dir, tc);
        else if (enPassantTarget?.r === r + dir && enPassantTarget?.c === tc) add(r + dir, tc, { isEnPassant: true, captured: color === 'W' ? 'p' : 'P' });
      }
    });
  } else if (pLower === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
  } else if (pLower === 'k') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
    if (castlingRights) {
      if (color === 'W' && r === 7 && c === 4 && castlingRights.wKingSide && board[7][5] === '.' && board[7][6] === '.') add(7, 6, { isCastle: true });
      if (color === 'B' && r === 0 && c === 4 && castlingRights.bKingSide && board[0][5] === '.' && board[0][6] === '.') add(0, 6, { isCastle: true });
    }
  } else {
    const dirs = pLower === 'r' ? [[-1,0],[1,0],[0,-1],[0,1]] : pLower === 'b' ? [[-1,-1],[-1,1],[1,-1],[1,1]] : [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc;
      while (inBounds(tr, tc)) {
        if (board[tr][tc] === '.') { add(tr, tc); tr += dr; tc += dc; } 
        else { if (getPieceColor(board[tr][tc]) !== color) add(tr, tc); break; }
      }
    }
  }
  return moves;
}

export function isSquareAttacked(r: number, c: number, attackerColor: PlayerColor, board: PieceType[][]): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = board[row][col];
      if (p !== '.' && getPieceColor(p) === attackerColor) {
        const moves = getPseudoLegalMoves(row, col, board);
        if (moves.some(m => m.to.r === r && m.to.c === c)) return true;
      }
    }
  }
  return false;
}

export function evaluateBoard(board: PieceType[][]): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === '.') continue;
      const isWhite = p === p.toUpperCase();
      const type = p.toLowerCase();
      const val = (WEIGHTS[type] || 0) + (PST[type][isWhite ? r : 7 - r][c] * 10);
      score += isWhite ? val : -val;
    }
  }
  return score;
}
