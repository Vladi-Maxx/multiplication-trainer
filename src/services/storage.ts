import type { Fact, Session } from './types';

// TODO: implement storage service

export function loadFacts(): Fact[] {
  const raw = localStorage.getItem('facts');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Fact[]) : [];
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
