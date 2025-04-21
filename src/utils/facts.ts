import { loadFacts } from '../services/storage';
import type { Fact as StatFact } from '../services/types';

export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

// Адаптивно теглене на факт
export function randomFact() {
  const stats: StatFact[] = loadFacts()
  // Ако няма статистики, теглим на случаен принцип
  if (!stats || stats.length === 0) {
    return allFacts[Math.floor(Math.random() * allFacts.length)]
  }
  // За всички факти изчисляваме тегло
  const weighted = allFacts.map(fact => {
    const s = stats.find(x => x.i === fact.i && x.j === fact.j)
    let weight = 1
    if (s) {
      weight += (s.wrongCount ?? 0)
      if (s.streak === 0) weight += 2
      if (s.avgTime && s.avgTime > 6) weight += (s.avgTime - 6)
    }
    return { fact, weight }
  })
  // Сумираме общото тегло
  const total = weighted.reduce((sum, w) => sum + w.weight, 0)
  // Теглим случайно число в този интервал
  let r = Math.random() * total
  for (const w of weighted) {
    if (r < w.weight) {
      console.log('Selected fact', w.fact, 'weight', w.weight)
      return w.fact
    }
    r -= w.weight
  }
  // fallback
  return allFacts[Math.floor(Math.random() * allFacts.length)]
}
