import React, { useState, useEffect, useRef, useCallback } from 'react';
import dragonPic from '../../Pics/Dragon 1.png';

// Тип за частица
interface Particle {
  id: number;       // Уникален идентификатор
  x: number;        // X позиция
  y: number;        // Y позиция
  size: number;     // Размер на частицата
  color: string;    // Цвят
  velocity: {       // Скорост и посока
    x: number;
    y: number;
  };
  rotation: number; // Въртене
  opacity: number;  // Прозрачност
  life: number;     // Живот в милисекунди
  createdAt: number; // Кога е създадена
}

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
  
  // Състояние за частиците
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastParticleId = useRef(0); // За уникални ID-та на частиците
  const animationFrameId = useRef<number | null>(null); // За анимационния frame
  
  // Звуков ефект при разкриване
  const audioRef = useRef(null);
  const [prevRevealedCount, setPrevRevealedCount] = useState(0); // За да знаем кога има увеличение
  
  // Инициализиране на звуковия обект
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      const sound = new Audio('/sounds/reveal.mp3');
      sound.preload = 'auto';
      sound.volume = 0.1; // Сила на звука - намалена до 0.2
      audioRef.current = sound;
    }
  }, []);
  
  // Функция за възпроизвеждане на звука
  const playRevealSound = () => {
    const sound = audioRef.current;
    if (sound) {
      sound.currentTime = 0; // Връщаме в началото
      sound.play().catch(error => console.error("Грешка при възпроизвеждане на звука:", error));
    }
  };
  
  // Следим за промени в revealedCount и пускаме звука при увеличение
  // Функция за създаване на частици за плочка
  const createParticlesForTile = useCallback((tileIndex: number) => {
    const row = Math.floor(tileIndex / COLS);
    const col = tileIndex % COLS;
    const centerX = col * TILE_W + TILE_W / 2;
    const centerY = row * TILE_H + TILE_H / 2;
    
    const newParticles: Particle[] = [];
    const particleCount = 20 + Math.floor(Math.random() * 15); // 20-35 частици - повече за по-видим ефект
    
    console.log(`Създавам ${particleCount} частици за плочка #${tileIndex} на позиция (${centerX},${centerY})`);
    
    for (let i = 0; i < particleCount; i++) {
      // Случайна посока и скорост за частицата
      const angle = Math.random() * Math.PI * 2; // Случаен ъгъл в радиани (0-360°)
      const speed = 3 + Math.random() * 5; // Увеличена скорост (3-8)
      
      // Изчисляваме компонентите x и y на скоростта
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Увеличен размер
      const size = 6 + Math.random() * 12; // Много по-големи частици (6-18)
      
      // Случаен цвят от красива цветова палитра      // Светещи цветове с по-голям контраст
      // Използвам по-малък брой цветове за по-голяма яркост
      const colors = [
        '#ffff00', // ярко жълто / неон
        '#ff0000', // чисто червено
        '#ff00ff', // магента
        '#00ffff', // циан
        '#ffffff', // бяло
      ];
      
      // Вземаме случаен цвят
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // По-широко разпръскване на частиците
      const offsetX = (Math.random() - 0.5) * TILE_W * 0.8;
      const offsetY = (Math.random() - 0.5) * TILE_H * 0.8;
      
      newParticles.push({
        id: ++lastParticleId.current,
        x: centerX + offsetX,
        y: centerY + offsetY,
        size,
        color,
        velocity: { x: vx, y: vy },
        rotation: Math.random() * 360,
        opacity: 0.9 + Math.random() * 0.1, // По-непрозрачни
        life: 1500 + Math.random() * 1000, // 1500-2500ms живот - много по-дълъг
        createdAt: Date.now(),
      });
    }
    
    // Изчистваме старите частици и добавяме новите
    setParticles(prev => {
      // Премахваме всички стари частици, фокусираме се само върху новите
      // Това ще направи ефекта по-забележим
      return newParticles; // Само новите частици, игнорираме старите
    });
    
    // Логваме за дебъгване
    console.log(`Създадени ${newParticles.length} частици. Общ брой частици: ${newParticles.length}`);
  }, []);
  
  // Функция за анимиране на частиците
  const animateParticles = useCallback(() => {
    const now = Date.now();
    
    setParticles(prevParticles => 
      prevParticles
        // Филтрираме изтеклите частици
        .filter(p => now - p.createdAt < p.life)
        // Обновяваме позицията и прозрачността на останалите
        .map(p => {
          // Изчисляваме колко от живота е изминал (0-1)
          const lifeProgress = (now - p.createdAt) / p.life;
          // Намаляваме прозрачността с времето
          const newOpacity = p.opacity * (1 - lifeProgress);
          // Леко забавяне на скоростта с времето
          const slowdown = 1 - lifeProgress * 0.3;
          
          return {
            ...p,
            x: p.x + p.velocity.x * slowdown,
            y: p.y + p.velocity.y * slowdown,
            rotation: p.rotation + p.velocity.x * 2,
            opacity: newOpacity,
          };
        })
    );
    
    // Продължаваме анимацията, ако има още частици
    animationFrameId.current = requestAnimationFrame(animateParticles);
  }, []);
  
  // Стартираме и спираме анимацията на частиците
  useEffect(() => {
    if (particles.length > 0 && !animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(animateParticles);
    } else if (particles.length === 0 && animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [particles.length, animateParticles]);
  
  // Следим за промени в revealedCount и пускаме звука при увеличение
  useEffect(() => {
    if (revealedCount > prevRevealedCount) {
      playRevealSound();
    }
    setPrevRevealedCount(revealedCount);
  }, [revealedCount]);

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
        
        // Създаваме частици за новите разкрити плочки
        newTiles.forEach(tile => {
          createParticlesForTile(tile);
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
      Object.values(shimmerTimeouts.current).forEach(timeout => clearTimeout(timeout as NodeJS.Timeout));
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
        {/* Общ glow филтър за всички частици */}
        <defs>
          <filter id="particle-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Частици - много по-проста реализация */}
        {particles.map(particle => {
          // Изчисляваме абсолютните координати
          const type = particle.id % 3; // 0 = star, 1 = circle, 2 = square

          if (type === 1) { // Кръг
            return (
              <circle
                key={`particle-${particle.id}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.size}
                fill={particle.color}
                opacity={particle.opacity}
                filter="url(#particle-glow)"
              />
            );
          } else if (type === 2) { // Квадрат
            return (
              <rect
                key={`particle-${particle.id}`}
                x={particle.x - particle.size / 2}
                y={particle.y - particle.size / 2}
                width={particle.size}
                height={particle.size}
                fill={particle.color}
                opacity={particle.opacity}
                filter="url(#particle-glow)"
                transform={`rotate(${particle.rotation}, ${particle.x}, ${particle.y})`}
              />
            );
          } else { // звезда - използваме кръг за по-просто
            return (
              <circle
                key={`particle-${particle.id}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.size * 0.8}
                fill={particle.color}
                opacity={particle.opacity}
                filter="url(#particle-glow)"
              />
            );
          }
        })}
        
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
