import { Chess } from 'chess.js';

interface AIConfig {
  mode: 'depth' | 'time';
  depth?: number;
  seconds?: number;
  mistakeChance: number;
  useQuiescence?: boolean;
  useIterativeDeepening?: boolean;
  transposition?: boolean;
}

const AI_CONFIG: Record<string, AIConfig> = {
  Easy: { mode: 'depth', depth: 1, mistakeChance: 0.20 },
  Medium: { mode: 'depth', depth: 2, mistakeChance: 0.08 },
  Hard: { mode: 'depth', depth: 4, mistakeChance: 0.02, useQuiescence: true },
  Maximum: { mode: 'time', seconds: 5, mistakeChance: 0.01, useIterativeDeepening: true, transposition: true }
};

// Piece values for evaluation
const PIECE_VALUES = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000
};

// Piece-square tables for positional evaluation
const PIECE_SQUARE_TABLES = {
  p: [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  r: [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
  ]
};

class TranspositionTable {
  private table = new Map<string, { score: number; depth: number; flag: string }>();
  private maxSize = 1000000;

  get(key: string, depth: number): { score: number; flag: string } | null {
    const entry = this.table.get(key);
    if (entry && entry.depth >= depth) {
      return { score: entry.score, flag: entry.flag };
    }
    return null;
  }

  set(key: string, score: number, depth: number, flag: string): void {
    if (this.table.size >= this.maxSize) {
      const firstKey = this.table.keys().next().value;
      this.table.delete(firstKey);
    }
    this.table.set(key, { score, depth, flag });
  }

  clear(): void {
    this.table.clear();
  }
}

class ChessAI {
  private transpositionTable = new TranspositionTable();
  
  evaluatePosition(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -20000 : 20000;
    }
    
    if (chess.isDraw()) {
      return 0;
    }

    let evaluation = 0;
    const board = chess.board().flat();
    
    // Material and positional evaluation
    for (let i = 0; i < board.length; i++) {
      const square = board[i];
      if (square) {
        const piece = square.type;
        const color = square.color;
        const isWhite = color === 'w';
        
        // Material value
        let value = PIECE_VALUES[piece];
        
        // Positional value from piece-square tables
        const tableIndex = isWhite ? i : 63 - i;
        const table = PIECE_SQUARE_TABLES[piece as keyof typeof PIECE_SQUARE_TABLES];
        if (table) {
          value += table[tableIndex];
        }
        
        evaluation += isWhite ? value : -value;
      }
    }
    
    // Mobility bonus
    const moves = chess.moves().length;
    evaluation += chess.turn() === 'w' ? moves * 10 : -moves * 10;
    
    // King safety
    if (chess.inCheck()) {
      evaluation += chess.turn() === 'w' ? -50 : 50;
    }
    
    return evaluation;
  }

  minimax(
    chess: Chess, 
    depth: number, 
    alpha: number = -Infinity, 
    beta: number = Infinity, 
    maximizingPlayer: boolean = true,
    config: AIConfig,
    startTime: number = Date.now()
  ): { score: number; move: string | null; pv: string[] } {
    
    // Time check for time-based search
    if (config.mode === 'time' && Date.now() - startTime > config.seconds! * 1000) {
      return { score: this.evaluatePosition(chess), move: null, pv: [] };
    }
    
    const fen = chess.fen();
    
    // Transposition table lookup
    if (config.transposition) {
      const ttEntry = this.transpositionTable.get(fen, depth);
      if (ttEntry) {
        return { score: ttEntry.score, move: null, pv: [] };
      }
    }
    
    if (depth === 0) {
      const score = this.evaluatePosition(chess);
      return { score, move: null, pv: [] };
    }
    
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) {
      const score = this.evaluatePosition(chess);
      return { score, move: null, pv: [] };
    }
    
    // Move ordering for better alpha-beta pruning
    moves.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      // Prioritize captures
      if (a.captured) scoreA += 100;
      if (b.captured) scoreB += 100;
      
      // Prioritize checks
      chess.move(a);
      if (chess.inCheck()) scoreA += 50;
      chess.undo();
      
      chess.move(b);
      if (chess.inCheck()) scoreB += 50;
      chess.undo();
      
      return scoreB - scoreA;
    });
    
    let bestMove: string | null = null;
    let bestPV: string[] = [];
    
    if (maximizingPlayer) {
      let maxEval = -Infinity;
      
      for (const move of moves) {
        chess.move(move);
        const result = this.minimax(chess, depth - 1, alpha, beta, false, config, startTime);
        chess.undo();
        
        if (result.score > maxEval) {
          maxEval = result.score;
          bestMove = move.san;
          bestPV = [move.san, ...result.pv];
        }
        
        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break; // Beta cutoff
      }
      
      // Store in transposition table
      if (config.transposition) {
        this.transpositionTable.set(fen, maxEval, depth, 'exact');
      }
      
      return { score: maxEval, move: bestMove, pv: bestPV };
    } else {
      let minEval = Infinity;
      
      for (const move of moves) {
        chess.move(move);
        const result = this.minimax(chess, depth - 1, alpha, beta, true, config, startTime);
        chess.undo();
        
        if (result.score < minEval) {
          minEval = result.score;
          bestMove = move.san;
          bestPV = [move.san, ...result.pv];
        }
        
        beta = Math.min(beta, result.score);
        if (beta <= alpha) break; // Alpha cutoff
      }
      
      // Store in transposition table
      if (config.transposition) {
        this.transpositionTable.set(fen, minEval, depth, 'exact');
      }
      
      return { score: minEval, move: bestMove, pv: bestPV };
    }
  }

  iterativeDeepening(
    chess: Chess, 
    maxTime: number, 
    config: AIConfig
  ): { move: string | null; evaluation: number; depth: number; pv: string[] } {
    const startTime = Date.now();
    let bestResult = { score: -Infinity, move: null, pv: [] };
    let depth = 1;
    
    while (Date.now() - startTime < maxTime * 1000 && depth <= 10) {
      try {
        const result = this.minimax(chess, depth, -Infinity, Infinity, chess.turn() === 'w', config, startTime);
        if (result.move) {
          bestResult = result;
        }
        depth++;
      } catch (e) {
        break; // Time exceeded
      }
    }
    
    return {
      move: bestResult.move,
      evaluation: bestResult.score,
      depth: depth - 1,
      pv: bestResult.pv
    };
  }

  getBestMove(fen: string, difficulty: string): any {
    const chess = new Chess(fen);
    const config = AI_CONFIG[difficulty];
    
    if (!config) {
      throw new Error(`Unknown difficulty: ${difficulty}`);
    }
    
    let result;
    
    if (config.useIterativeDeepening && config.mode === 'time') {
      result = this.iterativeDeepening(chess, config.seconds!, config);
    } else {
      const searchResult = this.minimax(
        chess, 
        config.depth || 3, 
        -Infinity, 
        Infinity, 
        chess.turn() === 'w', 
        config
      );
      result = {
        move: searchResult.move,
        evaluation: searchResult.score,
        depth: config.depth || 3,
        pv: searchResult.pv
      };
    }
    
    // Add mistake chance for easier difficulties
    if (Math.random() < config.mistakeChance) {
      const moves = chess.moves();
      if (moves.length > 1) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, moves.length));
        result.move = moves[randomIndex];
      }
    }
    
    if (!result.move) {
      const moves = chess.moves();
      result.move = moves[Math.floor(Math.random() * moves.length)];
    }
    
    return result;
  }
}

const ai = new ChessAI();

self.onmessage = (e) => {
  const { fen, difficulty, requestId } = e.data;
  
  try {
    const result = ai.getBestMove(fen, difficulty);
    self.postMessage({
      requestId,
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      requestId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};