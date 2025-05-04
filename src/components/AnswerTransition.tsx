import React, { useState, useEffect, useRef } from 'react';

// Интерфейс за пропъртитата на компонента
interface AnswerTransitionProps {
  wrongAnswer: string;
  correctAnswer: number;
  onComplete: () => void;
}

// Асинхронна функция за изчакване
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Компонент за показване на анимиран преход от грешен към верен отговор
const AnswerTransition: React.FC<AnswerTransitionProps> = ({
  wrongAnswer,
  correctAnswer,
  onComplete,
}) => {
  // Преобразуваме правилния отговор в стринг
  const correctAnswerStr = correctAnswer.toString();
  // Определяме максималната дължина, за да подравним стринговете
  const maxLength = Math.max(wrongAnswer.length, correctAnswerStr.length);
  // Добавяме водещи нули, ако е необходимо
  const paddedWrongAnswer = wrongAnswer.padStart(maxLength, '0');
  const paddedCorrectAnswer = correctAnswerStr.padStart(maxLength, '0');

  // Състояние за текущо показваните цифри
  const [displayedDigits, setDisplayedDigits] = useState<string[]>(paddedWrongAnswer.split(''));
  // Състояние за индекса на текущо анимираната цифра
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  // Състояние за индекса на завършилите анимацията цифри (за оцветяване в зелено)
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());

  // Референция, за да избегнем стартиране на ефекта при всяко рендиране
  const hasAnimated = useRef(false);

  // useEffect за стартиране на анимацията при зареждане на компонента
  useEffect(() => {
    // Проверяваме дали анимацията вече е стартирала
    if (hasAnimated.current) return;
    hasAnimated.current = true; // Отбелязваме, че анимацията е стартирала

    const animate = async () => {
      const newCompletedIndices = new Set<number>();
      // Итерираме през всяка цифра отляво надясно
      for (let i = 0; i < maxLength; i++) {
        setAnimatingIndex(i); // Отбелязваме текущо анимираната цифра

        const startDigit = parseInt(paddedWrongAnswer[i]);
        const endDigit = parseInt(paddedCorrectAnswer[i]);

        // Ако цифрата вече е вярна, прескачаме анимацията за нея
        if (startDigit === endDigit) {
          await wait(100); // Кратка пауза за визуален ефект
          newCompletedIndices.add(i);
          setCompletedIndices(new Set(newCompletedIndices));
          continue; // Преминаваме към следващата цифра
        }

        // Изчисляваме броя стъпки напред и назад
        const forwardSteps = (endDigit - startDigit + 10) % 10;
        const backwardSteps = (startDigit - endDigit + 10) % 10;

        let currentDigit = startDigit;
        const digitSequence: number[] = [];

        // Определяме най-краткия път и генерираме последователността
        if (forwardSteps <= backwardSteps) {
          // Въртене напред
          for (let step = 0; step <= forwardSteps; step++) {
            digitSequence.push((startDigit + step) % 10);
          }
        } else {
          // Въртене назад
          for (let step = 0; step <= backwardSteps; step++) {
            digitSequence.push((startDigit - step + 10) % 10);
          }
        }

        // Анимираме въртенето на цифрата
        for (const digit of digitSequence) {
          setDisplayedDigits(prev => {
            const newDigits = [...prev];
            newDigits[i] = digit.toString();
            return newDigits;
          });
          await wait(240); // Скорост на въртене на цифрата (увеличена от 120ms на 240ms)
        }

        // Добавяме индекса към завършените, за да стане зелен
        newCompletedIndices.add(i);
        setCompletedIndices(new Set(newCompletedIndices));
        await wait(500); // Пауза след завършване на една цифра (увеличена от 250ms на 500ms)
      }

      // Всички цифри са анимирани
      setAnimatingIndex(null); // Премахваме подсветката
      await wait(2000); // Изчакваме 2 секунди преди да извикаме onComplete
      onComplete(); // Извикваме callback функцията
    };

    animate();
    // Не добавяме зависимости, за да се изпълни само веднъж
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="answer-transition flex justify-center items-center my-4" style={{ minHeight: '40px' }}>
      {displayedDigits.map((digit, index) => (
        <span
          key={index}
          className={`digit text-6xl font-bold mx-1 p-1 rounded transition-all duration-200 ease-in-out ${
            animatingIndex === index
              ? 'bg-yellow-300 scale-110' // Стил за анимираща се цифра
              : completedIndices.has(index)
              ? 'text-green-500' // Стил за правилна цифра
              : 'text-orange-500' // Стил за първоначална/грешна цифра
          }`}
        >
          {digit}
        </span>
      ))}
    </div>
  );
};

export default AnswerTransition; 