import React, { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import GameModeSelector from './components/GameModeSelector';
import PassAndPlayModal from './components/PassAndPlayModal';
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
    showPassModal,
    showPromotionModal,
    pendingPromotion,
    aiEvaluation,
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
    setShowPassModal,
    canUndo,
    canRedo
  } = useChessGame();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key.toLowerCase()) {
        case 'u':
          e.preventDefault();
          undo();
          break;
        case 'r':
          e.preventDefault();
          redo();
          break;
        case 'h':
          e.preventDefault();
          getHint();
          break;
        case 'n':
          e.preventDefault();
          setShowGameModeSelector(true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [undo, redo, getHint]);

  const handleStartGame = () => {
    setShowGameModeSelector(false);
    newGame();
  };

  const isFlipped = settings.gameMode === 'ai' && settings.playerColor === 'black';

  return (
    <div className={`app ${settings.highContrast ? 'high-contrast' : ''}`}>
      <div className="game-container">
        <div className="board-section">
          <ChessBoard
            squares={squares}
            selectedSquare={selectedSquare}
            possibleMoves={settings.highlightMoves ? possibleMoves : []}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onPieceMove={handleMove}
            settings={settings}
            flipped={isFlipped}
            disabled={isThinking || gameState.gameOver}
          />
          
          {hintMove && (
            <div className="hint-overlay">
              <div className="hint-message">
                💡 Hint: Try {hintMove}
              </div>
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
            currentPlayer={getCurrentPlayer()}
            aiEvaluation={aiEvaluation}
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
      
      <PassAndPlayModal
        isVisible={showPassModal}
        currentPlayer={getCurrentPlayer()}
        onContinue={() => setShowPassModal(false)}
      />
      
      <PromotionModal
        isVisible={showPromotionModal}
        color={gameState.turn === 'w' ? 'b' : 'w'}
        onSelect={handlePromotion}
      />
    </div>
  );
}