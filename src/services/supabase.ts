import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Вземаме настройките от средата - така поддържаме различни среди (dev, test, prod)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '***REMOVED***';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '***REMOVED***';

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
    console.log('Вече имаме активна сесия за потребител:', session.user.email);
    return true;
  }

  // Използваме реален потребител вместо анонимна автентикация
  try {
    console.log('Опитвам влизане с имейл/парола...');
    
    // Използваме реален имейл и парола
    const { data, error } = await supabase.auth.signInWithPassword({
      email: '***REMOVED***',
      password: '***REMOVED***'
    });
    
    if (error) {
      // Ако потребителят не съществува, опитваме да го създадем
      if (error.message.includes('Invalid login credentials')) {
        console.log('Потребителят не съществува, опитвам регистрация...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: '***REMOVED***',
          password: '***REMOVED***',
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
        
        console.log('Потребителят е създаден успешно! Проверете имейла си за потвърждение.');
        return true;
      } else {
        console.error('Грешка при влизане:', error);
        return false;
      }
    }
    
    console.log('Успешно влизане като:', data.user?.email);
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
  // Записваме отговора в текущата сесия
  const { error: sessionFactError } = await supabase
    .from('session_facts')
    .insert([{
      session_id: sessionId,
      fact_id: factId,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs
    }]);
  
  if (sessionFactError) {
    console.error('Error recording session fact:', sessionFactError);
  }
  
  // Обновяваме user_facts информацията за този факт
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  
  if (!userId) return;
  
  // Проверяваме дали вече има запис за този факт
  const { data: existingUserFact, error: existingFactError } = await supabase
    .from('user_facts')
    .select('*')
    .eq('user_id', userId)
    .eq('fact_id', factId)
    .maybeSingle();
  
  if (existingFactError) {
    console.error('Error checking user fact:', existingFactError);
    return;
  }
  
  if (existingUserFact) {
    // Ако има запис, обновяваме го
    const { error: updateError } = await supabase
      .from('user_facts')
      .update({
        correct_count: existingUserFact.correct_count + (isCorrect ? 1 : 0),
        incorrect_count: existingUserFact.incorrect_count + (isCorrect ? 0 : 1),
        last_seen_at: new Date().toISOString(),
        // Актуализираме рейтинга за трудност - намаляваме го при правилен отговор, увеличаваме при грешен
        difficulty_rating: Math.max(
          1,
          Math.min(
            10,
            existingUserFact.difficulty_rating + (isCorrect ? -0.2 : 0.5)
          )
        ),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUserFact.id);
    
    if (updateError) {
      console.error('Error updating user fact:', updateError);
    }
  } else {
    // Ако няма запис, създаваме нов
    const { error: insertError } = await supabase
      .from('user_facts')
      .insert([{
        user_id: userId,
        fact_id: factId,
        correct_count: isCorrect ? 1 : 0,
        incorrect_count: isCorrect ? 0 : 1,
        last_seen_at: new Date().toISOString(),
        // Стартов рейтинг за трудност - 5 е среден
        difficulty_rating: 5 + (isCorrect ? -0.2 : 0.5)
      }]);
    
    if (insertError) {
      console.error('Error inserting user fact:', insertError);
    }
  }
}
