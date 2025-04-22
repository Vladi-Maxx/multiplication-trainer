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
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full">
      <div id="problem" className="problem">
        {fact.i} × {fact.j}
      </div>
      <input
        id="answer"
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="input-field w-full"
        type="number"
      />
      {/* keypad */}
      <div className="keypad">
        {['1','2','3','4','5','6','7','8','9','⌫','0','OK'].map((k,i)=> (
          <button
            key={i}
            type={k==='OK'? 'submit':'button'}
            className={`key ${k==='OK'?'submit':''}`}
            onClick={()=>{
              if(k==='OK') return; if(k==='⌫') setAnswer(a=>a.slice(0,-1)); else setAnswer(a=>a+k);
            }}>
            {k==='OK'? 'Изпрати':k}
          </button>
        ))}
      </div>
    </form>
  );
}
