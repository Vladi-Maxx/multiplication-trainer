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
  difficultyRating: number  // Стойност между 1 и 10, отразяваща трудността на факта
}

export interface FactResponse {
  fact: Fact
  isCorrect: boolean
  responseTime: number  // time to answer в милисекунди
}

export type TrainingStatus = 'in_progress' | 'completed';

export interface Training {
  id: string;
  startedAt: string;
  finishedAt?: string;
  facts: FactResponse[];
  score: number;
  totalResponseTime: number;
  status: TrainingStatus;
}

export interface Session {
  id: string
  startTime: string     // ISO date
  endTime: string       // ISO date
  score: number         // total score in the session
  facts: FactResponse[] // facts practiced in this session with responses
  durationSeconds: number  // session duration in seconds
  timedOut: boolean     // whether session ended by timeout
}
