import { loadFacts } from '../services/storage'

export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

export function randomFact() {
  const stored = loadFacts()
  if (stored.length === 0) {
    return allFacts[Math.floor(Math.random() * allFacts.length)]
  }
  // stub: random pick from stored facts
  const pick = stored[Math.floor(Math.random() * stored.length)]
  return { i: pick.i, j: pick.j }
}
