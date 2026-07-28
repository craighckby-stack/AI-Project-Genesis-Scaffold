import { PieceType, PlayerColor, Position, ChessMove, CastlingRights } from './types';

const TABLES: Record<string, number[][]> = {
  p: [[0,0,0,0,0,0,0,0],[5,5,5,5,5,5,5,5],[1,1,2,3,3,2,1,1],[0.5,0.5,1,2.5,2.5,1,0.5,0.5],[0,0,0,2,2,0,0,0],[0.5,-0.5,-1,0,0,-1,-0.5,0.5],[0.5,1,1,-2,-2,1,1,0.5],[0,0,0,0,0,0,0,0]],
  n: [[-5,-4,-3,-3,-3,-3,-4,-5],[-4,-2,0,0,0,0,-2,-4],[-3,0,1,1.5,1.5,1,0,-3],[-3,0.5,1.5,2,2,1.5,0.5,-3],[-3,0,1.5,2,2,1.5,0,-3],[-3,0.5,1,1.5,1.5,1,0.5,-3],[-4,-2,0,0.5,0.5,0,-2,-4],[-5,-4,-3,-3,-3,-3,-4,-5]],
  b: [[-2,-1,-1,-1,-1,-1,-1,-2],[-1,0,0,0,0,0,0,-1],[-1,0,0.5,1,1,0.5,0,-1],[-1,0.5,0.5,1,1,0.5,0.5,-1],[-1,0,1,1,1,1,0,-1],[-1,1,1,1,1,1,1,-1],[-1,0.5,0,0,0,0,0.5,-1],[-2,-1,-1,-1,-1,-1,-1,-2]],
  r: [[0,0,0,0,0,0,0,0],[0.5,1,1,1,1,1,1,0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[-0.5,0,0,0,0,0,0,-0.5],[0,0,0,0.5,0.5,0,0,0]],
  q: [[-2,-1,-1,-0.5,-0.5,-1,-1,-2],[-1,0,0,0,0,0,0,-1],[-1,0,0.5,0.5,0.5,0.5,0,-1],[-0.5,0,0.5,0.5,0.5,0.5,0,-0.5],[0,0,0.5,0.5,0.5,0.5,0,-0.5],[-1,0.5,0.5,0.5,0.5,0.5,0,-1],[-1,0,0.5,0,0,0.5,0,-1],[-2,-1,-1,-0.5,-0.5,-1,-1,-2]],
  k: [[-3,-4,-4,-5,-5,-4,-4,-3],[-3,-4,-4,-5,-5,-4,-4,-3],[-3,-4,-4,-5,-5,-4,-4,-3],[-3,-4,-4,-5,-5,-4,-4,-3],[-2,-3,-3,-4,-4,-3,-3,-2],[-1,-2,-2,-2,-2,-2,-2,-1],[2,2,0,0,0,0,2,2],[2,3,1,0,0,1,3,2]]
};

const WEIGHTS: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

export const getPieceColor = (p: PieceType): PlayerColor | null => p === '.' ? null : (p === p.toUpperCase() ? 'W' : 'B');

export function evaluateBoard(board: PieceType[][]): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === '.') continue;
      const lower = p.toLowerCase();
      const color = getPieceColor(p);
      const val = WEIGHTS[lower] + (TABLES[lower][color === 'W' ? r : 7 - r][c] * 10);
      score += (color === 'W' ? val : -val);
    }
  }
  return score;
}

