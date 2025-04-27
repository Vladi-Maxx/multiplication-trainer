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

  // Update fact statistics based on completed training
  let facts = loadFacts();
  // По-гъвкава Leitner карта (интервали в дни)
  // box 1: веднага, box 2: 0.2 дни (~5 часа), box 3: 1 ден, box 4: 2 дни, box 5: 4 дни
  const daysMap: Record<number, number> = {1:0, 2:0.2, 3:1, 4:2, 5:4};
  training.facts.forEach(fr => {
    const { fact: f, isCorrect, responseTime } = fr;
    const existing = facts.find(r => r.i === f.i && r.j === f.j);
    const record: Fact = existing
      ? { ...existing }
      : {
          i: f.i,
          j: f.j,
          correctCount: 0,
          wrongCount: 0,
          streak: 0,
          avgTime: 0,
          attempts: 0,
          box: 1,
          lastPracticed: new Date().toISOString(),
          nextPractice: new Date().toISOString(),
          difficultyRating: f.difficultyRating || 5.0
        };
    // Обновяване на статистики
    record.attempts += 1;
    if (isCorrect) {
      record.correctCount += 1;
      record.streak += 1;
    } else {
      record.wrongCount += 1;
      record.streak = 0;
    }
    record.avgTime = ((record.avgTime * (record.attempts - 1)) + responseTime) / record.attempts;
    record.difficultyRating = Math.max(1, Math.min(10, record.difficultyRating + (isCorrect ? -0.2 : 0.5)));

    // Логика за box и nextPractice:
    if (!isCorrect) {
      // При грешка: box 1 и веднага за упражнение
      record.box = 1;
      record.lastPracticed = new Date().toISOString();
      record.nextPractice = new Date().toISOString();
    } else if (isCorrect && record.streak >= 3) {
      // Ако streak >= 3 и верен: качваме box, интервал според box
      record.box = Math.min(record.box + 1, 5);
      record.lastPracticed = new Date().toISOString();
      record.nextPractice = new Date(Date.now() + daysMap[record.box] * 86400000).toISOString();
    } else if (isCorrect && record.streak < 3) {
      // Ако streak < 3: не местим box, но даваме кратък интервал (0.1 дни)
      record.lastPracticed = new Date().toISOString();
      record.nextPractice = new Date(Date.now() + 0.1 * 86400000).toISOString();
    }
    facts = [...facts.filter(r => !(r.i === f.i && r.j === f.j)), record];
  });
  // Обяснение:
  // - При грешка се връща box 1 и веднага се упражнява пак.
  // - При 3 поредни верни се качва box и се увеличава интервалът, но не твърде много.
  // - Ако streak < 3, дава се кратък интервал (около 2.4 часа), за да не се губи мотивация и да има повече "due" факти.
  // Persist updated facts and sync once
  saveFacts(facts);
  if (useSupabase) {
    syncFactsWithSupabase(facts).catch(e => console.error('finishTraining: Error syncing facts:', e));
  }

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
      nextPractice: now,
      difficultyRating: 5.0
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
      if (r.difficultyRating == null) r.difficultyRating = 5.0;
    });
    // default nextPractice based on Leitner intervals
    const intervalMap: Record<number, number> = {1:0,2:1,3:2,4:4,5:7};
    arr.forEach(r => {
      if (!r.nextPractice || isNaN(Date.parse(r.nextPractice))) {
        const days = intervalMap[r.box as number] ?? 0;
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
        difficulty_rating: fact.difficultyRating
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
 * Функция за изчистване на всички данни в localStorage
 * Може да се използва чрез конзола или бутон в UI, ако се добави такъв
 */
export function clearAllStorageData(): void {
  try {
    localStorage.clear();
    console.log('All local storage data has been cleared');
  } catch (e) {
    console.error('Failed to clear local storage:', e);
  }
}
