import { loadFacts } from '../services/storage';
import type { Fact as StatFact } from '../services/types';

export const allFacts = Array.from({ length: 10 }, (_, i) =>
  Array.from({ length: 10 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

// Адаптивно теглене на факт
export function randomFact(prevFact?: { i: number, j: number }) {
  const stats: StatFact[] = loadFacts()
  const now = new Date()
  const dueFacts = stats.length
    ? allFacts.filter(f => {
        const rec = stats.find(r => r.i === f.i && r.j === f.j)
        return !rec || new Date(rec.nextPractice) <= now
      })
    : allFacts
  
  const activeFacts = dueFacts.filter(fact => {
    const rec = stats.find(r => r.i === fact.i && r.j === fact.j)
    if (rec && rec.box >= 5 && rec.streak >= 3) {
      return false
    }
    return true
  })
  let filteredFacts = activeFacts;
  if (prevFact && activeFacts.length > 1) {
    filteredFacts = activeFacts.filter(f => !(f.i === prevFact.i && f.j === prevFact.j));
    if (filteredFacts.length === 0) filteredFacts = activeFacts;
  }
  if (filteredFacts.length === 0) {
    return allFacts[Math.floor(Math.random() * allFacts.length)]
  }
  const weighted = filteredFacts.map(fact => {
    const rec = stats.find(r => r.i === fact.i && r.j === fact.j)
    const attempts = rec?.attempts ?? 0
    const correct = rec?.correctCount ?? 0
    const avgTime = rec?.avgTime ?? 0
    const accuracy = attempts > 0 ? correct / attempts : 0
    const timeBonus = avgTime > 6 ? (avgTime - 6) / 10 : 0
    const weight = Math.max(0.1, (1 - accuracy) + timeBonus)
    // per-fact debug log removed to reduce console noise
    return { fact, weight }
  })
  const total = weighted.reduce((sum, w) => sum + w.weight, 0)
  let r = Math.random() * total
  for (const wItem of weighted) {
    if (r < wItem.weight) {
      
      return wItem.fact
    }
    r -= wItem.weight
  }
  // fallback към филтрираните факти
  return filteredFacts[Math.floor(Math.random() * filteredFacts.length)]
}