export function getPseudoLegalMoves(r: number, c: number, board: PieceType[][], castlingRights?: CastlingRights, ep?: Position | null): ChessMove[] {
  const piece = board[r][c];
  if (piece === '.') return [];
  const color = getPieceColor(piece)!;
  const moves: ChessMove[] = [];
  const inBounds = (tr: number, tc: number) => tr >= 0 && tr < 8 && tc >= 0 && tc < 8;
  
  const add = (tr: number, tc: number, meta: Partial<ChessMove> = {}) => 
    moves.push({ from: { r, c }, to: { r: tr, c: tc }, piece, captured: board[tr][tc] !== '.' ? board[tr][tc] : undefined, ...meta });

  const pLower = piece.toLowerCase();
  if (pLower === 'p') {
    const dir = color === 'W' ? -1 : 1;
    if (inBounds(r + dir, c) && board[r + dir][c] === '.') {
      add(r + dir, c);
      if ((color === 'W' && r === 6 || color === 'B' && r === 1) && board[r + 2 * dir][c] === '.') add(r + 2 * dir, c);
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r + dir, c + dc)) {
        const target = board[r + dir][c + dc];
        if (target !== '.' && getPieceColor(target) !== color) add(r + dir, c + dc);
        else if (ep?.r === r + dir && ep?.c === c + dc) add(r + dir, c + dc, { isEnPassant: true, captured: color === 'W' ? 'p' : 'P' });
      }
    }
  } else if (pLower === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      const tr = r + dr, tc = c + dc;
      if (inBounds(tr, tc) && (board[tr][tc] === '.' || getPieceColor(board[tr][tc]) !== color)) add(tr, tc);
    });
  } else if (pLower === 'k') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
      const tr = r + dr, tc = c + dc;
      if (inBounds(tr, tc) && (board[tr][tc] === '.' || getPieceColor(board[tr][tc]) !== color)) add(tr, tc);
    });
    if (castlingRights) {
      if (color === 'W' && r === 7 && c === 4) {
        if (castlingRights.wKingSide && board[7][5] === '.' && board[7][6] === '.' && board[7][7] === 'R') add(7, 6, { isCastle: true });
        if (castlingRights.wQueenSide && board[7][3] === '.' && board[7][2] === '.' && board[7][1] === '.' && board[7][0] === 'R') add(7, 2, { isCastle: true });
      } else if (color === 'B' && r === 0 && c === 4) {
        if (castlingRights.bKingSide && board[0][5] === '.' && board[0][6] === '.' && board[0][7] === 'r') add(0, 6, { isCastle: true });
        if (castlingRights.bQueenSide && board[0][3] === '.' && board[0][2] === '.' && board[0][1] === '.' && board[0][0] === 'r') add(0, 2, { isCastle: true });
      }
    }
  } else {
    const dirs = pLower === 'r' || pLower === 'q' ? [[-1,0],[1,0],[0,-1],[0,1]] : [];
    if (pLower === 'b' || pLower === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc;
      while (inBounds(tr, tc)) {
        if (board[tr][tc] === '.') add(tr, tc);
        else { if (getPieceColor(board[tr][tc]) !== color) add(tr, tc); break; }
        tr += dr; tc += dc;
      }
    }
  }
  return moves;
}

export function minimax(board: PieceType[][], depth: number, alpha: number, beta: number, isMax: boolean, cr: CastlingRights, ep: Position | null, nodes: { count: number }): { score: number, bestMove: ChessMove | null } {
  nodes.count++;
  if (depth === 0) return { score: evaluateBoard(board), bestMove: null };
  
  let bestMove: ChessMove | null = null;
  let val = isMax ? -Infinity : Infinity;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece !== '.' && getPieceColor(piece) === (isMax ? 'W' : 'B')) {
        for (const move of getPseudoLegalMoves(r, c, board, cr, ep)) {
          const captured = board[move.to.r][move.to.c];
          board[move.to.r][move.to.c] = piece;
          board[r][c] = '.';
          
          const res = minimax(board, depth - 1, alpha, beta, !isMax, cr, null, nodes);
          
          board[r][c] = piece;
          board[move.to.r][move.to.c] = captured;
          
          if (isMax ? res.score > val : res.score < val) { val = res.score; bestMove = move; }
          if (isMax) alpha = Math.max(alpha, val); else beta = Math.min(beta, val);
          if (beta <= alpha) return { score: val, bestMove };
        }
      }
    }
  }
  return { score: val, bestMove };
}

