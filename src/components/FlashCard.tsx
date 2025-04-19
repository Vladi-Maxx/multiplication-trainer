import React, { useState } from 'react'

export interface Fact {
  i: number
  j: number
}
interface Props {
  fact: Fact
  onSubmit: (isCorrect: boolean) => void
}
export default function FlashCard({ fact, onSubmit }: Props) {
  const [answer, setAnswer] = useState('')
  const correct = fact.i * fact.j

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(Number(answer) === correct)
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
