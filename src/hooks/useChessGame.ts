import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { GameState, GameSettings, Square } from '../types/chess';

const INITIAL_SETTINGS: GameSettings = {
  gameMode: 'ai',
  aiDifficulty: 'Medium',
  playerColor: 'white',
  sound: true,
  highlightMoves: true,
  showCoordinates: true,
  highContrast: false
};

const INITIAL_GAME_STATE: GameState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn: '',
  turn: 'w',
  gameOver: false,
  inCheck: false,
  winner: null,
  moveHistory: [],
  capturedPieces: { white: [], black: [] }
};

export function useChessGame() {
  const [chess] = useState(() => new Chess());
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('chessSettings');
    return saved ? { ...INITIAL_SETTINGS, ...JSON.parse(saved) } : INITIAL_SETTINGS;
  });
  
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isThinking, setIsThinking] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<number | undefined>(undefined);
  const [hintMove, setHintMove] = useState<string | null>(null);
  
  const aiWorkerRef = useRef<Worker | null>(null);
  const aiRequestIdRef = useRef(0);

  // Initialize AI worker
  useEffect(() => {
    try {
      aiWorkerRef.current = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
        type: 'module'
      });
      
      aiWorkerRef.current.onmessage = (e) => {
        const { requestId, success, result, error } = e.data;
        
        if (success && result) {
          setAiEvaluation(result.evaluation);
          
          // If this is an AI move request, make the move
          if (requestId === aiRequestIdRef.current) {
            const move = chess.move(result.move);
            if (move) {
              updateGameState();
              setLastMove({ from: move.from, to: move.to });
            }
          }
          
          // If this is a hint request, show the hint
          if (requestId < 0) {
            setHintMove(result.move);
            setTimeout(() => setHintMove(null), 3000);
          }
        } else if (error) {
          console.error('AI Worker error:', error);
        }
        
        setIsThinking(false);
      };
      
      return () => {
        aiWorkerRef.current?.terminate();
      };
    } catch (error) {
      console.error('Failed to initialize AI worker:', error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('chessSettings', JSON.stringify(settings));
  }, [settings]);

  const updateGameState = useCallback(() => {
    const capturedPieces = { white: [], black: [] };
    const moves = chess.history({ verbose: true });
    
    for (const move of moves) {
      if (move.captured) {
        const color = move.color === 'w' ? 'black' : 'white';
        capturedPieces[color].push(move.captured);
      }
    }
    
    setGameState({
      fen: chess.fen(),
      pgn: chess.pgn(),
      turn: chess.turn(),
      gameOver: chess.isGameOver(),
      inCheck: chess.inCheck(),
      winner: chess.isCheckmate() ? (chess.turn() === 'w' ? 'Black' : 'White') : null,
      moveHistory: moves,
      capturedPieces
    });
  }, [chess]);

  const createSquares = useCallback((): Square[][] => {
    const squares: Square[][] = [];
    const board = chess.board();
    
    for (let rank = 8; rank >= 1; rank--) {
      const row: Square[] = [];
      for (let file = 0; file < 8; file++) {
        const fileChar = String.fromCharCode(97 + file); // a-h
        const square = board[8 - rank][file];
        
        row.push({
          file: fileChar,
          rank: rank.toString(),
          piece: square ? { type: square.type, color: square.color } : undefined,
          isLight: (file + rank) % 2 === 1,
          isSelected: false,
          isHighlighted: false,
          isPossibleMove: false,
          isLastMove: false
        });
      }
      squares.push(row);
    }
    
    return squares;
  }, [chess]);

  const makeAIMove = useCallback(() => {
    if (!aiWorkerRef.current || isThinking) return;
    
    setIsThinking(true);
    aiRequestIdRef.current = Date.now();
    
    aiWorkerRef.current.postMessage({
      fen: chess.fen(),
      difficulty: settings.aiDifficulty,
      requestId: aiRequestIdRef.current
    });
  }, [chess, settings.aiDifficulty, isThinking]);

  const handleSquareClick = useCallback((square: string) => {
    if (gameState.gameOver) return;
    
    // Clear hint when user interacts
    if (hintMove) setHintMove(null);
    
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }
    
    if (selectedSquare && possibleMoves.includes(square)) {
      handleMove(selectedSquare, square);
      return;
    }
    
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setPossibleMoves(moves.map(move => move.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [gameState.gameOver, selectedSquare, possibleMoves, hintMove, chess]);

  const handleMove = useCallback((from: string, to: string) => {
    const moves = chess.moves({ verbose: true });
    const move = moves.find(m => m.from === from && m.to === to);
    
    if (!move) return false;
    
    // Handle promotion
    if (move.promotion) {
      setPendingPromotion({ from, to });
      setShowPromotionModal(true);
      return true;
    }
    
    const madeMove = chess.move({ from, to });
    if (madeMove) {
      updateGameState();
      setLastMove({ from, to });
      setSelectedSquare(null);
      setPossibleMoves([]);
      
      // Add to history
      const newHistory = moveHistory.slice(0, historyIndex + 1);
      newHistory.push(chess.fen());
      setMoveHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Handle game mode specific logic
      if (settings.gameMode === 'local' && !chess.isGameOver()) {
        // Show pass modal for local 2-player
        setTimeout(() => setShowPassModal(true), 500);
      } else if (settings.gameMode === 'ai' && !chess.isGameOver()) {
        // Make AI move
        const isPlayerTurn = chess.turn() === (settings.playerColor === 'white' ? 'w' : 'b');
        if (!isPlayerTurn) {
          setTimeout(makeAIMove, 500);
        }
      }
      
      return true;
    }
    
    return false;
  }, [chess, settings, moveHistory, historyIndex, makeAIMove, updateGameState]);

  const handlePromotion = useCallback((piece: string) => {
    if (!pendingPromotion) return;
    
    const move = chess.move({
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: piece
    });
    
    if (move) {
      updateGameState();
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setPossibleMoves([]);
      
      // Add to history
      const newHistory = moveHistory.slice(0, historyIndex + 1);
      newHistory.push(chess.fen());
      setMoveHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Handle post-move logic
      if (settings.gameMode === 'local' && !chess.isGameOver()) {
        setTimeout(() => setShowPassModal(true), 500);
      } else if (settings.gameMode === 'ai' && !chess.isGameOver()) {
        const isPlayerTurn = chess.turn() === (settings.playerColor === 'white' ? 'w' : 'b');
        if (!isPlayerTurn) {
          setTimeout(makeAIMove, 500);
        }
      }
    }
    
    setShowPromotionModal(false);
    setPendingPromotion(null);
  }, [pendingPromotion, chess, settings, moveHistory, historyIndex, makeAIMove, updateGameState]);

  const newGame = useCallback(() => {
    chess.reset();
    updateGameState();
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([chess.fen()]);
    setHistoryIndex(0);
    setIsThinking(false);
    setShowPassModal(false);
    setAiEvaluation(undefined);
    setHintMove(null);
    
    // If AI plays white, make first move
    if (settings.gameMode === 'ai' && settings.playerColor === 'black') {
      setTimeout(makeAIMove, 1000);
    }
  }, [chess, settings, makeAIMove, updateGameState]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      chess.load(moveHistory[newIndex]);
      updateGameState();
      setHistoryIndex(newIndex);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setIsThinking(false);
    }
  }, [historyIndex, moveHistory, chess, updateGameState]);

  const redo = useCallback(() => {
    if (historyIndex < moveHistory.length - 1) {
      const newIndex = historyIndex + 1;
      chess.load(moveHistory[newIndex]);
      updateGameState();
      setHistoryIndex(newIndex);
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [historyIndex, moveHistory, chess, updateGameState]);

  const getHint = useCallback(() => {
    if (!aiWorkerRef.current || isThinking) return;
    
    setIsThinking(true);
    
    aiWorkerRef.current.postMessage({
      fen: chess.fen(),
      difficulty: settings.aiDifficulty,
      requestId: -1 // Negative ID for hints
    });
  }, [chess, settings.aiDifficulty, isThinking]);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const getCurrentPlayer = useCallback(() => {
    if (settings.gameMode === 'local') {
      return chess.turn() === 'w' ? 'White Player' : 'Black Player';
    } else {
      const isPlayerTurn = chess.turn() === (settings.playerColor === 'white' ? 'w' : 'b');
      return isPlayerTurn ? 'You' : 'AI';
    }
  }, [chess, settings]);

  // Initialize game on mount
  useEffect(() => {
    updateGameState();
    setMoveHistory([chess.fen()]);
    setHistoryIndex(0);
  }, [updateGameState, chess]);

  return {
    // State
    gameState,
    settings,
    selectedSquare,
    possibleMoves,
    lastMove,
    isThinking,
    showPassModal,
    showPromotionModal,
    pendingPromotion,
    aiEvaluation,
    hintMove,
    squares: createSquares(),
    
    // Actions
    handleSquareClick,
    handleMove,
    handlePromotion,
    newGame,
    undo,
    redo,
    getHint,
    updateSettings,
    getCurrentPlayer,
    
    // Modal controls
    setShowPassModal,
    
    // History
    canUndo: historyIndex > 0,
    canRedo: historyIndex < moveHistory.length - 1
  };
}