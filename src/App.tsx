import React, { useState, useEffect, useRef } from 'react';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import GameModeSelector from './components/GameModeSelector';
import PromotionModal from './components/PromotionModal';
import { useChessGame } from './hooks/useChessGame';
import './styles/chess.css';

export default function App() {
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);

  const {
    gameState,
    settings,
    selectedSquare,
    possibleMoves,
    lastMove,
    isThinking,
    showPromotionModal,
    hintMove,
    squares,
    handleSquareClick,
    handleMove,
    handlePromotion,
    newGame,
    undo,
    redo,
    getHint,
    updateSettings,
    getCurrentPlayer,
    canUndo,
    canRedo
  } = useChessGame();

  const [whiteTime, setWhiteTime] = useState(300); // default 5 min
  const [blackTime, setBlackTime] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPlayer = getCurrentPlayer();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'u': e.preventDefault(); undo(); break;
        case 'r': e.preventDefault(); redo(); break;
        case 'h': e.preventDefault(); getHint(); break;
        case 'n': e.preventDefault(); setShowGameModeSelector(true); break;
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [undo, redo, getHint]);

  // Start new game
  const handleStartGame = () => {
    setShowGameModeSelector(false);
    newGame();
    const totalSeconds = settings.timeLimit * 60;
    setWhiteTime(totalSeconds);
    setBlackTime(totalSeconds);
  };

  const isFlipped = settings.gameMode === 'ai' && settings.playerColor === 'black';

  // Timer effect
  useEffect(() => {
    if (gameState.gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (currentPlayer === 'w') setWhiteTime(prev => Math.max(prev - 1, 0));
      else setBlackTime(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPlayer, gameState.gameOver]);

  // Move wrapper to switch timer
  const onPieceMoveHandler = (from: string, to: string) => {
    handleMove(from, to);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`app ${settings.highContrast ? 'high-contrast' : ''}`}>
      <div className="game-container">
        <div className="board-section">
          <div className="timers">
            <div className={`timer ${currentPlayer === 'w' ? 'active' : ''}`}>
              ♔ White: {formatTime(whiteTime)}
            </div>
            <div className={`timer ${currentPlayer === 'b' ? 'active' : ''}`}>
              ♚ Black: {formatTime(blackTime)}
            </div>
          </div>

          <ChessBoard
            squares={squares}
            selectedSquare={selectedSquare}
            possibleMoves={settings.highlightMoves ? possibleMoves : []}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onPieceMove={onPieceMoveHandler}
            settings={settings}
            flipped={isFlipped}
            disabled={isThinking || gameState.gameOver}
          />

          {hintMove && (
            <div className="hint-overlay">
              <div className="hint-message">💡 Hint: Try {hintMove}</div>
            </div>
          )}
        </div>

        <div className="info-section">
          <GameInfo
            gameState={gameState}
            settings={settings}
            onUndo={undo}
            onRedo={redo}
            onHint={getHint}
            onSettings={() => setShowGameModeSelector(true)}
            onNewGame={() => setShowGameModeSelector(true)}
            canUndo={canUndo}
            canRedo={canRedo}
            isThinking={isThinking}
            currentPlayer={currentPlayer}
          />
        </div>
      </div>

      <GameModeSelector
        settings={settings}
        onSettingsChange={updateSettings}
        onStartGame={handleStartGame}
        isVisible={showGameModeSelector}
        onClose={() => setShowGameModeSelector(false)}
      />

      <PromotionModal
        isVisible={showPromotionModal}
        color={gameState.turn === 'w' ? 'b' : 'w'}
        onSelect={handlePromotion}
      />
    </div>
  );
}
