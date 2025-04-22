This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: **/*.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
src/
  components/
    FlashCard.tsx
    HeatMap.tsx
    Summary.tsx
  services/
    storage.ts
    types.ts
  utils/
    facts.ts
  App.tsx
  index.css
  main.tsx
tests/
  leitner.spec.ts
.env.example
index.html
package.json
postcss.config.js
tailwind.config.js
vite.config.js
vitest.config.ts
```

# Files

## File: tests/leitner.spec.ts
```typescript
/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { loadFacts, saveFacts } from '../src/services/storage'
import { randomFact, allFacts } from '../src/utils/facts'

// Мокаем localStorage (jsdom)
(global as any).localStorage = window.localStorage

describe('Leitner system', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes all facts in box=1', () => {
    const facts = loadFacts()
    // след първо зареждане, storage се инициализира с allFacts + box=1
    expect(facts.length).toBe(allFacts.length)
    expect(facts.every(f => f.box === 1)).toBe(true)
  })

  it('increments box after 3 consecutive correct answers', () => {
    // симулираме три верни отговора за факт 2×2
    let stats = loadFacts()
    for (let k = 0; k < 3; k++) {
      const rec = stats.find(f => f.i === 2 && f.j === 2)!
      rec.streak = (rec.streak ?? 0) + 1
      if (rec.streak >= 3) {
        rec.box = Math.min((rec.box ?? 1) + 1, 5)
      }
      rec.lastPracticed = new Date().toISOString()
    }
    saveFacts(stats)
    stats = loadFacts()
    const updated = stats.find(f => f.i === 2 && f.j === 2)!
    expect(updated.box).toBe(2)
  })

  it('resets box to 1 on wrong answer', () => {
    // първо вдигаме box на 3 ръчно
    let stats = loadFacts()
    const rec = stats.find(f => f.i === 3 && f.j === 3)!
    rec.streak = 0
    rec.box = 3
    saveFacts(stats)
    // сега симулираме грешка
    stats = loadFacts()
    const rec2 = stats.find(f => f.i === 3 && f.j === 3)!
    rec2.box = 1
    rec2.lastPracticed = new Date().toISOString()
    saveFacts(stats)
    stats = loadFacts()
    expect(stats.find(f => f.i === 3 && f.j === 3)!.box).toBe(1)
  })

  it('randomFact excludes mastered facts (box=5 & streak>=3)', () => {
    // правим един факт mastered
    let stats = loadFacts()
    const rec = stats.find(f => f.i === 4 && f.j === 4)!
    rec.box = 5
    rec.streak = 3
    saveFacts(stats)
    // филтрираме activeFacts вътре в randomFact
    const picks = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const f = randomFact()
      picks.add(`${f.i}x${f.j}`)
    }
    expect(picks.has('4x4')).toBe(false)
  })
})
```

## File: vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
```

## File: src/components/HeatMap.tsx
```typescript
import React from 'react'
import type { Fact as StatFact } from '../services/types'

interface Props {
  facts: StatFact[]
}

export default function HeatMap({ facts }: Props) {
  // Генерираме клетки 1..9 x 1..9
  const cells: React.ReactElement[] = []
  for (let i = 1; i <= 9; i++) {
    for (let j = 1; j <= 9; j++) {
      const stat = facts.find(f => f.i === i && f.j === j)
      const attempts = stat?.attempts ?? 0
      const correct = stat?.correctCount ?? 0
      const accuracy = attempts ? correct / attempts : 0
      // Цветен градиент от червено (0) към зелено (1)
      const red = Math.round((1 - accuracy) * 255)
      const green = Math.round(accuracy * 255)
      const bg = attempts ? `rgb(${red}, ${green}, 0)` : '#ccc'
      cells.push(
        <div
          key={`${i}-${j}`}
          title={`Опити: ${attempts}, Верни: ${correct}`}
          style={{ backgroundColor: bg }}
          className="w-8 h-8 flex flex-col items-center justify-center text-xs border"
        >
          <div>{i}×{j}</div>
          {attempts > 0 && <div className="text-[8px]">{correct}/{attempts}</div>}
        </div>
      )
    }
  }
  return <div className="grid grid-cols-9 gap-1">{cells}</div>
}
```

## File: src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## File: src/main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## File: .env.example
```
# --- Multiplication Trainer env example ---
VITE_APP_NAME="Multiplication Trainer"
# Празно за MVP; добави при нужда:
# VITE_FIREBASE_API_KEY=""
```

## File: package.json
```json
{
  "name": "multiplication-trainer",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "test": "vitest",
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^11.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/jsdom": "^21.1.7",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.19",
    "jsdom": "^26.1.0",
    "postcss": "^8.4.32",
    "repomix": "^0.3.2",
    "tailwindcss": "^3.4.4",
    "vite": "^5.2.0",
    "vitest": "^3.1.2"
  }
}
```

## File: postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

## File: tailwind.config.js
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

## File: src/components/FlashCard.tsx
```typescript
import React, { useState, useEffect, useRef } from 'react'

export interface Fact {
  i: number
  j: number
}
interface Props {
  fact: Fact
  onSubmit: (isCorrect: boolean, duration: number, timedOut: boolean) => void
}
export default function FlashCard({ fact, onSubmit }: Props) {
  const [answer, setAnswer] = useState('')
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const correct = fact.i * fact.j

  useEffect(() => {
    startTimeRef.current = Date.now()
    timerRef.current = window.setTimeout(() => {
      onSubmit(false, 30, true)
    }, 30000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fact])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (timerRef.current) clearTimeout(timerRef.current)
    const duration = (Date.now() - startTimeRef.current) / 1000
    onSubmit(Number(answer) === correct, duration, false)
    setAnswer('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <div className="text-3xl font-bold">
        {fact.i} × {fact.j} = ?
      </div>
      <input
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="border rounded px-3 py-2 text-center w-32 text-xl"
        type="number"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Провери
      </button>
    </form>
  );
}
```

## File: src/components/Summary.tsx
```typescript
import React from 'react';
import HeatMap from './HeatMap';
import { loadFacts } from '../services/storage';

interface Props {
  score: number
  onRestart: () => void
}

export default function Summary({ score, onRestart }: Props) {
  const facts = loadFacts();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Браво! 🎉</h1>
      <p className="text-xl">Събра {score} точки</p>
      <button onClick={onRestart} className="bg-purple-600 text-white px-6 py-3 rounded">
        Играй пак
      </button>
      <div className="mt-6">
        <HeatMap facts={facts} />
      </div>
    </div>
  )
}
```

## File: index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Multiplication Trainer</title>
  </head>
  <body class="min-h-screen bg-slate-50 text-slate-800">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## File: vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5175
  }
});
```

## File: src/services/types.ts
```typescript
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
```

## File: src/services/storage.ts
```typescript
import type { Fact, Session } from './types';
import { allFacts } from '../utils/facts';

// TODO: implement storage service

export function loadFacts(): Fact[] {
  const raw = localStorage.getItem('facts');
  if (!raw) {
    const now = new Date().toISOString();
    const defaultFacts: Fact[] = allFacts.map(f => ({
      i: f.i,
      j: f.j,
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      avgTime: 0,
      attempts: 0,
      box: 1,
      lastPracticed: now,
      nextPractice: now
    }));
    localStorage.setItem('facts', JSON.stringify(defaultFacts));
    return defaultFacts;
  }
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? (parsed as Fact[]) : [];
    // default Leitner fields
    const now = new Date().toISOString();
    arr.forEach(r => {
      if (r.box == null) r.box = 1;
      if (r.lastPracticed == null) r.lastPracticed = now;
    });
    // default nextPractice based on Leitner intervals
    const intervalMap: Record<number, number> = {1:0,2:1,3:2,4:4,5:7};
    arr.forEach(r => {
      if (!r.nextPractice || isNaN(Date.parse(r.nextPractice))) {
        const days = intervalMap[r.box] ?? 0;
        r.nextPractice = new Date(Date.now() + days * 86400000).toISOString();
      }
    });
    return arr;
  } catch (e) {
    console.error('loadFacts: failed to parse facts', e);
    return [];
  }
}

export function saveFacts(facts: Fact[]): void {
  const raw = JSON.stringify(facts);
  try {
    localStorage.setItem('facts', raw);
  } catch (e) {
    console.error('saveFacts: failed to save facts', e);
  }
}

export function logSession(session: Session): void {
  const raw = localStorage.getItem('sessions');
  let sessions: Session[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      sessions = Array.isArray(parsed) ? (parsed as Session[]) : [];
    } catch (e) {
      console.error('logSession: failed to parse sessions', e);
      sessions = [];
    }
  }
  sessions.push(session);
  try {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  } catch (e) {
    console.error('logSession: failed to save sessions', e);
  }
}
```

## File: src/utils/facts.ts
```typescript
import { loadFacts } from '../services/storage';
import type { Fact as StatFact } from '../services/types';

export const allFacts = Array.from({ length: 9 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => ({ i: i + 1, j: j + 1 }))
).flat()

// Адаптивно теглене на факт
export function randomFact() {
  const stats: StatFact[] = loadFacts()
  const now = new Date()
  const dueFacts = stats.length
    ? allFacts.filter(f => {
        const rec = stats.find(r => r.i === f.i && r.j === f.j)
        return !rec || new Date(rec.nextPractice) <= now
      })
    : allFacts
  console.log(`[randomFact] dueFacts count: ${dueFacts.length}`)
  const activeFacts = dueFacts.filter(fact => {
    const rec = stats.find(r => r.i === fact.i && r.j === fact.j)
    if (rec && rec.box >= 5 && rec.streak >= 3) {
      return false
    }
    return true
  })
  if (activeFacts.length === 0) {
    return allFacts[Math.floor(Math.random() * allFacts.length)]
  }
  const weighted = activeFacts.map(fact => {
    const rec = stats.find(r => r.i === fact.i && r.j === fact.j)
    const attempts = rec?.attempts ?? 0
    const correct = rec?.correctCount ?? 0
    const avgTime = rec?.avgTime ?? 0
    const accuracy = attempts > 0 ? correct / attempts : 0
    const timeBonus = avgTime > 6 ? (avgTime - 6) / 10 : 0
    const weight = Math.max(0.1, (1 - accuracy) + timeBonus)
    // per-fact debug log removed to reduce console noise
    return { fact, weight }
  })
  const total = weighted.reduce((sum, w) => sum + w.weight, 0)
  let r = Math.random() * total
  for (const wItem of weighted) {
    if (r < wItem.weight) {
      console.log(`[randomFact] selected: ${wItem.fact.i}x${wItem.fact.j}, weight: ${wItem.weight}`)
      return wItem.fact
    }
    r -= wItem.weight
  }
  // fallback към активните факти
  return activeFacts[Math.floor(Math.random() * activeFacts.length)]
}
```

## File: src/App.tsx
```typescript
import React, { useState, useEffect } from 'react'
import FlashCard, { Fact } from './components/FlashCard.tsx'
import Summary from './components/Summary.tsx'
import { randomFact } from './utils/facts.ts'
import { loadFacts, saveFacts, logSession } from './services/storage'

const TARGET_SCORE = 300 // можеш да смениш по желание
const POINT_CORRECT = 10
const POINT_WRONG = -5

export default function App() {
  const [score, setScore] = useState(0)
  const [fact, setFact] = useState<Fact>(() => randomFact())
  const [isFinished, setFinished] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    console.log('Loaded facts:', loadFacts())
  }, [])

  const handleSubmit = (ok: boolean, duration: number, timedOut: boolean) => {
    if (timedOut) {
      setPaused(true)
      return
    }
    setScore((s) => {
      const next = s + (ok ? POINT_CORRECT : POINT_WRONG)
      // update statistics for this fact
      const prevFacts = loadFacts()
      // find existing stats or init
      const existing = prevFacts.find(f => f.i === fact.i && f.j === fact.j) as any
      const record = existing
        ? { ...existing }
        : { i: fact.i, j: fact.j, correctCount: 0, wrongCount: 0, streak: 0, avgTime: 0, attempts: 0, box: 1, lastPracticed: new Date().toISOString() }
      // update metrics
      record.attempts = (record.attempts ?? 0) + 1
      if (ok) {
        record.correctCount = (record.correctCount ?? 0) + 1
        record.streak = (record.streak ?? 0) + 1
      } else {
        record.wrongCount = (record.wrongCount ?? 0) + 1
        record.streak = 0
      }
      record.avgTime = ((record.avgTime ?? 0) * (record.attempts - 1) + duration) / record.attempts
      // Leitner system: update box and lastPracticed
      const now = new Date().toISOString();
      if (ok && record.streak >= 3) {
        record.box = Math.min((record.box ?? 1) + 1, 5);
        record.lastPracticed = now;
      } else if (!ok) {
        record.box = 1;
        record.lastPracticed = now;
      }
      // update nextPractice based on interval
      const daysMap: Record<number, number> = {1: 0, 2: 1, 3: 2, 4: 4, 5: 7};
      record.nextPractice = new Date(Date.now() + daysMap[record.box] * 86400000).toISOString();
      // save updated stats
      const updatedFacts = [...prevFacts.filter(f => !(f.i === fact.i && f.j === fact.j)), record]
      saveFacts(updatedFacts)
      if (next >= TARGET_SCORE) {
        setFinished(true)
      }
      logSession({
        id: Date.now().toString(),
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        score: next,
        duration,
        timedOut,
        factsPractised: updatedFacts
      })
      return next
    })
    setFact(randomFact())
  }

  const restart = () => {
    setScore(0)
    setFact(randomFact())
    setFinished(false)
  }

  if (paused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-2xl">Времето изтече!</div>
        <div className="flex gap-4">
          <button onClick={() => { setPaused(false); setFact(randomFact()) }} className="bg-blue-500 text-white px-4 py-2 rounded">
            Продължи
          </button>
          <button onClick={() => { setPaused(false); setFinished(true); }} className="bg-red-500 text-white px-4 py-2 rounded">
            Край на играта
          </button>
        </div>
      </div>
    )
  }
  if (isFinished) return <Summary score={score} onRestart={restart} />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="text-2xl">Точки: {score}</div>
      <FlashCard fact={fact} onSubmit={handleSubmit} />
      <div className="w-64 h-2 bg-gray-300 rounded">
        <div
          className="h-full bg-green-500 rounded"
          style={{ width: `${(score / TARGET_SCORE) * 100}%` }}
        />
      </div>
    </div>
  )
}
```
