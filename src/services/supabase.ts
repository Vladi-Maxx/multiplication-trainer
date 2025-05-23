import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Добавяме типа на Vite environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_USER_EMAIL: string;
  readonly VITE_SUPABASE_USER_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Вземаме настройките от средата - така поддържаме различни среди (dev, test, prod)
// Добавяме fallback стойности, но показваме предупреждения за липсващи променливи

// Фиксирани стойности за локална разработка
const FALLBACK_URL = 'https://sbbrgyohnwoyrseqcitl.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYnJneW9obndveXJzZXFjaXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDMxNDMsImV4cCI6MjA2MDk3OTE0M30.7LrNtmIRjDxJ2U9twGw4Xwt-xtDdcpc4h1JxrAiJQF4';

// Опитваме да вземем стойностите от .env
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('Липсва VITE_SUPABASE_URL в .env файла! Използваме fallback стойност.');
  supabaseUrl = FALLBACK_URL;
}

let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  console.error('Липсва VITE_SUPABASE_ANON_KEY в .env файла! Използваме fallback стойност.');
  supabaseAnonKey = FALLBACK_KEY;
}

// Създаваме Supabase клиент
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Инициализира потребителска сесия
 * За момента използваме фиксиран потребител (Гришо с проста парола)
 */
export async function initializeSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Ако вече имаме валидна сесия, не правим нищо
  if (session) {
    
    return true;
  }

  // Използваме реален потребител вместо анонимна автентикация
  try {
    console.log('Опитвам влизане с имейл/парола...');
    
    // Използваме реален имейл и парола
    // Имейл и парола се четат от .env файла (VITE_SUPABASE_USER_EMAIL, VITE_SUPABASE_USER_PASSWORD)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: import.meta.env.VITE_SUPABASE_USER_EMAIL!,
      password: import.meta.env.VITE_SUPABASE_USER_PASSWORD!
    });
    
    if (error) {
      // Ако потребителят не съществува, опитваме да го създадем
      if (error.message.includes('Invalid login credentials')) {
        console.log('Потребителят не съществува, опитвам регистрация...');
        // Имейл и парола се четат от .env файла (VITE_SUPABASE_USER_EMAIL, VITE_SUPABASE_USER_PASSWORD)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: import.meta.env.VITE_SUPABASE_USER_EMAIL!,
          password: import.meta.env.VITE_SUPABASE_USER_PASSWORD!,
          options: {
            data: {
              name: 'Влади'
            }
          }
        });
        
        if (signUpError) {
          console.error('Грешка при регистрация:', signUpError);
          return false;
        }
        
        
        return true;
      } else {
        console.error('Грешка при влизане:', error);
        return false;
      }
    }
    
    
    return true;
  } catch (e) {
    console.error('Грешка при автентикация:', e);
    return false;
  }
}

/**
 * Връща текущия потребителски ID или null ако няма такъв
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

/**
 * Зарежда всички факти от умножение
 */
export async function getAllFacts() {
  const { data, error } = await supabase
    .from('facts')
    .select('*')
    .order('multiplicand', { ascending: true })
    .order('multiplier', { ascending: true });
  
  if (error) {
    console.error('Error loading facts:', error);
    return [];
  }
  
  return data;
}

/**
 * Зарежда факти по умножение с тяхната персонализирана информация за текущия потребител
 */
export async function getUserFacts() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('facts')
    .select(`
      id, 
      multiplicand, 
      multiplier,
      user_facts!inner (
        correct_count,
        incorrect_count,
        difficulty_rating,
        last_seen_at
      )
    `)
    .eq('user_facts.user_id', userId)
    .order('multiplicand', { ascending: true })
    .order('multiplier', { ascending: true });
  
  if (error) {
    console.error('Error loading user facts:', error);
    return [];
  }
  
  return data;
}

/**
 * Стартира нова сесия и връща нейното ID
 */
export async function startSession() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ user_id: userId }])
    .select()
    .single();
  
  if (error) {
    console.error('Error starting session:', error);
    return null;
  }
  
  return data.id;
}

/**
 * Завършва сесия със събраните данни
 */
export async function completeSession(
  sessionId: string, 
  { factCount, correctCount, incorrectCount }: { 
    factCount: number, 
    correctCount: number, 
    incorrectCount: number 
  }
) {
  const endTime = new Date();
  
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('start_time')
    .eq('id', sessionId)
    .single();
  
  if (sessionError) {
    console.error('Error getting session start time:', sessionError);
    return;
  }
  
  const startTime = new Date(session.start_time);
  const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
  
  const { error } = await supabase
    .from('sessions')
    .update({
      end_time: endTime.toISOString(),
      fact_count: factCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      duration_seconds: durationSeconds
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Error completing session:', error);
  }
}

/**
 * Записва отговор на факт в рамките на сесия
 */
export async function recordFactResponse(
  sessionId: string,
  factId: string,
  isCorrect: boolean,
  responseTimeMs: number
) {
  // Записваме отговора в session_facts и взимаме потребител
  const { error: sessionFactError } = await supabase
    .from('session_facts')
    .insert([{ session_id: sessionId, fact_id: factId, is_correct: isCorrect, response_time_ms: responseTimeMs }])
    .select();
  if (sessionFactError) console.error('Error recording session fact:', sessionFactError);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userError || !userId) {
    console.error('Error getting user or no user:', userError);
    return;
  }

  // Вземаме съществуващите стойности от user_facts
  const { data: existingUserFact, error: existingError } = await supabase
    .from('user_facts')
    .select('correct_count, incorrect_count, difficulty_rating')
    .eq('user_id', userId)
    .eq('fact_id', factId)
    .maybeSingle();
  if (existingError) {
    console.error('Error fetching user_fact:', existingError);
    return;
  }

  const newCorrect = (existingUserFact?.correct_count || 0) + (isCorrect ? 1 : 0);
  const newIncorrect = (existingUserFact?.incorrect_count || 0) + (isCorrect ? 0 : 1);
  const newDifficulty = existingUserFact
    ? Math.max(1, Math.min(10, existingUserFact.difficulty_rating + (isCorrect ? -0.2 : 0.5)))
    : 5 + (isCorrect ? -0.2 : 0.5);

  const userFactPayload = {
    user_id: userId,
    fact_id: factId,
    correct_count: newCorrect,
    incorrect_count: newIncorrect,
    last_seen_at: new Date().toISOString(),
    difficulty_rating: newDifficulty
  };

  const { data: upsertData, error: userFactError } = await supabase
    .from('user_facts')
    .upsert([userFactPayload], { onConflict: 'user_id,fact_id' })
    .select();
  if (userFactError) {
    console.error('Error upserting user_facts:', JSON.stringify(userFactError, null, 2), 'data:', upsertData);
  } else {
    
  }
}
import { Training } from './types';

/**
 * Записва тренировка в таблицата trainings в Supabase
 */
export async function saveTrainingToSupabase(training: Training): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('saveTrainingToSupabase: Няма автентикиран потребител');
      return false;
    }
    
    // Използваме стандартни ISO дати за запис в Supabase
    // Форматирането в български формат ще се прави само при визуализация
    const { error } = await supabase.from('trainings').insert([
      {
        user_id: userId,
        started_at: training.startedAt,
        finished_at: training.finishedAt,
        facts: training.facts,
        score: training.score,
        total_time: training.totalResponseTime,
        status: training.status,
        created_at: new Date().toISOString()
      }
    ]);
    if (error) {
      console.error('saveTrainingToSupabase: Грешка при запис в Supabase', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('saveTrainingToSupabase: Exception', e);
    return false;
  }
}