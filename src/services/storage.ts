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

// Ограничаваме до последните 10 сесии, за да не препълним localStorage
// Така няма да превишаваме квотата
const MAX_SESSIONS = 10;

export function logSession(session: Session): void {
  try {
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
    
    // Добавяме новата сесия
    sessions.push(session);
    
    // Ако имаме повече от MAX_SESSIONS, премахваме най-старите
    if (sessions.length > MAX_SESSIONS) {
      sessions = sessions.slice(-MAX_SESSIONS);
    }
    
    localStorage.setItem('sessions', JSON.stringify(sessions));
  } catch (e) {
    console.error('logSession: failed to save sessions', e);
    
    // Ако имаме ограничение на квотата, опитваме да изчистим всички сесии
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem('sessions');
        console.log('Sessions cleared due to quota limit');
      } catch (clearError) {
        console.error('Failed to clear sessions:', clearError);
      }
    }
  }
}

// Функция за изчистване на всички данни в localStorage
// Може да се използва чрез конзола или бутон в UI, ако се добави такъв
export function clearAllStorageData(): void {
  try {
    localStorage.clear();
    console.log('All local storage data has been cleared');
  } catch (e) {
    console.error('Failed to clear local storage:', e);
  }
}
