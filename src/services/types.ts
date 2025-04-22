export interface Fact {
  i: number
  j: number
  correctCount: number
  wrongCount: number
  streak: number
  avgTime: number
  attempts: number
  box: number  // Leitner box (1..5)
  lastPracticed: string  // ISO date of last practice
  nextPractice: string  // ISO date of next scheduled practice
}

export interface Session {
  id: string
  startedAt: string
  finishedAt: string
  score: number
  factsPractised: Fact[]
  duration: number  // session duration in seconds
  timedOut: boolean // whether session ended by timeout
}
