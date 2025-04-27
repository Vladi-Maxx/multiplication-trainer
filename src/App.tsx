import React, { useState, useEffect } from 'react'
import FlashCard, { Fact } from './components/FlashCard.tsx'
import InputAndKeypad from './components/InputAndKeypad'
import Summary from './components/Summary.tsx'
import { randomFact } from './utils/facts.ts'
import { loadFacts, saveFacts, initializeSupabaseFactsData, checkSupabaseConnection, startTraining, addFactToCurrentTraining, finishTraining } from './services/storage'
import { initializeSession } from './services/supabase'
import dragonPic from '../Pics/Dragon 1.png'

const TARGET_SCORE = 300 // можеш да смениш по желание
const POINT_CORRECT = 10
const POINT_WRONG = -5

import PuzzleSVG from './components/PuzzleSVG';
import Dashboard from './components/Dashboard';
import HomeScreen from './components/HomeScreen';
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
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        avgTime: 0,
        attempts: 0,
        box: 1,
        lastPracticed: new Date().toISOString(),
        nextPractice: new Date().toISOString(),
        difficultyRating: currentDifficulty
      },
      isCorrect: ok,
      responseTime: duration
    });
    setPuzzleRevealedCount(prev => ok ? Math.min(prev + 2, 60) : Math.max(prev - 1, 0));
    const next = score + (ok ? POINT_CORRECT : POINT_WRONG);
    setScore(next);
    if (next >= TARGET_SCORE) {
      setFinished(true);
      finishTraining();
    }
    setFact(randomFact(prevFactRef.current));
    prevFactRef.current = fact;
  }

  const restart = () => {
    setScore(0)
    setFact(randomFact())
    setFinished(false)
    setScreen('home'); // При рестарт се връщаме на началния екран
    startTraining(); // При рестарт започни нова тренировка
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        onPlay={() => {
          setScreen('game');
          setFinished(false);
          setScore(0);
          setPuzzleRevealedCount(0);
          setLastCorrect(null);
          prevFactRef.current = null;
          setFact(randomFact());
          startTraining();
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
    return <Album onClose={() => setScreen('home')} />
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
      {/* Родителски контролен бутон */}
      <button 
        onClick={() => setShowDashboard(true)}
        className="absolute top-4 right-4 z-50 px-3 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 focus:outline-none flex items-center justify-center shadow-lg"
        title="Родителски дашборд"
      >
        <span className="text-xl">📊</span>
      </button>
      
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
          <PuzzleSVG revealedCount={puzzleRevealedCount} />
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
