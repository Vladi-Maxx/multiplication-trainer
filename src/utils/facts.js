export function randomFact() {
  const i = Math.floor(Math.random() * 8) + 2; // 2‑9
  const j = Math.floor(Math.random() * 8) + 2;
  return { i, j, answer: i * j };
}
