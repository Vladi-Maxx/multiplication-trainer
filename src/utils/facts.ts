import { loadFacts } from '../services/storage';
import type { Fact as StatFact } from '../services/types';

export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

// Адаптивно теглене на факт
export function randomFact() {
  const stats: StatFact[] = loadFacts()
  // филтрираме mastered факти (box>=5 и streak>=3)
  const activeFacts = allFacts.filter(fact => {
    const rec = stats.find(r => r.i === fact.i && r.j === fact.j)
    if (rec && rec.box >= 5 && rec.streak >= 3) {
      return false
    }
    return true
  })
  // ако няма активни факти, теглим от всички
  if (activeFacts.length === 0) {
    return allFacts[Math.floor(Math.random() * allFacts.length)]
  }
  // тегла по Leitner box weights
  const boxWeights: Record<number, number> = { 1: 5, 2: 3, 3: 2, 4: 1, 5: 0 }
  const weighted = activeFacts.map(fact => {
    const rec = stats.find(r => r.i === fact.i && r.j === fact.j)
    const box = rec?.box ?? 1
    const weight = boxWeights[box] ?? 0
    return { fact, weight }
  })
  const total = weighted.reduce((sum, w) => sum + w.weight, 0)
  let r = Math.random() * total
  for (const wItem of weighted) {
    if (r < wItem.weight) {
      console.log('Selected fact', wItem.fact, 'weight', wItem.weight)
      return wItem.fact
    }
    r -= wItem.weight
  }
  // fallback към активните факти
  return activeFacts[Math.floor(Math.random() * activeFacts.length)]
}
