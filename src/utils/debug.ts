/**
 * Помощни функции за дебъгване и тестване
 */

/**
 * Изчиства всички данни от localStorage, свързани с приложението
 */
export function clearAllLocalStorage(): void {
  // Списък със всички ключове, които използваме в localStorage
  const keys = [
    'facts',
    'current_training',
    'trainings',
    'sessions'
  ];
  
  // Изчистваме всеки ключ
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Изчистен localStorage ключ: ${key}`);
  });
  
  console.log('Всички данни от localStorage са изчистени успешно');
}
