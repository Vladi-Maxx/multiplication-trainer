import React, { useState, useEffect } from 'react'
import FlashCard, { Fact } from './components/FlashCard.tsx'
import InputAndKeypad from './components/InputAndKeypad'
import Summary from './components/Summary.tsx'
import { randomFact } from './utils/facts.ts'
import { loadFacts, saveFacts, startTraining, finishTraining, addFactToCurrentTraining, logSession, getCurrentTraining } from './services/storage';
import { supabase, recordFactResponse, initializeSession } from './services/supabase';
import { clearAllLocalStorage } from './utils/debug'; // Импортираме функцията за изчистване на данните
import dragonPic from '../Pics/Dragon 1.png'

const TARGET_SCORE = 300 // можеш да смениш по желание
const POINT_CORRECT = 10
const POINT_WRONG = -5

import PuzzleSVG from './components/PuzzleSVG';
import Dashboard from './components/Dashboard';

export default function App() {
  const [score, setScore] = useState(0)
  const [fact, setFact] = useState<Fact>(() => randomFact())
  const [isFinished, setFinished] = useState(false)
  const [paused, setPaused] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(null)
  const [puzzleRevealedCount, setPuzzleRevealedCount] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
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
        // Инициализираме потребителска сесия, ако възможно
        const isAuthenticated = await initializeSession();
        
        if (!isAuthenticated) {
          console.warn('Не може да се инициализира потребителска сесия, продължаваме в офлайн режим');
        }
      } catch (error) {
        console.error('Грешка при инициализиране на потребителска сесия:', error);
      }
      
      // Зареждаме фактите от localStorage и Supabase
      // Тази функция ще се погрижи за проверка на връзката и инициализация
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
    
    // Не използваме recordFactResponse за запис на сесии, тъй като не се интересуваме от тях
    // Трудността ще се обнови локално и ще се синхронизира със Supabase при следващата синхронизация
    // Зареждаме фактите, за да вземем актуалната трудност
    const allFacts = loadFacts();
    const existingFact = allFacts.find(f => f.i === fact.i && f.j === fact.j);
    const currentDifficulty = existingFact?.difficultyRating || 5.0;
  
    // Добави отговора към текущата тренировка само ако timedOut е false
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
        lastPracticed: existingFact?.lastPracticed || new Date().toISOString(),
        nextPractice: existingFact?.nextPractice || new Date().toISOString(),
        difficultyRating: currentDifficulty // Използваме актуалната трудност на факта
      },
      isCorrect: ok,
      responseTime: duration
    });
    setPuzzleRevealedCount(prev => {
      if (ok) return Math.min(prev + 2, 60);
      else return Math.max(prev - 1, 0);
    });
    setScore(s => {
      const next = s + (ok ? POINT_CORRECT : POINT_WRONG)
      // update statistics for this fact
      const prevFacts = loadFacts()
      const existing = prevFacts.find(f => f.i === fact.i && f.j === fact.j)
      const daysMap: Record<number, number> = {1: 0, 2: 1, 3: 2, 4: 4, 5: 7};

      const record = existing
        ? { ...existing } 
        : { 
            i: fact.i,
            j: fact.j,
            correctCount: 0,
            wrongCount: 0,
            streak: 0,
            avgTime: 0,
            attempts: 0,
            box: 1,
            lastPracticed: new Date().toISOString(),
            nextPractice: new Date(Date.now() + daysMap[1] * 86400000).toISOString(),
            difficultyRating: 5.0  // Добавяме стойност по подразбиране
          };

      // Update stats based on correctness
      const now = new Date().toISOString();
      // update metrics
      record.attempts = (record.attempts ?? 0) + 1
      if (ok) {
        record.correctCount = (record.correctCount ?? 0) + 1
        record.streak = (record.streak ?? 0) + 1
      } else {
        record.wrongCount = (record.wrongCount ?? 0) + 1
        record.streak = 0
      }
      record.avgTime = ((record.avgTime ?? 0) * (record.attempts - 1) + duration) / record.attempts
      
      // Актуализираме трудността на факта в локалния storage по същия начин както в Supabase
      record.difficultyRating = Math.max(1, Math.min(10, (record.difficultyRating || 5.0) + (ok ? -0.2 : 0.5)))
      // Leitner system: update box and lastPracticed
      if (ok && record.streak >= 3) {
        record.box = Math.min((record.box ?? 1) + 1, 5);
        record.lastPracticed = now;
      } else if (!ok) {
        record.box = 1;
        record.lastPracticed = now;
      }
      // update nextPractice based on interval
      record.nextPractice = new Date(Date.now() + daysMap[record.box] * 86400000).toISOString();
      // save updated stats
      const updatedFacts = [...prevFacts.filter(f => !(f.i === fact.i && f.j === fact.j)), record] 
      saveFacts(updatedFacts)
      if (next >= TARGET_SCORE) {
        setFinished(true)
        finishTraining(); // При достигане на целта приключи тренировката
      }
      // Създаваме и записваме сесията в Supabase
      logSession({
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        score: next,
        durationSeconds: Math.floor(duration / 1000), // превръщаме милисекундите в секунди
        timedOut,
        facts: [{ // използваме новия FactResponse тип
          fact: {
            i: fact.i,
            j: fact.j,
            correctCount: record.correctCount, // Използваме актуалните стойности от факта
            wrongCount: record.wrongCount,
            streak: record.streak,
            avgTime: record.avgTime,
            attempts: record.attempts,
            box: record.box,
            lastPracticed: record.lastPracticed,
            nextPractice: record.nextPractice,
            difficultyRating: record.difficultyRating // Използваме актуалната трудност
          },
          isCorrect: ok,
          responseTime: duration
        }]
      })
      return next
    })
    setFact(randomFact())
  }

  const restart = () => {
    setScore(0)
    setFact(randomFact())
    setFinished(false)
    setPaused(false);
    startTraining(); // При рестарт започни нова тренировка
  }

  if (showDashboard) {
    return <Dashboard onClose={() => setShowDashboard(false)} />
  }

  if (paused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-2xl">Времето изтече!</div>
        <div className="flex gap-4">
          <button onClick={() => { setPaused(false); setFact(randomFact()) }} className="bg-blue-500 text-white px-4 py-2 rounded">
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
