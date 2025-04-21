export interface Fact {
  i: number
  j: number
  correct: number
  wrong: number
  streak: number
  avgTime: number
}

export interface Session {
  id: string
  startedAt: string
  finishedAt: string
  score: number
  factsPractised: Fact[]
}
