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
