import React from 'react';
import { Bot, Users, Palette, Volume2, VolumeX, Grid3X3, Eye } from 'lucide-react';
import { GameSettings } from '../types/chess';

interface GameModeSelectorProps {
  settings: GameSettings;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function GameModeSelector({
  settings,
  onSettingsChange,
  onStartGame,
  isVisible,
  onClose
}: GameModeSelectorProps) {
  
  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="game-mode-selector" onClick={e => e.stopPropagation()}>
        <h2>New Game</h2>
        
        {/* Game Mode Selection */}
        <div className="setting-section">
          <h3>Game Mode</h3>
          <div className="mode-options">
            <button
              className={`mode-btn ${settings.gameMode === 'ai' ? 'active' : ''}`}
              onClick={() => onSettingsChange({ gameMode: 'ai' })}
            >
              <Bot size={24} />
              <span>vs AI</span>
            </button>
            
            <button
              className={`mode-btn ${settings.gameMode === 'local' ? 'active' : ''}`}
              onClick={() => onSettingsChange({ gameMode: 'local' })}
            >
              <Users size={24} />
              <span>Local 2-Player</span>
            </button>
          </div>
        </div>

        {/* AI Settings */}
        {settings.gameMode === 'ai' && (
          <>
            <div className="setting-section">
              <h3>Your Color</h3>
              <div className="color-options">
                <button
                  className={`color-btn ${settings.playerColor === 'white' ? 'active' : ''}`}
                  onClick={() => onSettingsChange({ playerColor: 'white' })}
                >
                  ♔ White
                </button>
                
                <button
                  className={`color-btn ${settings.playerColor === 'black' ? 'active' : ''}`}
                  onClick={() => onSettingsChange({ playerColor: 'black' })}
                >
                  ♚ Black
                </button>
              </div>
            </div>
            
            <div className="setting-section">
              <h3>AI Difficulty</h3>
              <div className="difficulty-options">
                {['Easy', 'Medium', 'Hard', 'Maximum'].map(level => (
                  <button
                    key={level}
                    className={`difficulty-btn ${settings.aiDifficulty === level ? 'active' : ''}`}
                    onClick={() => onSettingsChange({ aiDifficulty: level as any })}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Display Settings */}
        <div className="setting-section">
          <h3>Display Options</h3>
          <div className="toggle-options">
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => onSettingsChange({ sound: e.target.checked })}
              />
              {settings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span>Sound Effects</span>
            </label>
            
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.showCoordinates}
                onChange={(e) => onSettingsChange({ showCoordinates: e.target.checked })}
              />
              <Grid3X3 size={20} />
              <span>Show Coordinates</span>
            </label>
            
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.highlightMoves}
                onChange={(e) => onSettingsChange({ highlightMoves: e.target.checked })}
              />
              <Eye size={20} />
              <span>Highlight Moves</span>
            </label>
            
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onSettingsChange({ highContrast: e.target.checked })}
              />
              <Palette size={20} />
              <span>High Contrast</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button onClick={onStartGame} className="start-btn">
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}