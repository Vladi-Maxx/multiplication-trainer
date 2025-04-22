import React, { useState, useRef } from 'react'
import Keypad from './Keypad'

interface Props {
  onSubmit: (ok: boolean, duration: number, timedOut: boolean) => void
  correctAnswer: number
  fact: { i: number, j: number }
}

export default function InputAndKeypad({ onSubmit, correctAnswer, fact }: Props) {
  const [answer, setAnswer] = useState('')
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    startTimeRef.current = Date.now()
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onSubmit(false, 30, true)
      setAnswer('')
    }, 30000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [fact])

  const handleSubmit = () => {
    const duration = (Date.now() - startTimeRef.current) / 1000
    if (answer === '') return
    if (timerRef.current) clearTimeout(timerRef.current)
    onSubmit(Number(answer) === correctAnswer, duration, false)
    setAnswer('')
    startTimeRef.current = Date.now()
  }

  return (
    <>
      <input
        id="answer"
        className="input-field w-full mb-4"
        value={answer}
        onChange={e => setAnswer(e.target.value.replace(/\D/g, ''))}
        type="text"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
      />
      <Keypad value={answer} setValue={setAnswer} onSubmit={handleSubmit} />
    </>
  )
}
