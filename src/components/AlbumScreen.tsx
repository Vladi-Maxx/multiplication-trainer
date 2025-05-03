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
import { FaArrowLeft } from 'react-icons/fa6'; // Промяна на импорта към fa6
// Импорт на икона за стрелка

const AlbumScreen: React.FC<AlbumScreenProps> = ({ onBack }) => {
  // Състояние за всички дракони
  const [allDragons, setAllDragons] = useState<Dragon[]>([]);
  // Състояние за отключените дракони
  const [unlockedDragons, setUnlockedDragons] = useState<Dragon[]>([]);
  // Състояние за зареждане
  const [loading, setLoading] = useState(true);
  // Състояние за грешка при зареждане
  const [error, setError] = useState<string | null>(null);
  const [selectedDragonUrl, setSelectedDragonUrl] = useState<string | null>(null);
  
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

        {/* Заглавие и бутон за връщане */}
        <div className="relative flex items-center justify-between p-4 bg-gradient-to-b from-indigo-900/80 to-transparent">
          {/* Placeholder for alignment */}
          <div className="w-32 h-32"></div> {/* Нов размер */}
          
          {/* Заглавна картинка - центрирана */}
          <div className="flex-1 flex justify-center">
            <img 
              src={titleImage}
              alt="Магически дракони"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[80%] max-h-[96px] w-auto h-auto object-contain drop-shadow-[0_2px_24px_rgba(255,140,0,0.7)] pointer-events-none select-none"
              style={{zIndex: 1}}
            />
          </div>

          {/* Бутон за връщане */}
          <button
            onClick={onBack}
            className="w-32 h-32 hover:opacity-90 transition-all duration-300 cursor-pointer flex items-center justify-center p-0 bg-transparent border-none group hover:scale-105" // Премахнат drop-shadow от бутона, добавен group за hover на img
            style={{ justifySelf: 'flex-end' }}
            aria-label="Назад към играта"
          >
            <img 
              src="/Pics/BackButon.png" 
              alt="Назад"
              className="w-full h-full object-contain drop-shadow-[0_1px_12px_rgba(255,140,0,0.5)] group-hover:drop-shadow-[0_2px_24px_rgba(255,140,0,0.7)] transition-all duration-300" // Добавен drop-shadow и group-hover ефект
            />
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
                className={`group ${dragon.unlocked ? (index % 3 === 0 ? 'dragon-float-slow cursor-pointer' : index % 3 === 1 ? 'dragon-float cursor-pointer' : 'dragon-float-fast cursor-pointer') : ''}`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => {
                  if (dragon.unlocked) {
                    const url = getDragonImageUrl(dragon);
                    if (url) {
                      setSelectedDragonUrl(url);
                    }
                  }
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
    
    {/* Модален прозорец за уголемена картинка */}
    {selectedDragonUrl && (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer"
        onClick={() => setSelectedDragonUrl(null)} // Затваряне при клик на фона
      >
        <img 
          src={selectedDragonUrl}
          alt="Уголемен дракон"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-4 border-indigo-400/50 cursor-default"
          onClick={(e) => e.stopPropagation()} // Предотвратява затваряне при клик на самата картинка
        />
        {/* Бутон за затваряне (стрелка назад) */}
        <button 
          onClick={() => setSelectedDragonUrl(null)}
          className="absolute top-6 right-6 text-white text-3xl bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10 cursor-pointer"
          aria-label="Затвори уголемен изглед"
        >
          <FaArrowLeft />
        </button>
      </div>
    )}
    </>
  );
};

export default AlbumScreen;
