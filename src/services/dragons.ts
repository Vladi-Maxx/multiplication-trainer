import { supabase } from './supabase';

// Тип за дракон от базата данни
export interface Dragon {
  id: string;
  name: string;
  image_path: string;
  unlock_requirement: number;
  unlocked: boolean;
  created_at: string;
}

/**
 * Зарежда всички дракони от базата данни
 */
export async function getAllDragons(): Promise<Dragon[]> {
  try {
    const { data, error } = await supabase
      .from('dragons')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Грешка при зареждане на дракони:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Грешка при извикване на getAllDragons:', error);
    return [];
  }
}

/**
 * Зарежда само отключените дракони
 */
export async function getUnlockedDragons(): Promise<Dragon[]> {
  try {
    const { data, error } = await supabase
      .from('dragons')
      .select('*')
      .eq('unlocked', true)
      .order('name');
    
    if (error) {
      console.error('Грешка при зареждане на отключени дракони:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Грешка при извикване на getUnlockedDragons:', error);
    return [];
  }
}

/**
 * Зарежда само заключените (неотключени) дракони
 */
export async function getLockedDragons(): Promise<Dragon[]> {
  try {
    const { data, error } = await supabase
      .from('dragons')
      .select('*')
      .eq('unlocked', false)
      .order('name');
    
    if (error) {
      console.error('Грешка при зареждане на заключени дракони:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Грешка при извикване на getLockedDragons:', error);
    return [];
  }
}

// Запазваме ID на последно използвания дракон, за да избегнем повторния му избор
let lastSelectedDragonId: string | null = null;

/**
 * Избира драконче за игра - първото неотключено или случайно отключено
 * @param forceNewDragon - ако е true, гарантира избирането на различен дракон от предишния
 */
export async function selectDragonForGame(forceNewDragon: boolean = true): Promise<Dragon | null> {
  try {
    // Първо опитваме да вземем неотключени дракони
    const lockedDragons = await getLockedDragons();
    
    // Ако има неотключени дракони, връщаме първия, който не е последно избрания
    if (lockedDragons.length > 0) {
      // Ако имаме повече от един заключен дракон и последно избрания е заключен,
      // избираме друг, различен от последния
      if (forceNewDragon && lockedDragons.length > 1 && lastSelectedDragonId) {
        const filteredDragons = lockedDragons.filter(d => d.id !== lastSelectedDragonId);
        if (filteredDragons.length > 0) {
          const selectedDragon = filteredDragons[0];
          lastSelectedDragonId = selectedDragon.id;
          return selectedDragon;
        }
      }
      
      // Ако няма как да изберем различен, връщаме първия
      const selectedDragon = lockedDragons[0];
      lastSelectedDragonId = selectedDragon.id;
      return selectedDragon;
    }
    
    // Ако всички са отключени, вземаме случаен от отключените, различен от последния
    const unlockedDragons = await getUnlockedDragons();
    if (unlockedDragons.length > 0) {
      // Ако имаме повече от един дракон и искаме да избегнем повторение
      if (forceNewDragon && unlockedDragons.length > 1 && lastSelectedDragonId) {
        const filteredDragons = unlockedDragons.filter(d => d.id !== lastSelectedDragonId);
        if (filteredDragons.length > 0) {
          const randomIndex = Math.floor(Math.random() * filteredDragons.length);
          const selectedDragon = filteredDragons[randomIndex];
          lastSelectedDragonId = selectedDragon.id;
          return selectedDragon;
        }
      }
      
      // Ако нямаме как да изберем различен, избираме случаен
      const randomIndex = Math.floor(Math.random() * unlockedDragons.length);
      const selectedDragon = unlockedDragons[randomIndex];
      lastSelectedDragonId = selectedDragon.id;
      return selectedDragon;
    }
    
    return null;
  } catch (error) {
    console.error('Грешка при избиране на драконче за игра:', error);
    return null;
  }
}

/**
 * Отключва драконче след успешна игра
 */
export async function unlockDragon(dragonId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dragons')
      .update({ unlocked: true })
      .eq('id', dragonId);
    
    if (error) {
      console.error('Грешка при отключване на дракон:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Грешка при извикване на unlockDragon:', error);
    return false;
  }
}

/**
 * Помощна функция, която конвертира път до изображение от базата данни
 * в пълен URL, който може да се използва в приложението
 */
export function getDragonImageUrl(dragon: Dragon | null): string {
  if (!dragon) return '';
  
  // Ако пътят започва с http или https, връщаме го директно
  if (dragon.image_path.startsWith('http')) {
    return dragon.image_path;
  }
  
  // Генерираме публичен URL чрез Supabase Storage
  const { data: { publicUrl } } = supabase.storage
    .from(dragon.image_path.split('/')[0]) // Вземаме името на бъкета (първата част от пътя)
    .getPublicUrl(dragon.image_path.split('/').slice(1).join('/')); // Останалата част от пътя
  
  return publicUrl;
}
