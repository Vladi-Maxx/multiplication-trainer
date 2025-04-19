import { loadFacts } from '../services/storage'

export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

export function randomFact() {
  const stored = loadFacts()
  // build set of solved combos
  const seen = new Set(stored.map(f => `${f.i}-${f.j}`))
  // filter out solved facts
  const available = allFacts.filter(f => !seen.has(`${f.i}-${f.j}`))
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)]
  }
  // if all facts solved, pick random fallback
  return allFacts[Math.floor(Math.random() * allFacts.length)]
}
