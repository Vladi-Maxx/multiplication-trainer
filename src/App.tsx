import React, { useState, useEffect } from 'react'
import FlashCard, { Fact } from './components/FlashCard.tsx'
import InputAndKeypad from './components/InputAndKeypad'
import Summary from './components/Summary.tsx'
import { randomFact } from './utils/facts.ts'
import { loadFacts, saveFacts, logSession } from './services/storage'

const TARGET_SCORE = 300 // можеш да смениш по желание
const POINT_CORRECT = 10
const POINT_WRONG = -5

export default function App() {
  const [score, setScore] = useState(0)
  const [fact, setFact] = useState<Fact>(() => randomFact())
  const [isFinished, setFinished] = useState(false)
  const [paused, setPaused] = useState(false)
  const [lastCorrect, setLastCorrect] = useState<boolean|null>(null)
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
    console.log('Loaded facts:', loadFacts())
  }, [])

  const handleSubmit = (ok: boolean, duration: number, timedOut: boolean) => {
    setLastCorrect(ok);
    if (timedOut) {
      setPaused(true)
      return
    }
    setScore((s) => {
      const next = s + (ok ? POINT_CORRECT : POINT_WRONG)
      // update statistics for this fact
      const prevFacts = loadFacts()
      // find existing stats or init
      const existing = prevFacts.find(f => f.i === fact.i && f.j === fact.j) as any
      const record = existing
        ? { ...existing }
        : { i: fact.i, j: fact.j, correctCount: 0, wrongCount: 0, streak: 0, avgTime: 0, attempts: 0, box: 1, lastPracticed: new Date().toISOString() }
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
      // Leitner system: update box and lastPracticed
      const now = new Date().toISOString();
      if (ok && record.streak >= 3) {
        record.box = Math.min((record.box ?? 1) + 1, 5);
        record.lastPracticed = now;
      } else if (!ok) {
        record.box = 1;
        record.lastPracticed = now;
      }
      // update nextPractice based on interval
      const daysMap: Record<number, number> = {1: 0, 2: 1, 3: 2, 4: 4, 5: 7};
      record.nextPractice = new Date(Date.now() + daysMap[record.box] * 86400000).toISOString();
      // save updated stats
      const updatedFacts = [...prevFacts.filter(f => !(f.i === fact.i && f.j === fact.j)), record]
      saveFacts(updatedFacts)
      if (next >= TARGET_SCORE) {
        setFinished(true)
      }
      logSession({
        id: Date.now().toString(),
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        score: next,
        duration,
        timedOut,
        factsPractised: updatedFacts
      })
      return next
    })
    setFact(randomFact())
  }

  const restart = () => {
    setScore(0)
    setFact(randomFact())
    setFinished(false)
  }

  if (paused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-2xl">Времето изтече!</div>
        <div className="flex gap-4">
          <button onClick={() => { setPaused(false); setFact(randomFact()) }} className="bg-blue-500 text-white px-4 py-2 rounded">
            Продължи
          </button>
          <button onClick={() => { setPaused(false); setFinished(true); }} className="bg-red-500 text-white px-4 py-2 rounded">
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
        </div>
        {/* Централен панел - само задачата */}
        <div className="flash-card-panel flex items-center justify-center">
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
