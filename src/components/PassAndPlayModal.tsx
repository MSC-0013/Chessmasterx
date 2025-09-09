import React from 'react';
import { RotateCw } from 'lucide-react';

interface PassAndPlayModalProps {
  isVisible: boolean;
  currentPlayer: string;
  onContinue: () => void;
}

export default function PassAndPlayModal({
  isVisible,
  currentPlayer,
  onContinue
}: PassAndPlayModalProps) {
  
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="pass-and-play-modal">
        <div className="pass-icon">
          <RotateCw size={48} />
        </div>
        
        <h2>Pass Device</h2>
        
        <p className="pass-message">
          It's now <strong>{currentPlayer}</strong>'s turn.
        </p>
        
        <p className="instruction">
          Please hand the device to {currentPlayer} and tap continue when ready.
        </p>
        
        <button 
          onClick={onContinue}
          className="continue-btn"
          autoFocus
        >
          Continue as {currentPlayer}
        </button>
      </div>
    </div>
  );
}