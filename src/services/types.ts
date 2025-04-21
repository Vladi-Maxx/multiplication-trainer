export interface Fact {
  i: number
  j: number
  correctCount: number
  wrongCount: number
  streak: number
  avgTime: number
  attempts: number
}

export interface Session {
  id: string
  startedAt: string
  finishedAt: string
  score: number
  factsPractised: Fact[]
}
