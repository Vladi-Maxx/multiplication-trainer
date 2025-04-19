// TODO: implement storage service

export function loadFacts(): any[] {
  const raw = localStorage.getItem('facts');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('loadFacts: failed to parse facts', e);
    return [];
  }
}

export function saveFacts(facts: any[]): void {
  // TODO: save facts to localStorage
}

export function logSession(session: any): void {
  // TODO: log session to localStorage
}
