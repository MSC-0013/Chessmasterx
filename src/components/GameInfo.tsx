import React from 'react';
import { Clock, RotateCcw, RotateCw, Lightbulb, Settings, Users, Bot } from 'lucide-react';
import { GameState, GameSettings } from '../types/chess';

interface GameInfoProps {
  gameState: GameState;
  settings: GameSettings;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onSettings: () => void;
  onNewGame: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isThinking: boolean;
  currentPlayer: string;
  aiEvaluation?: number;
}

export default function GameInfo({
  gameState,
  settings,
  onUndo,
  onRedo,
  onHint,
  onSettings,
  onNewGame,
  canUndo,
  canRedo,
  isThinking,
  currentPlayer,
  aiEvaluation
}: GameInfoProps) {
  
  const getPieceSymbol = (piece: string) => {
    const symbols = {
      'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
      'p': '♟︎', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
    };
    return symbols[piece as keyof typeof symbols] || piece;
  };

  const formatEvaluation = (evaluation: number) => {
    if (Math.abs(evaluation) > 15000) {
      return evaluation > 0 ? 'White wins' : 'Black wins';
    }
    return (evaluation / 100).toFixed(1);
  };

  return (
    <div className="game-info">
      {/* Game Status */}
      <div className="game-status">
        <div className="current-player">
          <div className={`player-indicator ${gameState.turn}`}>
            {gameState.turn === 'w' ? '●' : '○'}
          </div>
          <span className="player-name">
            {currentPlayer}
            {settings.gameMode === 'ai' && gameState.turn !== (settings.playerColor === 'white' ? 'w' : 'b') && (
              <Bot size={16} className="ml-1" />
            )}
          </span>
          {isThinking && (
            <div className="thinking-indicator">
              <div className="spinner" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
        
        {gameState.gameOver && (
          <div className="game-over">
            <span className="result">
              {gameState.winner ? `${gameState.winner} wins!` : 'Draw'}
            </span>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="control-btn"
          title="Undo move (U)"
        >
          <RotateCcw size={18} />
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="control-btn"
          title="Redo move (R)"
        >
          <RotateCw size={18} />
        </button>
        
        <button
          onClick={onHint}
          disabled={isThinking}
          className="control-btn"
          title="Get hint (H)"
        >
          <Lightbulb size={18} />
        </button>
        
        <button
          onClick={onSettings}
          className="control-btn"
          title="Settings"
        >
          <Settings size={18} />
        </button>
        
        <button
          onClick={onNewGame}
          className="control-btn primary"
          title="New game"
        >
          New Game
        </button>
      </div>

      {/* AI Evaluation */}
      {settings.gameMode === 'ai' && aiEvaluation !== undefined && (
        <div className="ai-evaluation">
          <h4>Position Evaluation</h4>
          <div className="eval-bar">
            <div 
              className="eval-fill"
              style={{
                width: `${Math.min(100, Math.max(0, (aiEvaluation + 500) / 10))}%`
              }}
            />
          </div>
          <span className="eval-text">
            {formatEvaluation(aiEvaluation)}
          </span>
        </div>
      )}

      {/* Captured Pieces */}
      <div className="captured-pieces">
        <div className="captured-section">
          <h4>White Captured</h4>
          <div className="pieces">
            {gameState.capturedPieces.white.map((piece, index) => (
              <span key={index} className="captured-piece">
                {getPieceSymbol(piece)}
              </span>
            ))}
          </div>
        </div>
        
        <div className="captured-section">
          <h4>Black Captured</h4>
          <div className="pieces">
            {gameState.capturedPieces.black.map((piece, index) => (
              <span key={index} className="captured-piece">
                {getPieceSymbol(piece)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Move History */}
      <div className="move-history">
        <h4>Move History</h4>
        <div className="moves-list">
          {gameState.moveHistory.map((move, index) => (
            <div key={index} className="move-item">
              <span className="move-number">
                {Math.floor(index / 2) + 1}.
                {index % 2 === 0 ? '' : '..'}
              </span>
              <span className="move-notation">{move.san}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}