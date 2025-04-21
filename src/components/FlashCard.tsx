import React, { useState, useEffect, useRef } from 'react'

export interface Fact {
  i: number
  j: number
}
interface Props {
  fact: Fact
  onSubmit: (isCorrect: boolean, duration: number, timedOut: boolean) => void
}
export default function FlashCard({ fact, onSubmit }: Props) {
  const [answer, setAnswer] = useState('')
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const correct = fact.i * fact.j

  useEffect(() => {
    startTimeRef.current = Date.now()
    timerRef.current = window.setTimeout(() => {
      onSubmit(false, 30, true)
    }, 30000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fact])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (timerRef.current) clearTimeout(timerRef.current)
    const duration = (Date.now() - startTimeRef.current) / 1000
    onSubmit(Number(answer) === correct, duration, false)
    setAnswer('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <div className="text-3xl font-bold">
        {fact.i} × {fact.j} = ?
      </div>
      <input
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="border rounded px-3 py-2 text-center w-32 text-xl"
        type="number"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Провери
      </button>
    </form>
  );
}
