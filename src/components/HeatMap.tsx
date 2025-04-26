import React from 'react'
interface FactResult {
  i: number;
  j: number;
  isCorrect: boolean;
}

interface Props {
  facts: FactResult[];
}

export default function HeatMap({ facts }: Props) {
  // Агрегация само веднъж в началото на функцията
  // Агрегирай по (i,j) - само брой опити и брой верни
  const factMap = new Map<string, {i: number, j: number, attempts: number, correctCount: number}>();
  for (const f of facts) {
    const key = `${f.i}_${f.j}`;
    if (!factMap.has(key)) {
      factMap.set(key, {i: f.i, j: f.j, attempts: 0, correctCount: 0});
    }
    const entry = factMap.get(key)!;
    entry.attempts += 1;
    if (f.isCorrect) entry.correctCount += 1;
  }
  const aggregatedFacts = Array.from(factMap.values());

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
      const stat = aggregatedFacts.find(f => f.i === i && f.j === j)
      const attempts = stat?.attempts ?? 0
      const correct = stat?.correctCount ?? 0
      const accuracy = attempts ? correct / attempts : 0
      
      
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
          title={`${i}×${j}=${i*j}\nОпити: ${attempts}, Верни: ${correct}, Точност: ${Math.round(accuracy * 100)}%`}
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

      <div>{rows}</div>
      <div className="mt-6 flex justify-center">
        <div className="legend flex items-center space-x-6 text-lg font-semibold">
          <div className="flex items-center"><span className="inline-block w-7 h-7 rounded bg-red-400 mr-2"></span> <span className="text-red-500">Олеле! 😱</span></div>
          <div className="flex items-center"><span className="inline-block w-7 h-7 rounded bg-yellow-300 mr-2"></span> <span className="text-yellow-600">Налучкване? 🤔</span></div>
          <div className="flex items-center"><span className="inline-block w-7 h-7 rounded bg-green-400 mr-2"></span> <span className="text-green-600">Ти си Цар  👑</span></div>
        </div>
      </div>
    </div>
  )
}
