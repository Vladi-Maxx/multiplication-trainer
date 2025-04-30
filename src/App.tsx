import React, { useState, useEffect } from 'react'
import FlashCard from './components/FlashCard.tsx'
import { Fact } from './services/types'
import InputAndKeypad from './components/InputAndKeypad'
import Summary from './components/Summary.tsx'
import { randomFact } from './utils/facts.ts'
import { loadFacts, saveFacts, initializeSupabaseFactsData, checkSupabaseConnection, startTraining, addFactToCurrentTraining, finishTraining } from './services/storage'
import { initializeSession } from './services/supabase'
// Импортираме функциите за работа с дракони
import { getAllDragons, getLockedDragons, getUnlockedDragons, selectDragonForGame, unlockDragon, getDragonImageUrl } from './services/dragons'

const TARGET_SCORE = 300 // можеш да смениш по желание
const POINT_CORRECT = 10
const POINT_WRONG = -5

import PuzzleSVG from './components/PuzzleSVG';
import Dashboard from './components/Dashboard';
import HomeScreen from './components/HomeScreen';
import AlbumScreen from './components/AlbumScreen';
import Album from './components/Album';

type Screen = 'home' | 'game' | 'dashboard' | 'album';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [score, setScore] = useState(0)
  const [fact, setFact] = useState<Fact>(() => randomFact())
  const prevFactRef = React.useRef<Fact | null>(null);
  const [isFinished, setFinished] = useState(false)
  const [paused, setPaused] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(null)
  const [puzzleRevealedCount, setPuzzleRevealedCount] = useState(0);
  const progressRef = React.useRef<HTMLDivElement>(null);
  // Добавяме ново състояние за текущо избраното драконче
  const [currentDragon, setCurrentDragon] = useState<any>(null);
  // Състояние за зареждане на драконите
  const [dragonsLoading, setDragonsLoading] = useState(false);
  // URL към изображението на дракона
  const [dragonImageUrl, setDragonImageUrl] = useState<string>('');
  const [progressWidth, setProgressWidth] = React.useState(0);
  React.useEffect(() => {
    if (progressRef.current) {
      setProgressWidth(progressRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (progressRef.current) setProgressWidth(progressRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Инициализираме Supabase при стартиране на приложението
    const initializeApp = async () => {
      startTraining(); // стартираме тренировка при първоначално зареждане
      try {
        // Първо инициализираме сесията - влизаме с фиксирания потребител
        const isAuthenticated = await initializeSession();
        if (!isAuthenticated) {
          console.warn('Не може да се инициализира потребителска сесия, продължаваме в офлайн режим');
        }
        // Проверяваме дали можем да се свържем със Supabase
        const isConnected = await checkSupabaseConnection();
        if (isConnected) {
          // Инициализираме фактите в базата (ако вече съществуват, няма да се променят)
          await initializeSupabaseFactsData();
          
          // Зареждаме драконите и избираме текущ дракон
          await loadDragonsAndSelectCurrent();
        } else {
          console.log('Няма връзка със Supabase, работим само с localStorage');
        }
      } catch (error) {
        console.error('Грешка при инициализиране на приложението:', error);
      }
      // Зареждаме фактите от localStorage както преди
      loadFacts();
    };
    initializeApp();
    
    // Функция за зареждане на драконите и избор на текущ дракон
    async function loadDragonsAndSelectCurrent() {
      try {
        setDragonsLoading(true);
        // Избираме дракон за играта (първо неотключен или случаен от отключените)
        const dragon = await selectDragonForGame();
        if (dragon) {
          setCurrentDragon(dragon);
          // Генерираме URL към изображението
          const imageUrl = getDragonImageUrl(dragon);
          setDragonImageUrl(imageUrl);
          console.log('Избран дракон за играта:', dragon.name);
        } else {
          console.warn('Няма намерени дракони в базата данни');
          // Използваме локално изображение като резервен вариант
          setDragonImageUrl('/Pics/Dragon 1.png');
        }
      } catch (error) {
        console.error('Грешка при зареждане на дракони:', error);
        // Използваме локално изображение като резервен вариант
        setDragonImageUrl('/Pics/Dragon 1.png');
      } finally {
        setDragonsLoading(false);
      }
    };
  }, [])

  const handleSubmit = (ok, duration, timedOut) => {
    setLastCorrect(ok);
    if (timedOut) {
      setPaused(true);
      return;
    }
    // Добави отговора към текущата тренировка само ако timedOut е false
    // Изчисляваме текущата трудност на факта
    const allFactsLocal = loadFacts();
    const existingFact = allFactsLocal.find(f2 => f2.i === fact.i && f2.j === fact.j);
    const currentDifficulty = existingFact?.difficultyRating ?? 5.0;
    addFactToCurrentTraining({
      fact: {
        i: fact.i,
        j: fact.j,
        correctCount: existingFact?.correctCount || 0,
        wrongCount: existingFact?.wrongCount || 0,
        streak: existingFact?.streak || 0,
        avgTime: existingFact?.avgTime || 0,
        attempts: existingFact?.attempts || 0,
        box: existingFact?.box || 1,
        lastPracticed: new Date().toISOString(),
        nextPractice: new Date().toISOString(),
        difficultyRating: currentDifficulty
      },
      isCorrect: ok,
      responseTime: duration
    });

    const newScore = score + (ok ? POINT_CORRECT : POINT_WRONG)

    if (ok) {
      if (score < TARGET_SCORE && newScore >= TARGET_SCORE) {
        // Играчът е достигнал целта точно сега
        setScore(newScore)
        setFinished(true)
        finishTraining();
        
        // Отключваме текущия дракон, ако има такъв и не е отключен
        if (currentDragon && !currentDragon.unlocked) {
          unlockDragon(currentDragon.id)
            .then(success => {
              if (success) {
                console.log(`Дракон ${currentDragon.name} е отключен успешно!`);
              } else {
                console.error(`Неуспешно отключване на дракон ${currentDragon.name}`);
              }
            })
            .catch(error => {
              console.error('Грешка при отключване на дракон:', error);
            });
        }
        
        return
      }
      // При правилен отговор разкриваме 2 парченца от пъзела (максимум 60)
      setPuzzleRevealedCount(prev => Math.min(prev + 2, 60));
    } else {
      // При грешен отговор скриваме 1 парченце от пъзела (минимум 0)
      setPuzzleRevealedCount(prev => Math.max(prev - 1, 0));
    }

    setScore(newScore)
    // Запазваме текущия факт като предишен, за да го изключим от следващото теглене
    prevFactRef.current = fact;
    // Избираме нов факт, различен от предишния
    const newFact = randomFact(prevFactRef.current);
    setFact(newFact);
  }

  const restart = async () => {
    setScore(0)
    setFact(randomFact())
    prevFactRef.current = null
    setPuzzleRevealedCount(0)
    setFinished(false)
    setScreen('home'); // При рестарт се връщаме на началния екран
    startTraining(); // При рестарт започни нова тренировка
    
    // Избираме нов дракон при рестарт
    try {
      const dragon = await selectDragonForGame();
      if (dragon) {
        setCurrentDragon(dragon);
        const imageUrl = getDragonImageUrl(dragon);
        setDragonImageUrl(imageUrl);
        console.log('Избран нов дракон за играта при рестарт:', dragon.name);
      }
    } catch (error) {
      console.error('Грешка при избор на нов дракон при рестарт:', error);
    }
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        onPlay={async () => {
          setScreen('game');
          setFinished(false);
          setScore(0);
          setPuzzleRevealedCount(0);
          setLastCorrect(null);
          prevFactRef.current = null;
          setFact(randomFact());
          startTraining();
          
          // Избираме нов дракон при започване на нова игра
          try {
            const dragon = await selectDragonForGame();
            if (dragon) {
              setCurrentDragon(dragon);
              const imageUrl = getDragonImageUrl(dragon);
              setDragonImageUrl(imageUrl);
              console.log('Избран нов дракон за играта:', dragon.name);
            }
          } catch (error) {
            console.error('Грешка при избор на нов дракон:', error);
          }
          
          setTimeout(() => {
            if (progressRef.current) setProgressWidth(progressRef.current.offsetWidth);
          }, 0);
        }}
        onAchievements={() => setScreen('dashboard')}
        onAlbum={() => setScreen('album')}
      />
    );
  }
  if (screen === 'dashboard') {
    return <Dashboard onClose={() => setScreen('home')} />
  }
  if (screen === 'album') {
    return <AlbumScreen onBack={() => setScreen('home')} />
  }
  
  if (paused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-2xl">Времето изтече!</div>
        <div className="flex gap-4">
          <button onClick={() => { setPaused(false); setFact(randomFact(prevFactRef.current)); prevFactRef.current = fact; }} className="bg-blue-500 text-white px-4 py-2 rounded">
            Продължи
          </button>
          <button onClick={() => { setPaused(false); setFinished(true); finishTraining(); }} className="bg-red-500 text-white px-4 py-2 rounded">
            Край на играта
          </button>
        </div>
      </div>
    )
  }
  if (isFinished) return <Summary score={score} onRestart={restart} />

  return (
    <div className="app-wrapper">

      {/* progress bar */}
      <div className="progress-container" ref={progressRef} style={{position:'relative'}}>
        <div
          className="progress-bar"
          style={{ 
            width: `${Math.min((score / TARGET_SCORE) * 100, 100)}%`,
            background: lastCorrect === null
              ? 'linear-gradient(to right, #3b82f6, #60a5fa)'
              : lastCorrect
                ? 'linear-gradient(to right, #3b82f6, #60a5fa)'
                : 'linear-gradient(to right, #f97316, #fb923c)'
          }}
        />
        <span className="progress-text">
          {Math.round((score / TARGET_SCORE) * 100)}%
        </span>
        {/* Emoji indicator - абсолютно спрямо progress-container */}
        <span
          className="progress-emoji"
          style={{
            position: 'absolute',
            left: progressWidth
              ? `calc(${Math.max(0, Math.min((score / TARGET_SCORE), 1)) * progressWidth}px)`
              : '0px',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: '4.0rem',
            pointerEvents: 'none',
            zIndex: 20,
            transition: 'left 0.5s cubic-bezier(.4,0,.2,1)'
          }}
        >
          {lastCorrect === null ? '' : lastCorrect ? '😜' : '😒'}
        </span>
      </div>

      {/* three-panel layout, точно като в mockup Grisho.html */}
      <div className="main-content">
        {/* Ляв панел - пъзел */}
        <div className="left-panel">
          <div className="puzzle-placeholder">
            {/* Тук ще сложим canvas или SVG за пъзела в бъдеще */}
          </div>
          <PuzzleSVG 
            revealedCount={puzzleRevealedCount} 
            dragonImageUrl={dragonImageUrl || '/Pics/Dragon 1.png'} 
          />
        </div>
        {/* Централен панел - само задачата */}
        <div className="flash-card-panel">
          <div className="problem" id="problem">
            {fact.i} × {fact.j}
          </div>
        </div>
        {/* Десен панел - input и keypad */}
        <div className="right-panel flex flex-col items-center gap-4">
          <InputAndKeypad onSubmit={handleSubmit} correctAnswer={fact.i * fact.j} fact={fact} />
        </div>
      </div>
    </div>
  )
}
