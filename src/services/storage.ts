import type { Fact, Session } from './types';
import type { Training, FactResponse, TrainingStatus } from './types';
import { allFacts } from '../utils/facts';
import { supabase } from './supabase';

// Флаг, който показва дали се използва Supabase или не
// Това позволява лесно превключване между режими и обработка на офлайн случаи
let useSupabase = true;

// ====== TRAININGS LOCAL STORAGE API ======

const TRAININGS_KEY = 'trainings';
const CURRENT_TRAINING_KEY = 'current_training';

export function startTraining(): Training {
  const training: Training = {
    id: `training_${new Date().toISOString().replace(/[:.]/g, '_')}`,
    startedAt: new Date().toISOString(),
    facts: [],
    score: 0,
    totalResponseTime: 0,
    status: 'in_progress',
  };
  localStorage.setItem(CURRENT_TRAINING_KEY, JSON.stringify(training));
  return training;
}

export function getCurrentTraining(): Training | null {
  const raw = localStorage.getItem(CURRENT_TRAINING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Training;
  } catch (e) {
    console.error('getCurrentTraining: failed to parse', e);
    return null;
  }
}

export function addFactToCurrentTraining(factResponse: FactResponse): void {
  const training = getCurrentTraining();
  if (!training || training.status !== 'in_progress') return;
  training.facts.push(factResponse);
  training.score += factResponse.isCorrect ? 1 : 0;
  training.totalResponseTime += factResponse.responseTime;
  localStorage.setItem(CURRENT_TRAINING_KEY, JSON.stringify(training));
}

export function finishTraining(): void {
  const training = getCurrentTraining();
  if (!training || training.status !== 'in_progress') return;
  training.status = 'completed';
  training.finishedAt = new Date().toISOString();
  // Записваме в масива trainings
  const raw = localStorage.getItem(TRAININGS_KEY);
  let trainings: Training[] = [];
  if (raw) {
    try {
      trainings = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    } catch (e) {
      trainings = [];
    }
  }
  trainings.push(training);
  localStorage.setItem(TRAININGS_KEY, JSON.stringify(trainings));
  localStorage.removeItem(CURRENT_TRAINING_KEY);

  // Асинхронно записваме тренировката и в Supabase, ако е активен
  if (useSupabase) {
    import('./supabase').then(({ saveTrainingToSupabase }) => {
      saveTrainingToSupabase(training).then(success => {
        if (!success) {
          console.error('finishTraining: Неуспешен запис на тренировка в Supabase');
        }
      }).catch(e => {
        console.error('finishTraining: Грешка при запис в Supabase:', e);
      });
    });
  }
}

export function getTrainings(): Training[] {
  const raw = localStorage.getItem(TRAININGS_KEY);
  if (!raw) return [];
  try {
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
// ====== END TRAININGS API ======

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
      
      // Upsert user_facts: insert or update in one call with valid columns
      const userFactData = {
        user_id: userId,
        fact_id: factData.id,
        correct_count: fact.correctCount,
        incorrect_count: fact.wrongCount,
        last_seen_at: fact.lastPracticed,
        difficulty_rating: fact.avgTime ? fact.avgTime / 1000 : 5.0
      };
      const { data: ufData, error: ufError } = await supabase
        .from('user_facts')
        .upsert([userFactData], { onConflict: 'user_id,fact_id' })
        .select();
      if (ufError) {
        console.error('syncFacts: Error upserting user_facts:', ufError);
      } else {
        
      }
    }
    
    
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
   // Log at entry

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

      try {
        const sessionFactData = {
          session_id: newSession.id,
          fact_id: factData.id,
          is_correct: factResponse.isCorrect,
          response_time_ms: Math.round(factResponse.responseTime * 1000) // <-- Връщаме оригиналното име
        };
        
        const { error: sessionFactError } = await supabase
          .from('session_facts')
          .insert([sessionFactData])
          .select();

        if (sessionFactError) {
          console.error('Error inserting into session_facts:', sessionFactError);
        } else {
          
        }
      } catch (error) {
        console.error('Error during session_facts insert operation:', error);
      }

      try {
        const userFactData = {
          user_id: userId,
          fact_id: factData.id,
          correct_count: factResponse.fact.correctCount,
          incorrect_count: factResponse.fact.wrongCount,
          last_seen_at: factResponse.fact.lastPracticed,
          difficulty_rating: factResponse.fact.avgTime ? factResponse.fact.avgTime / 1000 : 5.0
        };
        
        // Upsert user_facts to handle insert or update in one call with detailed logging
        try {
          const { data: ufData, error: userFactError, status: ufStatus } = await supabase
            .from('user_facts')
            .upsert([userFactData], { onConflict: 'user_id,fact_id', ignoreDuplicates: false })
            .select();
          if (userFactError) {
            console.error('Error upserting user_facts:', JSON.stringify(userFactError, null, 2), 'status:', ufStatus, 'response:', ufData);
          } else {
            
          }
        } catch (e) {
          console.error('Exception upserting user_facts:', e);
        }
      } catch (error) {
        console.error('Error during user_facts upsert operation:', error);
      }
    }

    
  } catch (error) {
    console.error('>>> CATCH block: Error during the overall session sync process:', JSON.stringify(error, null, 2));
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
      
      return;
    }
    
    
    
    // Ако нямаме, добавяме всички факти от 1x1 до 9x9
    for (const fact of allFacts) {
      await supabase
        .from('facts')
        .insert({
          multiplicand: fact.i,
          multiplier: fact.j
        });
    }
    
    
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
    
    
    return facts;
  } catch (e) {
    console.error('Error loading facts from Supabase:', e);
    useSupabase = false; // Изключваме Supabase при грешка
    return null;
  }
}
