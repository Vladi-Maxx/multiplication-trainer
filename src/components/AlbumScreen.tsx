import React, { useState, useEffect } from 'react';
import { getUnlockedDragons, getAllDragons, getDragonImageUrl } from '../services/dragons';
import { Dragon } from '../services/dragons';
// Импортираме CSS файла с магическите ефекти
import './MagicEffects.css';

interface AlbumScreenProps {
  onBack: () => void;
}

// Запазваме резервно изображение, ако няма отключени дракони
import dragonImg from '../../Pics/Dragon 1.png';
const lockedDragonImg = '/Pics/Mystical Card with Glowing Runes.png';
const titleImage = encodeURI('/Pics/ChatGPT Image May 2, 2025, 07_37_44 PM.png');

const AlbumScreen: React.FC<AlbumScreenProps> = ({ onBack }) => {
  // Състояние за всички дракони
  const [allDragons, setAllDragons] = useState<Dragon[]>([]);
  // Състояние за отключените дракони
  const [unlockedDragons, setUnlockedDragons] = useState<Dragon[]>([]);
  // Състояние за зареждане
  const [loading, setLoading] = useState(true);
  // Състояние за грешка при зареждане
  const [error, setError] = useState<string | null>(null);
  
  // Зареждаме всички дракони при монтиране на компонента
  useEffect(() => {
    const loadDragons = async () => {
      try {
        setLoading(true);
        const allDragonsData = await getAllDragons();
        const unlockedDragonsData = await getUnlockedDragons();
        
        // Сортираме в обратен ред (най-новите най-отгоре)
        const sortedUnlockedDragons = [...unlockedDragonsData].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setAllDragons(allDragonsData);
        setUnlockedDragons(sortedUnlockedDragons);
      } catch (err) {
        console.error('Грешка при зареждане на дракони:', err);
        setError('Грешка при зареждане на драконите.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDragons();
  }, []);
  
  // CSS класове за звезден фон и искрички с курсора
  const starsBgClass = "relative overflow-hidden";
  const cursorSparkleClass = "cursor-sparkle";
  
  // Референция към контейнера, върху който ще следим движението на мишката
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Добавяме CSS ефект на следене на курсора с искри
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Функция, която се изпълнява при малък процент от движенията 
    // за да не претоварваме системата
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Ограничаваме до максимум 10 обновления в секунда
      if (now - lastTime < 100) return;
      lastTime = now;
      
      // Създаваме един елемент вместо много
      const sparkle = document.createElement('div');
      sparkle.className = cursorSparkleClass;
      sparkle.style.left = `${e.clientX}px`;
      sparkle.style.top = `${e.clientY}px`;
      
      // Добавяме елемента към DOM
      container.appendChild(sparkle);
      
      // Премахваме елемента след анимацията
      setTimeout(() => {
        if (container.contains(sparkle)) {
          container.removeChild(sparkle);
        }
      }, 700);
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Функция за генериране на няколко видими звездички над всичко
  const generateVisibleStars = () => {
    // Създаваме повече видими звезди във видимата зона
    return Array.from({ length: 30 }).map((_, i) => {
      const size = Math.random() * 4 + 2;
      const hue = Math.random() * 60 + 200;
      const animType = Math.random() > 0.5 ? 'floating-star' : 'swimming-star';
      const reversedAnim = Math.random() > 0.5 ? 'reverse' : 'normal';
      const floatDistance = 20 + Math.floor(Math.random() * 60); // Колко далече да плува звездата
      
      return (
        <div 
          key={i}
          className={`fixed rounded-full pointer-events-none`}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: `hsl(${hue}, 100%, 70%)`,
            boxShadow: `0 0 ${size * 2}px ${size}px hsl(${hue}, 100%, 70%)`,
            zIndex: 100,
            animation: `${animType} ${8 + Math.random() * 12}s infinite ${reversedAnim}, pulse ${2 + Math.random() * 3}s infinite alternate`,
            animationDelay: `${Math.random() * 5}s`,
            transform: `translateY(0px) translateX(0px)`,
            position: 'fixed',
            '--float-distance': `${floatDistance}px` as any,
          }}
        />
      );
    });
  };

  return (
    <>
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 p-6 flex items-center justify-center overflow-hidden relative">

      <div className="max-w-6xl w-full rounded-3xl overflow-hidden z-10 relative backdrop-blur-lg border border-white/10">
        {/* Магически ореол зад албума */}
        <div className="absolute -inset-10 bg-gradient-radial from-blue-500/30 via-purple-500/10 to-transparent blur-2xl z-0"></div>

        {/* Заглавие и бутон Назад */}
        <div className="bg-gradient-to-r from-indigo-800/80 to-purple-800/80 px-4 py-2 relative backdrop-blur z-10 min-h-[100px] flex items-center">
          <img
            src={titleImage}
            alt="Магически дракони"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[80%] max-h-[96px] w-auto h-auto object-contain drop-shadow-[0_2px_24px_rgba(255,140,0,0.7)] pointer-events-none select-none"
            style={{zIndex: 1}}
          />
          <button
            onClick={onBack}
            className="aspect-square h-[72px] min-h-[48px] max-h-[96px] flex items-center justify-center rounded-full text-lg font-bold bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 border-2 border-white/40 shadow-2xl shadow-purple-700/60 hover:shadow-[0_0_32px_8px_rgba(255,140,0,0.7)] hover:scale-105 transition-all duration-200 ml-auto z-10 outline-none focus:ring-4 focus:ring-orange-300/50"
          >
            Назад
          </button>
        </div>

        {/* Индикатор за колекцията */}
        <div className="bg-indigo-950/50 backdrop-blur-md p-4 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-700/50 rounded-full border border-indigo-500/30">
            <span className="text-white font-bold">{unlockedDragons.length}</span>
            <span className="text-indigo-200">от</span>
            <span className="text-white font-bold">{allDragons.length}</span>
            <span className="text-indigo-200">дракони в колекцията</span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-400 border-solid"></div>
          </div>
        ) : error ? (
          <div className="text-red-300 text-center py-8 bg-indigo-900/60 backdrop-blur-md">{error}</div>
        ) : (
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 bg-indigo-900/60 backdrop-blur-md">
            {allDragons.map((dragon, index) => (
              <div 
                key={dragon.id} 
                className={`group ${dragon.unlocked ? (index % 3 === 0 ? 'dragon-float-slow' : index % 3 === 1 ? 'dragon-float' : 'dragon-float-fast') : ''}`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className={`
                  relative rounded-xl overflow-hidden transition-all duration-500
                  ${dragon.unlocked ? 'shadow-[0_0_15px_rgba(138,43,226,0.5)]' : 'opacity-60'}
                  transform perspective-1000 group-hover:rotate-y-6 group-hover:scale-105
                `}>
                  {/* Светещ ореол */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-70 blur rounded-xl -z-10 group-hover:animate-pulse transition-opacity"></div>
                  
                  {/* Изображение на дракона */}
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-indigo-800/40 to-purple-900/40 backdrop-blur-sm relative z-10 flex items-center justify-center p-3 border border-indigo-500/50 shadow-md rounded-xl transition-all duration-500 group-hover:shadow-indigo-500/40 group-hover:shadow-lg group-hover:border-indigo-500/80">
                    {dragon.unlocked ? (
                      <img
                        src={getDragonImageUrl(dragon) || dragonImg}
                        alt={dragon.name}
                        className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <img
                        src={lockedDragonImg}
                        alt="Заключен дракон"
                        className="w-full h-full object-contain rounded-lg opacity-60"
                      />
                    )}
                  </div>
                  
                  {/* Информация за дракона */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-indigo-900/60 to-transparent p-4 backdrop-blur-sm text-white">
                    <h3 className="font-bold text-lg">{dragon.name}</h3>
                    {dragon.unlocked ? (
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                        <p className="text-xs text-indigo-200">Отключен</p>
                      </div>
                    ) : (
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                        <p className="text-xs text-indigo-200">Заключен</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Подсказващ текст */}
        <div className="bg-indigo-950/50 backdrop-blur-md p-6 text-center text-indigo-200 italic">
          "Всеки дракон носи частица от магията на математиката, която си овладял..."
        </div>
      </div>
    </div>
    
    {/* Видими големи звезди над цялото съдържание */}
    {generateVisibleStars()}
    </>
  );
};

export default AlbumScreen;
