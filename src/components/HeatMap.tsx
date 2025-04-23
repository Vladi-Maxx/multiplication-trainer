import React from 'react'
import type { Fact as StatFact } from '../services/types'

interface Props {
  facts: StatFact[]
}

export default function HeatMap({ facts }: Props) {
  // Показваме заглавните редове и колони за по-лесна навигация
  const headers: any[] = [
    // Ъгъл горе вляво (празен)
    <div key="corner" className="w-14 h-14 flex items-center justify-center text-gray-400 font-medium"></div>
  ]
  
  // Заглавия на колоните (1-10)
  for (let j = 1; j <= 10; j++) {
    headers.push(
      <div 
        key={`col-${j}`} 
        className="w-14 h-14 flex items-center justify-center bg-purple-100 rounded-md shadow-sm text-purple-800 font-bold text-xl"
      >
        {j}
      </div>
    )
  }
  
  const rows: any[] = []
  // Добавяме реда със заглавия
  rows.push(<div key="header-row" className="flex gap-2 mb-2">{headers}</div>)
  
  // Генерираме клетки 1..10 x 1..10
  for (let i = 1; i <= 10; i++) {
    const rowCells: any[] = [
      // Заглавие на ред (i)
      <div 
        key={`row-${i}`} 
        className="w-14 h-14 flex items-center justify-center bg-purple-100 rounded-md shadow-sm text-purple-800 font-bold text-xl"
      >
        {i}
      </div>
    ]
    
    for (let j = 1; j <= 10; j++) {
      const stat = facts.find(f => f.i === i && f.j === j)
      const attempts = stat?.attempts ?? 0
      const correct = stat?.correctCount ?? 0
      const accuracy = attempts ? correct / attempts : 0
      const streak = stat?.streak ?? 0
      const box = stat?.box ?? 1
      
      // Определяме цвета базиран на точността
      let backgroundColor = '#f0f0f0' // Сиво по подразбиране за неопитани факти
      let textColor = 'rgba(0, 0, 0, 0.7)'
      let shadowColor = 'rgba(0, 0, 0, 0.1)'
      
      if (attempts > 0) {
        if (accuracy >= 0.8) {
          // Зелено за добро представяне
          backgroundColor = `rgba(0, 200, 83, ${Math.min(0.3 + accuracy * 0.7, 1)})`
          shadowColor = 'rgba(0, 180, 83, 0.4)'
        } else if (accuracy >= 0.5) {
          // Жълто за средно представяне
          backgroundColor = `rgba(255, 193, 7, ${Math.min(0.3 + accuracy * 0.7, 1)})`
          shadowColor = 'rgba(240, 180, 0, 0.4)'
        } else {
          // Червено за слабо представяне
          backgroundColor = `rgba(244, 67, 54, ${Math.min(0.3 + (1 - accuracy) * 0.7, 1)})`
          textColor = 'rgba(255, 255, 255, 0.87)'
          shadowColor = 'rgba(200, 30, 30, 0.4)'
        }
      }
      
      rowCells.push(
        <div
          key={`${i}-${j}`}
          title={`${i}×${j}=${i*j}\nОпити: ${attempts}, Верни: ${correct}, Точност: ${Math.round(accuracy * 100)}%${attempts > 0 ? `\nCтрийк: ${streak}, Ниво: ${box}` : ''}`}
          style={{ 
            backgroundColor,
            color: textColor,
            boxShadow: `0 2px 5px ${shadowColor}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          className="w-14 h-14 flex flex-col items-center justify-center rounded-md hover:shadow-md hover:scale-105 cursor-help"
        >
          <div className="text-lg font-medium">{i*j}</div>
          {attempts > 0 && (
            <div className="text-xs font-medium mt-1">
              {Math.round(accuracy * 100)}%
            </div>
          )}
        </div>
      )
    }
    rows.push(<div key={`row-${i}`} className="flex gap-2 mb-2">{rowCells}</div>)
  }
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-4 text-purple-800">Таблица на прогреса</h2>
      <div className="stats-row flex justify-around mb-6">
        <div className="stat-item bg-purple-50 p-3 rounded-md shadow-sm">
          <div className="text-sm text-purple-700">Общо задачи</div>
          <div className="text-2xl font-bold text-purple-900">{facts.reduce((sum, f) => sum + f.attempts, 0)}</div>
        </div>
        <div className="stat-item bg-green-50 p-3 rounded-md shadow-sm">
          <div className="text-sm text-green-700">Правилни</div>
          <div className="text-2xl font-bold text-green-900">{facts.reduce((sum, f) => sum + f.correctCount, 0)}</div>
        </div>
        <div className="stat-item bg-blue-50 p-3 rounded-md shadow-sm">
          <div className="text-sm text-blue-700">Средна точност</div>
          <div className="text-2xl font-bold text-blue-900">
            {Math.round(facts.reduce((sum, f) => sum + (f.attempts > 0 ? f.correctCount / f.attempts : 0), 0) / facts.filter(f => f.attempts > 0).length * 100) || 0}%
          </div>
        </div>
      </div>
      <div>{rows}</div>
      <div className="mt-6 flex justify-center">
        <div className="legend flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
            <span className="text-sm">Нуждае се от практика</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-amber-400 mr-2"></div>
            <span className="text-sm">Учи се</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
            <span className="text-sm">Научено</span>
          </div>
        </div>
      </div>
    </div>
  )
}
