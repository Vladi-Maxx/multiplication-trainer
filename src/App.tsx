import React, { useState, useEffect } from 'react'
import FlashCard, { Fact } from './components/FlashCard.tsx'
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

  useEffect(() => {
    console.log('Loaded facts:', loadFacts())
  }, [])

  const handleSubmit = (ok: boolean, duration: number, timedOut: boolean) => {
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
        : { i: fact.i, j: fact.j, correctCount: 0, wrongCount: 0, streak: 0, avgTime: 0, attempts: 0 }
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="text-2xl">Точки: {score}</div>
      <FlashCard fact={fact} onSubmit={handleSubmit} />
      <div className="w-64 h-2 bg-gray-300 rounded">
        <div
          className="h-full bg-green-500 rounded"
          style={{ width: `${(score / TARGET_SCORE) * 100}%` }}
        />
      </div>
    </div>
  )
}
