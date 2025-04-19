export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

export function randomFact() {
  return allFacts[Math.floor(Math.random() * allFacts.length)]
}
