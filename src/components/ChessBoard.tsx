import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Square, GameSettings } from '../types/chess';

interface ChessBoardProps {
  squares: Square[][];
  selectedSquare: string | null;
  possibleMoves: string[];
  lastMove: { from: string; to: string } | null;
  onSquareClick: (square: string) => void;
  onPieceMove: (from: string, to: string) => void;
  settings: GameSettings;
  flipped: boolean;
  disabled: boolean;
}

interface DragState {
  isDragging: boolean;
  piece: string | null;
  from: string | null;
  dragElement: HTMLElement | null;
  offset: { x: number; y: number };
}

export default function ChessBoard({
  squares,
  selectedSquare,
  possibleMoves,
  lastMove,
  onSquareClick,
  onPieceMove,
  settings,
  flipped,
  disabled
}: ChessBoardProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    piece: null,
    from: null,
    dragElement: null,
    offset: { x: 0, y: 0 }
  });
  
  const boardRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);

  const getPieceSymbol = (piece: { type: string; color: 'w' | 'b' }) => {
    const symbols = {
      'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
      'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟︎'
    };
    return symbols[`${piece.color}${piece.type.toUpperCase()}` as keyof typeof symbols] || '';
  };

  const getSquareCoordinate = (file: string, rank: string) => {
    return `${file}${rank}`;
  };

  const isSquareHighlighted = (square: Square) => {
    const coord = getSquareCoordinate(square.file, square.rank);
    return (
      selectedSquare === coord ||
      possibleMoves.includes(coord) ||
      (lastMove && (lastMove.from === coord || lastMove.to === coord))
    );
  };

  const getSquareClass = (square: Square) => {
    const coord = getSquareCoordinate(square.file, square.rank);
    let classes = `square ${square.isLight ? 'light' : 'dark'}`;
    
    if (selectedSquare === coord) {
      classes += ' selected';
    }
    
    if (possibleMoves.includes(coord)) {
      classes += ' possible-move';
    }
    
    if (lastMove && (lastMove.from === coord || lastMove.to === coord)) {
      classes += ' last-move';
    }
    
    if (settings.highContrast) {
      classes += ' high-contrast';
    }
    
    return classes;
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (disabled || !square.piece) return;
    
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };
    
    setDragState({
      isDragging: true,
      piece: getPieceSymbol(square.piece),
      from: getSquareCoordinate(square.file, square.rank),
      dragElement: null,
      offset
    });

    // Create drag ghost
    if (dragGhostRef.current) {
      dragGhostRef.current.textContent = getPieceSymbol(square.piece);
      dragGhostRef.current.style.display = 'block';
      dragGhostRef.current.style.left = `${e.clientX - offset.x}px`;
      dragGhostRef.current.style.top = `${e.clientY - offset.y}px`;
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragGhostRef.current) return;
    
    dragGhostRef.current.style.left = `${e.clientX - dragState.offset.x}px`;
    dragGhostRef.current.style.top = `${e.clientY - dragState.offset.y}px`;
  }, [dragState.isDragging, dragState.offset]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.from) return;
    
    // Hide drag ghost
    if (dragGhostRef.current) {
      dragGhostRef.current.style.display = 'none';
    }
    
    // Find target square
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const squareElement = element?.closest('.square') as HTMLElement;
    
    if (squareElement) {
      const file = squareElement.dataset.file;
      const rank = squareElement.dataset.rank;
      
      if (file && rank) {
        const to = getSquareCoordinate(file, rank);
        if (to !== dragState.from) {
          onPieceMove(dragState.from, to);
        }
      }
    }
    
    setDragState({
      isDragging: false,
      piece: null,
      from: null,
      dragElement: null,
      offset: { x: 0, y: 0 }
    });
  }, [dragState, onPieceMove]);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent, square: Square) => {
    if (disabled || !square.piece) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offset = {
      x: touch.clientX - rect.left - rect.width / 2,
      y: touch.clientY - rect.top - rect.height / 2
    };
    
    setDragState({
      isDragging: true,
      piece: getPieceSymbol(square.piece),
      from: getSquareCoordinate(square.file, square.rank),
      dragElement: null,
      offset
    });

    if (dragGhostRef.current) {
      dragGhostRef.current.textContent = getPieceSymbol(square.piece);
      dragGhostRef.current.style.display = 'block';
      dragGhostRef.current.style.left = `${touch.clientX - offset.x}px`;
      dragGhostRef.current.style.top = `${touch.clientY - offset.y}px`;
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging || !dragGhostRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    dragGhostRef.current.style.left = `${touch.clientX - dragState.offset.x}px`;
    dragGhostRef.current.style.top = `${touch.clientY - dragState.offset.y}px`;
  }, [dragState.isDragging, dragState.offset]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging || !dragState.from) return;
    
    e.preventDefault();
    
    if (dragGhostRef.current) {
      dragGhostRef.current.style.display = 'none';
    }
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const squareElement = element?.closest('.square') as HTMLElement;
    
    if (squareElement) {
      const file = squareElement.dataset.file;
      const rank = squareElement.dataset.rank;
      
      if (file && rank) {
        const to = getSquareCoordinate(file, rank);
        if (to !== dragState.from) {
          onPieceMove(dragState.from, to);
        }
      }
    }
    
    setDragState({
      isDragging: false,
      piece: null,
      from: null,
      dragElement: null,
      offset: { x: 0, y: 0 }
    });
  }, [dragState, onPieceMove]);

  // Event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const renderSquare = (square: Square, rowIndex: number, colIndex: number) => {
    const coord = getSquareCoordinate(square.file, square.rank);
    const isDraggingThis = dragState.isDragging && dragState.from === coord;
    
    return (
      <div
        key={coord}
        className={getSquareClass(square)}
        data-file={square.file}
        data-rank={square.rank}
        onClick={() => !disabled && onSquareClick(coord)}
        onMouseDown={(e) => handleMouseDown(e, square)}
        onTouchStart={(e) => handleTouchStart(e, square)}
        style={{
          opacity: isDraggingThis ? 0.3 : 1
        }}
      >
        {square.piece && !isDraggingThis && (
          <div className="piece">
            {getPieceSymbol(square.piece)}
          </div>
        )}
        
        {possibleMoves.includes(coord) && (
          <div className="move-indicator" />
        )}
        
        {settings.showCoordinates && (
          <>
            {colIndex === 0 && (
              <div className="rank-label">
                {square.rank}
              </div>
            )}
            {rowIndex === (flipped ? 0 : 7) && (
              <div className="file-label">
                {square.file}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const displaySquares = flipped ? 
    [...squares].reverse().map(row => [...row].reverse()) : 
    squares;

  return (
    <div className="chess-board-container">
      <div 
        ref={boardRef}
        className={`chess-board ${settings.highContrast ? 'high-contrast' : ''} ${disabled ? 'disabled' : ''}`}
      >
        {displaySquares.map((row, rowIndex) => 
          row.map((square, colIndex) => 
            renderSquare(square, rowIndex, colIndex)
          )
        )}
      </div>
      
      {/* Drag ghost element */}
      <div 
        ref={dragGhostRef}
        className="drag-ghost"
        style={{ display: 'none' }}
      />
    </div>
  );
}