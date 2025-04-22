import React from 'react'

interface KeypadProps {
  value: string
  setValue: (val: string) => void
  onSubmit: () => void
}

export default function Keypad({ value, setValue, onSubmit }: KeypadProps) {
  const handleKey = (k: string) => {
    if (k === 'OK') onSubmit()
    else if (k === '⌫') setValue(value.slice(0, -1))
    else setValue(value + k)
  }
  return (
    <div className="keypad">
      {["7","8","9","4","5","6","1","2","3","0","OK"].map((k, i) => (
        <button
          key={i}
          type={k === 'OK' ? 'submit' : 'button'}
          className={`key${k === 'OK' ? ' submit' : ''}`}
          onClick={e => { e.preventDefault(); handleKey(k) }}
        >
          {k === 'OK' ? 'Изпрати' : k}
        </button>
      ))}
    </div>
  )
}
