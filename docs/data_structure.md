### 1. Основни типове
```ts
// Флаш факт
interface Fact {
  i: number // множител 1 (1‑9)
  j: number // множител 2 (1‑9)
  correct: number // верни опити
  wrong: number // грешни опити
  streak: number // текуща поредица
  avgTime: number // средно време за отговор (ms)
}

// Резултат от сесия
interface Session {
  id: string
  startedAt: string // ISODate
  finishedAt: string // ISODate
  score: number
  factsPractised: Fact[]
}
```

### 2. Хранилище
* **localStorage keys**
  * `facts` → JSON Fact[]
  * `sessions` → JSON Session[]

### 3. Връзки
`Session.factsPractised` съдържа моментни снимки на `Fact` за статистика.
