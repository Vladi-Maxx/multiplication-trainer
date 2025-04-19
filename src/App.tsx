import React, { useState, useEffect } from 'react'
import FlashCard, { Fact } from './components/FlashCard.tsx'
import Summary from './components/Summary.tsx'
import { randomFact } from './utils/facts.ts'
import { loadFacts } from './services/storage'

const TARGET_SCORE = 300 // можеш да смениш по желание
const POINT_CORRECT = 10
const POINT_WRONG = -5

export default function App() {
  const [score, setScore] = useState(0)
  const [fact, setFact] = useState<Fact>(() => randomFact())
  const [isFinished, setFinished] = useState(false)

  useEffect(() => {
    console.log('Loaded facts:', loadFacts())
  }, [])

  const handleSubmit = (ok: boolean) => {
    setScore((s) => {
      const next = s + (ok ? POINT_CORRECT : POINT_WRONG)
      if (next >= TARGET_SCORE) {
        setFinished(true)
      }
      return next
    })
    setFact(randomFact())
  }

  const restart = () => {
    setScore(0)
    setFact(randomFact())
    setFinished(false)
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
