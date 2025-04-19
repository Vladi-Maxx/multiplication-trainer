import { loadFacts } from '../services/storage'

export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

export function randomFact() {
  // DEBUG: always return 4×2
  return { i: 4, j: 2 }
}
