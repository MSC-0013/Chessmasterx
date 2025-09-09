import React from 'react';

interface PromotionModalProps {
  isVisible: boolean;
  color: 'w' | 'b';
  onSelect: (piece: string) => void;
}

export default function PromotionModal({
  isVisible,
  color,
  onSelect
}: PromotionModalProps) {
  
  if (!isVisible) return null;

  const pieces = [
    { type: 'q', symbol: color === 'w' ? '♕' : '♛', name: 'Queen' },
    { type: 'r', symbol: color === 'w' ? '♖' : '♜', name: 'Rook' },
    { type: 'b', symbol: color === 'w' ? '♗' : '♝', name: 'Bishop' },
    { type: 'n', symbol: color === 'w' ? '♘' : '♞', name: 'Knight' }
  ];

  return (
    <div className="modal-overlay">
      <div className="promotion-modal">
        <h3>Promote Pawn</h3>
        <p>Choose a piece for promotion:</p>
        
        <div className="promotion-options">
          {pieces.map(piece => (
            <button
              key={piece.type}
              className="promotion-btn"
              onClick={() => onSelect(piece.type)}
              title={piece.name}
            >
              <div className="piece-symbol">{piece.symbol}</div>
              <div className="piece-name">{piece.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}