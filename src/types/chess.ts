export interface GameState {
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  gameOver: boolean;
  inCheck: boolean;
  winner: string | null;
  moveHistory: Array<{
    san: string;
    from: string;
    to: string;
    piece: string;
    captured?: string;
    promotion?: string;
  }>;
  capturedPieces: {
    white: string[];
    black: string[];
  };
}

export interface GameSettings {
  gameMode: 'ai' | 'local';
  aiDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Maximum';
  playerColor: 'white' | 'black';
  timeControl?: number;
  sound: boolean;
  highlightMoves: boolean;
  showCoordinates: boolean;
  highContrast: boolean;
}

export interface Square {
  file: string;
  rank: string;
  piece?: {
    type: string;
    color: 'w' | 'b';
  };
  isLight: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isPossibleMove: boolean;
  isLastMove: boolean;
}

export interface AIMove {
  from: string;
  to: string;
  promotion?: string;
  evaluation: number;
  depth: number;
  principalVariation?: string[];
}