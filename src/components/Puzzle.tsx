import React, { useState, useEffect } from 'react';

const ROWS = 10;
const COLS = 6;
const TOTAL = ROWS * COLS;

interface PuzzleProps {
  revealedCount: number; // Брой разкрити парчета (0..60)
}

export default function Puzzle({ revealedCount }: PuzzleProps) {
  // Винаги един и същ ред на парчетата, но разкриването е истински случайно
  const [revealed, setRevealed] = useState(() => []);
  useEffect(() => {
    setRevealed(prev => {
      let current = [...prev];
      if (revealedCount > prev.length) {
        // Откриваме (revealedCount - prev.length) нови случайни парчета
        const toReveal = revealedCount - prev.length;
        let all = Array.from({ length: TOTAL }, (_, i) => i).filter(i => !current.includes(i));
        for (let i = 0; i < toReveal && all.length > 0; i++) {
          const idx = Math.floor(Math.random() * all.length);
          current.push(all[idx]);
          all.splice(idx, 1);
        }
      } else if (revealedCount < prev.length) {
        // Скриваме (prev.length - revealedCount) случайни разкрити парчета
        let toHide = prev.length - revealedCount;
        let all = [...current];
        for (let i = 0; i < toHide && all.length > 0; i++) {
          const idx = Math.floor(Math.random() * all.length);
          const val = all[idx];
          current = current.filter(x => x !== val);
          all.splice(idx, 1);
        }
      }
      return current;
    });
  }, [revealedCount]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1024/1536', maxWidth: '100%', margin: '0 auto' }}>
      {/* Основно изображение */}
      <img
        src={'/dragon.webp'}
        alt="Puzzle"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          aspectRatio: '1024/1536',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />
      {/* Плочки */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        pointerEvents: 'none',
        zIndex: 2,
        boxShadow: 'inset 0 0 32px #0004',
      }}>
        {Array.from({ length: TOTAL }, (_, idx) => {
          const isRevealed = revealed.includes(idx);
          return (
            <div
              key={idx}
              style={{
                background: isRevealed ? 'rgba(255,255,255,0.04)' : '#1f2937',
                opacity: isRevealed ? 0 : 1,
                transform: isRevealed ? 'scale(1)' : 'scale(1.2)',
                transition: 'opacity 1.2s ease-in-out, transform 0.8s cubic-bezier(.4,0,.2,1)',
                boxSizing: 'border-box',
                willChange: 'opacity, transform',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
