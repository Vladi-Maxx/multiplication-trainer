import React from 'react'
import type { Fact as StatFact } from '../services/types'

interface Props {
  facts: StatFact[]
}

export default function HeatMap({ facts }: Props) {
  // Генерираме клетки 1..9 x 1..9
  const cells: React.ReactElement[] = []
  for (let i = 1; i <= 9; i++) {
    for (let j = 1; j <= 9; j++) {
      const stat = facts.find(f => f.i === i && f.j === j)
      const attempts = stat?.attempts ?? 0
      const correct = stat?.correctCount ?? 0
      const accuracy = attempts ? correct / attempts : 0
      // Цветен градиент от червено (0) към зелено (1)
      const red = Math.round((1 - accuracy) * 255)
      const green = Math.round(accuracy * 255)
      const bg = attempts ? `rgb(${red}, ${green}, 0)` : '#ccc'
      cells.push(
        <div
          key={`${i}-${j}`}
          title={`Опити: ${attempts}, Верни: ${correct}`}
          style={{ backgroundColor: bg }}
          className="w-8 h-8 flex flex-col items-center justify-center text-xs border"
        >
          <div>{i}×{j}</div>
          {attempts > 0 && <div className="text-[8px]">{correct}/{attempts}</div>}
        </div>
      )
    }
  }
  return <div className="grid grid-cols-9 gap-1">{cells}</div>
}
