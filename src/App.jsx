import React, { useState, useEffect } from 'react';
import './App.css';
import { useGameLogic } from './hooks/useGameLogic';
import Grid from './components/Grid';
import Sidebar from './components/Sidebar';
import Tile from './components/Tile';

function App() {
  const {
    grid, queue, keepVal, score, level, trashUses, bestScore, gameOver,
    time, isPaused, validHintMoves, showHints,
    handleDropGrid, handleKeep, handleTrash, restartGame,
    togglePause, handleUndo, toggleHint, calculateHints
  } = useGameLogic();

  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'z') {
        handleUndo();
      } else if (e.key.toLowerCase() === 'r') {
        restartGame();
      } else if (e.key.toLowerCase() === 'g') {
        toggleHint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, restartGame, toggleHint]);

  const onDragStart = (e, value, source) => {
    e.preventDefault();
    setDragState({
      value,
      x: e.clientX,
      y: e.clientY,
      source
    });
    if (showHints) calculateHints(value);
  };

  const handlePointerMove = (e) => {
    if (dragState) {
      setDragState({ ...dragState, x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;

    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    let handled = false;

    const slot = elements.find(el => el.classList.contains('grid-slot'));
    if (slot) {
      const r = parseInt(slot.dataset.row);
      const c = parseInt(slot.dataset.col);

      if (handleDropGrid(r, c, dragState.value, dragState.source === 'keep')) {
        handled = true;
      }
    }

    const keepSlot = elements.find(el => el.id === 'slot-keep' || el.closest('#slot-keep'));
    if (!handled && keepSlot) {
      handleKeep(dragState.value, dragState.source === 'keep');
      handled = true;
    }

    const trashSlot = elements.find(el => el.id === 'slot-trash' || el.closest('#slot-trash'));
    if (!handled && trashSlot) {
      handleTrash(dragState.value, dragState.source === 'keep');
      handled = true;
    }

    setDragState(null);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      className="game-container"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={(e) => { if (dragState) handlePointerMove(e.touches[0]); }}
      onTouchEnd={(e) => { if (dragState) handlePointerUp(e.changedTouches[0]); }}
    >
      <div className="icon-btn-top btn-pause" onClick={togglePause}>
        {isPaused ? '▶' : '||'}
      </div>
      <div className={`icon-btn-top btn-help ${showHints ? 'active' : ''}`} onClick={toggleHint}>?</div>

      <div className="icon-btn-bottom btn-fullscreen" onClick={toggleFullscreen}>⛶</div>

      <div className="header-top">
        <h1 className="title">JUST DIVIDE</h1>
        <div className="timer">⏳ {formatTime(time)}</div>
        <div className="subtitle">DIVIDE WITH THE NUMBERS TO SOLVE THE ROWS AND COLUMNS.</div>
      </div>

      <div className="cat-header-wrapper">
        <div className="badge badge-left">LEVEL {level}</div>
        <img src="/assets/Cat.png" className="cat-img" alt="Cat" />
        <div className="badge badge-right">SCORE {score}</div>
      </div>

      <div className="grid-wrapper">
        <Grid grid={grid} hintMoves={validHintMoves} />
      </div>

      <Sidebar
        queue={queue}
        keepVal={keepVal}
        trashUses={trashUses}
        onDragStart={onDragStart}
        score={score}
        level={level}
      />

      {dragState && (
        <div className="drag-ghost" style={{ left: dragState.x, top: dragState.y }}>
          <Tile value={dragState.value} size={140} />
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', color: 'white'
        }}>
          <h1 style={{ fontSize: '100px', margin: 0, color: '#ff4444' }}>GAME OVER</h1>
          <h2 style={{ fontSize: '60px' }}>Final Score: {score}</h2>
          <button
            onClick={restartGame}
            style={{
              fontSize: '40px', padding: '20px 40px', borderRadius: '20px',
              border: 'none', backgroundColor: '#ffcc80', color: 'white',
              fontFamily: 'Fredoka One', cursor: 'pointer', marginTop: '40px'
            }}
          >
            Click to Restart
          </button>
        </div>
      )}

      {isPaused && !gameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white'
        }}>
          <h1 style={{ fontSize: '80px', textShadow: '2px 2px 4px black' }}>PAUSED</h1>
        </div>
      )}

    </div>
  );
}

export default App;
