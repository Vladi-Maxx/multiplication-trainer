import React, { useState, useEffect, useRef } from 'react';
import dragonPic from '../../Pics/Dragon 1.png';

const IMG_W = 1024;
const IMG_H = 1536;
const ROWS = 10;
const COLS = 6;
const TILE_W = IMG_W / COLS;
const TILE_H = IMG_H / ROWS;
const TOTAL = ROWS * COLS;

interface PuzzleSVGProps {
  revealedCount: number;
}

export default function PuzzleSVG({ revealedCount }: PuzzleSVGProps) {
  // CSS-in-JS shake style
  if (typeof document !== 'undefined' && !document.getElementById('puzzle-shake-style')) {
    const style = document.createElement('style');
    style.id = 'puzzle-shake-style';
    style.innerHTML = `
      .shake {
        animation: shakeX 0.5s cubic-bezier(.36,.07,.19,.97) both;
      }
      @keyframes shakeX {
        10%, 90% { transform: translateX(-16px); }
        20%, 80% { transform: translateX(16px); }
        30%, 50%, 70% { transform: translateX(-12px); }
        40%, 60% { transform: translateX(12px); }
      }
    `;
    document.head.appendChild(style);
  }
  const [revealed, setRevealed] = useState<number[]>([]);
  // Държим кои парчета са били току-що разкрити за shimmer
  const [shimmerTiles, setShimmerTiles] = useState<number[]>([]);
  const shimmerTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  useEffect(() => {
    setRevealed(prev => {
      let current = [...prev];
      // Ново разкриване
      if (revealedCount > prev.length) {
        const toReveal = revealedCount - prev.length;
        let all = Array.from({ length: TOTAL }, (_, i) => i).filter(i => !current.includes(i));
        let newTiles: number[] = [];
        for (let i = 0; i < toReveal && all.length > 0; i++) {
          const idx = Math.floor(Math.random() * all.length);
          const tile = all[idx];
          current.push(tile);
          all.splice(idx, 1);
          newTiles.push(tile);
        }
        // Добави shimmer за новите
        setShimmerTiles(old => [...old, ...newTiles]);
        // Автоматично премахни shimmer-а след 1.2s
        newTiles.forEach(tile => {
          shimmerTimeouts.current[tile] = setTimeout(() => {
            setShimmerTiles(old => old.filter(t => t !== tile));
          }, 1200);
        });
      } else if (revealedCount < prev.length) {
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
    // Почисти таймаутите при ънмаунт
    return () => {
      Object.values(shimmerTimeouts.current).forEach(clearTimeout);
    };
  }, [revealedCount]);

  return (
    <div style={{ width: '100%', aspectRatio: `${IMG_W}/${IMG_H}` }}>
      <svg
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        width="100%"
        style={{ display: 'block', width: '100%', background: 'transparent', borderRadius: 16 }}
      >
        <defs>
          <linearGradient id="shimmer-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff0" />
            <stop offset="40%" stopColor="#fff6" />
            <stop offset="60%" stopColor="#fff" />
            <stop offset="100%" stopColor="#fff0" />
          </linearGradient>
        </defs>
        <image
          href={dragonPic}
          x={0}
          y={0}
          width={IMG_W}
          height={IMG_H}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        />
        {/* Overlay tiles */}
        {Array.from({ length: TOTAL }, (_, idx) => {
          const isRevealed = revealed.includes(idx);
          const showShimmer = shimmerTiles.includes(idx);
          const row = Math.floor(idx / COLS);
          const col = idx % COLS;
          const scale = isRevealed ? 1 : 1.2;
          const originX = col * TILE_W + TILE_W / 2;
          const originY = row * TILE_H + TILE_H / 2;
          return (
            <g 
              key={idx}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${originX}px ${originY}px`,
                transition: 'transform 0.8s cubic-bezier(.4,0,.2,1)',
              }}
            >
              <rect
                x={col * TILE_W}
                y={row * TILE_H}
                width={TILE_W}
                height={TILE_H}
                fill="#1f2937"
                opacity={isRevealed ? 0 : 1}
                style={{
                  transition: 'opacity 1.2s ease-in-out, filter 0.8s cubic-bezier(.4,0,.2,1)',
                  filter: isRevealed ? 'drop-shadow(0 0 16px #fff8)' : 'none',
                }}
              />
              {showShimmer && (
                <rect
                  x={col * TILE_W}
                  y={row * TILE_H}
                  width={TILE_W}
                  height={TILE_H}
                  fill="url(#shimmer-gradient)"
                  opacity={0.7}
                >
                  <animate
                    attributeName="x"
                    from={col * TILE_W - TILE_W}
                    to={col * TILE_W + TILE_W}
                    dur="1.2s"
                    repeatCount="1"
                    fill="freeze"
                  />
                </rect>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
