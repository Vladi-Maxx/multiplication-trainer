import type { Fact, Session } from './types';
import { allFacts } from '../utils/facts';
import { supabase } from './supabase';

// Флаг, който показва дали се използва Supabase или не
// Това позволява лесно превключване между режими и обработка на офлайн случаи
let useSupabase = true;

// Функция, която проверява дали Supabase е достъпен
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('facts').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    console.error('Failed to connect to Supabase:', e);
    useSupabase = false;
    return false;
  }
}

// Извикване на функцията за проверка при стартиране
checkSupabaseConnection().then(isConnected => {
  useSupabase = isConnected;
  console.log(`Supabase connection ${isConnected ? 'successful' : 'failed'}, using ${isConnected ? 'remote' : 'local'} storage`);
});

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
    // Стартираме асинхронно синхронизиране със Supabase, но не чакаме завършването му
    if (useSupabase) {
      syncFactsWithSupabase(facts).catch(e => {
        console.error('Failed to sync facts with Supabase:', e);
      });
    }
  } catch (e) {
    console.error('saveFacts: failed to save facts', e);
  }
}

/**
 * Асинхронно синхронизира фактите със Supabase
 * ВАЖНО: Запазваме точно същата структура на данните, която използваме в localStorage!
 */
async function syncFactsWithSupabase(facts: Fact[]): Promise<void> {
  if (!useSupabase) return;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      console.warn('syncFactsWithSupabase: No authenticated user');
      return;
    }
    
    // За всеки факт, трябва да:
    // 1. Проверим дали вече съществува в базата
    // 2. Актуализираме го, ако съществува
    // 3. Създаваме го, ако не съществува
    
    for (const fact of facts) {
      // Търсим записа в Supabase по комбинация от потребител и факт
      const { data: factData } = await supabase
        .from('facts')
        .select('id')
        .eq('multiplicand', fact.i)
        .eq('multiplier', fact.j)
        .single();
      
      if (!factData?.id) {
        console.error('Could not find fact in database:', fact);
        continue;
      }
      
      // Проверяваме дали вече има запис за този потребител и факт
      const { data: existingUserFact } = await supabase
        .from('user_facts')
        .select('*')
        .eq('user_id', userId)
        .eq('fact_id', factData.id)
        .maybeSingle();
      
      // Ако съществува, актуализираме го
      if (existingUserFact) {
        await supabase
          .from('user_facts')
          .update({
            // Запазваме точно същата структура на данните!
            correct_count: fact.correctCount,
            incorrect_count: fact.wrongCount,
            streak: fact.streak,
            avg_time: fact.avgTime,
            attempts: fact.attempts,
            box: fact.box,
            last_practiced: fact.lastPracticed,
            next_practice: fact.nextPractice,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserFact.id);
      } else {
        // Ако не съществува, създаваме нов запис
        await supabase
          .from('user_facts')
          .insert({
            user_id: userId,
            fact_id: factData.id,
            correct_count: fact.correctCount,
            incorrect_count: fact.wrongCount,
            streak: fact.streak,
            avg_time: fact.avgTime,
            attempts: fact.attempts,
            box: fact.box,
            last_practiced: fact.lastPracticed,
            next_practice: fact.nextPractice,
            difficulty_rating: 5.0 // Начална стойност, ще се актуализира при следваща синхронизация
          });
      }
    }
    
    console.log('Facts successfully synced with Supabase');
  } catch (e) {
    console.error('Error syncing facts with Supabase:', e);
    useSupabase = false; // Изключваме Supabase при грешка
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
    
    // Стартираме асинхронно запазване в Supabase, без да чакаме
    if (useSupabase) {
      syncSessionWithSupabase(session).catch(e => {
        console.error('Failed to sync session with Supabase:', e);
      });
    }
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

/**
 * Асинхронно синхронизира сесия със Supabase
 */
async function syncSessionWithSupabase(session: Session): Promise<void> {
  if (!useSupabase) return;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      console.warn('syncSessionWithSupabase: No authenticated user');
      return;
    }
    
    // Създаваме нова сесия в Supabase
    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        start_time: session.startTime,
        end_time: session.endTime,
        fact_count: session.facts.length,
        correct_count: session.facts.filter(f => f.isCorrect).length,
        incorrect_count: session.facts.filter(f => !f.isCorrect).length,
        duration_seconds: session.durationSeconds
      })
      .select()
      .single();
    
    if (error || !newSession) {
      console.error('Error creating session in Supabase:', error);
      return;
    }
    
    // За всеки факт в сесията, добавяме запис в session_facts
    for (const factResponse of session.facts) {
      // Намираме факта в базата данни
      const { data: factData } = await supabase
        .from('facts')
        .select('id')
        .eq('multiplicand', factResponse.fact.i)
        .eq('multiplier', factResponse.fact.j)
        .single();
      
      if (!factData?.id) {
        console.error('Could not find fact in database:', factResponse.fact);
        continue;
      }
      
      // Добавяме запис в session_facts
      await supabase
        .from('session_facts')
        .insert({
          session_id: newSession.id,
          fact_id: factData.id,
          is_correct: factResponse.isCorrect,
          response_time_ms: factResponse.responseTime
        });
    }
    
    console.log('Session successfully synced with Supabase');
  } catch (e) {
    console.error('Error syncing session with Supabase:', e);
    useSupabase = false; // Изключваме Supabase при грешка
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

/**
 * Инициализира Supabase база данни със всички факти за таблицата за умножение
 * Тази функция се извиква еднократно, за да се инициализират факти при първо стартиране
 */
export async function initializeSupabaseFactsData(): Promise<void> {
  if (!useSupabase) return;
  
  try {
    // Проверяваме дали имаме някакви факти в базата данни
    const { count, error } = await supabase
      .from('facts')
      .select('*', { count: 'exact', head: true });
    
    // Ако вече имаме факти, пропускаме инициализацията
    if (!error && count && count > 0) {
      console.log(`Database already contains ${count} facts, skipping initialization.`);
      return;
    }
    
    console.log('Initializing Supabase facts database...');
    
    // Ако нямаме, добавяме всички факти от 1x1 до 9x9
    for (const fact of allFacts) {
      await supabase
        .from('facts')
        .insert({
          multiplicand: fact.i,
          multiplier: fact.j
        });
    }
    
    console.log('Supabase facts database initialized successfully.');
  } catch (e) {
    console.error('Error initializing Supabase facts database:', e);
    useSupabase = false; // Изключваме Supabase при грешка
  }
}

/**
 * Зарежда локалните факти от Supabase, ако localStorage е празен
 * Използва се за първоначално зареждане или при смяна на устройство
 */
export async function loadFactsFromSupabase(): Promise<Fact[] | null> {
  if (!useSupabase) return null;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      console.warn('loadFactsFromSupabase: No authenticated user');
      return null;
    }
    
    // Зареждаме всички факти с техните потребителски данни
    const { data: userFacts, error } = await supabase
      .from('user_facts')
      .select(`
        id,
        correct_count,
        incorrect_count,
        streak,
        avg_time,
        attempts,
        box,
        last_practiced,
        next_practice,
        facts!inner (*)
      `)
      .eq('user_id', userId);
    
    if (error || !userFacts) {
      console.error('Error loading facts from Supabase:', error);
      return null;
    }
    
    // Трансформираме данните в същия формат, който използваме локално
    const facts: Fact[] = userFacts.map(uf => ({
      i: uf.facts.multiplicand,
      j: uf.facts.multiplier,
      correctCount: uf.correct_count,
      wrongCount: uf.incorrect_count,
      streak: uf.streak,
      avgTime: uf.avg_time,
      attempts: uf.attempts,
      box: uf.box,
      lastPracticed: uf.last_practiced,
      nextPractice: uf.next_practice
    }));
    
    console.log(`Loaded ${facts.length} facts from Supabase`);
    return facts;
  } catch (e) {
    console.error('Error loading facts from Supabase:', e);
    useSupabase = false; // Изключваме Supabase при грешка
    return null;
  }
}
