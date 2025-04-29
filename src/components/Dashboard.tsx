import React, { useState, useEffect, useRef } from 'react';
import { supabase, getCurrentUserId } from '../services/supabase';
import { Chart, registerables } from 'chart.js';
import FactsStats from './FactsStats';

// Регистрираме компонентите на Chart.js
Chart.register(...registerables);

interface DashboardProps {
  onClose: () => void;
}

// Интерфейс съответстващ на таблицата trainings в Supabase
interface Training {
  id: string;
  user_id: string;
  started_at: string;
  finished_at: string | null;
  facts: any | null;
  score: number;
  total_time: number;
  status: string;
  created_at: string;
}

interface UserFact {
  id: string;
  user_id: string;
  fact_id: string;
  difficulty_rating: number;
  correct_count: number;
  incorrect_count: number;
  facts?: {
    id: string;
    multiplicand: number;
    multiplier: number;
  }
}

interface Fact {
  id: string;
  multiplicand: number;
  multiplier: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFacts, setUserFacts] = useState<UserFact[]>([]);
  const [allFacts, setAllFacts] = useState<Fact[]>([]);
  const [tooltipInfo, setTooltipInfo] = useState<{ visible: boolean, x: number, y: number, content: React.ReactNode }>({ 
    visible: false, 
    x: 0, 
    y: 0, 
    content: null 
  });
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalProblems: 0,
    averageAccuracy: 0,
    averageTimePerProblem: 0,
    bestAccuracy: 0,
    longestTraining: 0,
    masteredFacts: 0,
    inProgressFacts: 0,
    challengingFacts: 0,
  });
  
  // Референции за графиките
  const trainingsChartRef = useRef<HTMLCanvasElement>(null);
  const accuracyChartRef = useRef<HTMLCanvasElement>(null);
  const trainingsChartInstance = useRef<Chart | null>(null);
  const accuracyChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    console.log('Компонентът е монтиран, проверяваме референциите:', {
      trainingsChartRef: !!trainingsChartRef.current,
      accuracyChartRef: !!accuracyChartRef.current
    });
    
    fetchTrainingData();
    
    // Почистваме графиките при размонтиране
    return () => {
      if (trainingsChartInstance.current) {
        trainingsChartInstance.current.destroy();
      }
      if (accuracyChartInstance.current) {
        accuracyChartInstance.current.destroy();
      }
    };
  }, []);
  
  // Допълнителен useEffect за проверка на референциите и рендериране на графиките
  useEffect(() => {
    if (trainings.length > 0 && trainingsChartRef.current && accuracyChartRef.current) {
      console.log('Референциите и данните са налични, рендерираме графиките');
      // Изчакваме малко, за да сме сигурни, че DOM е готов
      setTimeout(() => {
        renderCharts(trainings);
      }, 100);
    }
  }, [trainings, trainingsChartRef.current, accuracyChartRef.current]);
  
  // Нов метод: изчисляваме статистики на фактите от trainings
  const calculateFactsStats = (trainingsData: Training[]) => {
    const statsMap: Record<string, { id: string, multiplicand: number, multiplier: number, correctCount: number, incorrectCount: number, attempts: number, difficultyRating: number, lastSeen: string | null }> = {};
    const sorted = [...trainingsData].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    
    console.log("Данни за тренировка:", sorted[0]?.facts?.[0]);
    
    for (const tr of sorted) {
      if (!tr.facts || !Array.isArray(tr.facts)) continue;
      for (const fr of tr.facts) {
        // Проверяваме различни варианти на достъп до данните
        console.log("Структура на факт в тренировка:", fr);
        
        let multiplicand = 0, multiplier = 0;
        
        // Проверяваме за различни възможни структури на данните
        if (fr.fact?.multiplicand !== undefined && fr.fact?.multiplier !== undefined) {
          multiplicand = fr.fact.multiplicand;
          multiplier = fr.fact.multiplier;
        } else if (fr.fact?.i !== undefined && fr.fact?.j !== undefined) {
          multiplicand = fr.fact.i;
          multiplier = fr.fact.j;
        }
        
        if (multiplicand === 0 || multiplier === 0) {
          console.error("Не успяхме да намерим множителите в структурата:", fr);
          continue;
        }
        
        const key = `${multiplicand}x${multiplier}`;
        if (!statsMap[key]) statsMap[key] = { 
          id: fr.fact?.id || "", 
          multiplicand: multiplicand, 
          multiplier: multiplier, 
          correctCount: 0, 
          incorrectCount: 0, 
          attempts: 0, 
          difficultyRating: 5, 
          lastSeen: null 
        };
        
        const s = statsMap[key];
        s.attempts++;
        if (fr.isCorrect) { 
          s.correctCount++; 
          s.difficultyRating = Math.max(1, s.difficultyRating - 0.2); 
        } else { 
          s.incorrectCount++; 
          s.difficultyRating = Math.min(10, s.difficultyRating + 0.5); 
        }
        s.lastSeen = tr.started_at;
      }
    }
    
    const result = Object.values(statsMap).map(s => ({
      id: s.id, 
      user_id: '', 
      fact_id: s.id, 
      difficulty_rating: s.difficultyRating,
      correct_count: s.correctCount, 
      incorrect_count: s.incorrectCount,
      facts: { 
        id: s.id, 
        multiplicand: s.multiplicand, 
        multiplier: s.multiplier 
      }
    }));
    
    console.log("Изчислени статистики за факти:", result);
    return result;
  };

  const fetchTrainingData = async () => {
    try {
      console.log('Започваме извличане на данни за тренировките');
      setLoading(true);
      
      // Проверяваме дали Supabase е инициализиран правилно
      console.log('Статус на Supabase клиент:', !!supabase);
      
      // Проверяваме дали можем да направим проста заявка към Supabase
      try {
        const { data: testData, error: testError } = await supabase.from('facts').select('count');
        console.log('Тестова заявка към Supabase:', {
          успешна: !testError,
          грешка: testError ? testError.message : 'няма'
        });
      } catch (e) {
        console.error('Грешка при тестова заявка към Supabase:', e);
      }
      
      const userId = await getCurrentUserId();
      console.log('Получен потребителски ID:', userId);
      
      if (!userId) {
        console.error('Няма потребителски ID');
        setError('Потребителят не е влязъл в системата');
        setLoading(false);
        return;
      }

      // Извличаме тренировките за текущия потребител
      console.log('Извличаме тренировки за потребител:', userId);
      
      try {
        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        console.log('Резултат от заявката:', { 
          данни: !!data, 
          брой: data?.length, 
          грешка: error 
        });

        if (error) {
          console.error('Грешка при извличане на тренировки:', error);
          throw error;
        }
        
        // Преобразуваме facts от JSON в масив, ако е необходимо
        const processedData = (data || []).map(training => {
          if (training.facts && typeof training.facts === 'string') {
            try {
              return {
                ...training,
                facts: JSON.parse(training.facts)
              };
            } catch (e) {
              console.error('Грешка при парсване на facts:', e);
              return training;
            }
          }
          return training;
        });
        
        // Зареждаме всички факти за heatmap
        const { data: allFactsData, error: allFactsError } = await supabase
          .from('facts').select('*').lte('multiplicand', 10).lte('multiplier', 10);
        if (allFactsError) throw allFactsError;
        setAllFacts(allFactsData || []);

        setTrainings(processedData);
        calculateStats(processedData);
        renderCharts(processedData);
        
        // Статистики на фактите от trainings
        const calculatedUserFacts = calculateFactsStats(processedData);
        console.log("Изчислени факти от тренировки:", calculatedUserFacts);
        setUserFacts(calculatedUserFacts);
        const mastered = calculatedUserFacts.filter(f => f.difficulty_rating < 3).length;
        const inProgress = calculatedUserFacts.filter(f => f.difficulty_rating >= 3 && f.difficulty_rating <= 6).length;
        const challenging = calculatedUserFacts.filter(f => f.difficulty_rating > 6).length;
        setStats(prev => ({ ...prev, masteredFacts: mastered, inProgressFacts: inProgress, challengingFacts: challenging }));
        
        setLoading(false);
      } catch (dbError) {
        console.error('Грешка при изпълнение на заявката:', dbError);
        setError('Възникна грешка при зареждане на данните');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Грешка при зареждане на данни за тренировките:', err);
      setError('Възникна грешка при зареждане на данните');
      setLoading(false);
    }
  };

  // Подготвяне на данни и рендериране на графики
  const renderCharts = (data: Training[]) => {
    console.log('Започваме рендериране на графики', {
      имаДанни: !!data,
      бройДанни: data?.length,
      имаTrainingsChart: !!trainingsChartRef.current,
      имаAccuracyChart: !!accuracyChartRef.current
    });
    
    if (!data || data.length === 0 || !trainingsChartRef.current || !accuracyChartRef.current) {
      console.log('Няма данни или референции за графиките');
      return;
    }
    
    console.log('Данни за графики:', data);
    
    // Групираме тренировките по дни
    const trainingsByDay = data.reduce((acc, training) => {
      if (!training.started_at) return acc;
      
      // Форматиране на датата във формат YYYY-MM-DD
      const date = new Date(training.started_at).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          totalCorrect: 0,
          totalProblems: 0
        };
      }
      
      // Броим тренировките за този ден
      acc[date].count++;
      
      // Смятаме правилните отговори и общия брой задачи за този ден
      if (training.facts) {
        try {
          // Проверяваме дали facts е масив или JSON стринг
          const factsArray = Array.isArray(training.facts) 
            ? training.facts 
            : (typeof training.facts === 'string' 
                ? JSON.parse(training.facts) 
                : training.facts);
          
          if (Array.isArray(factsArray)) {
            const correctCount = factsArray.filter(fact => fact.isCorrect).length;
            acc[date].totalCorrect += correctCount;
            acc[date].totalProblems += factsArray.length;
          }
        } catch (e) {
          console.error('Грешка при обработка на facts:', e);
        }
      }
      
      return acc;
    }, {} as Record<string, { count: number, totalCorrect: number, totalProblems: number }>);
    
    // Подготвяме данните за графиките, сортирани по дата
    const sortedDates = Object.keys(trainingsByDay).sort();
    const formattedDates = sortedDates.map(date => {
      // Форматираме датата за показване като dd.MM
      const [year, month, day] = date.split('-');
      return `${day}.${month}`;
    });
    
    const trainingCounts = sortedDates.map(date => trainingsByDay[date].count);
    
    const accuracyData = sortedDates.map(date => {
      const dayData = trainingsByDay[date];
      return dayData.totalProblems > 0 
        ? Math.round((dayData.totalCorrect / dayData.totalProblems) * 100)
        : 0;
    });
    
    // Графика за брой тренировки по дни
    if (trainingsChartInstance.current) {
      trainingsChartInstance.current.destroy();
    }
    
    const trainingsCtx = trainingsChartRef.current.getContext('2d');
    trainingsChartInstance.current = new Chart(trainingsCtx!, {
      type: 'bar',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'Брой тренировки',
          data: trainingCounts,
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
    
    // Графика за точност по дни
    if (accuracyChartInstance.current) {
      accuracyChartInstance.current.destroy();
    }
    
    const accuracyCtx = accuracyChartRef.current.getContext('2d');
    accuracyChartInstance.current = new Chart(accuracyCtx!, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'Точност (%)',
          data: accuracyData,
          fill: false,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          tension: 0.4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: '%'
            }
          }
        }
      }
    });
  };
  
  const calculateStats = (data: Training[]) => {
    if (!data || data.length === 0) {
      return;
    }

    const totalTrainings = data.length;
    
    // Изчисляваме общия брой задачи от всички тренировки
    const totalProblems = data.reduce((sum, t) => {
      if (!t.facts) return sum;
      return sum + (Array.isArray(t.facts) ? t.facts.length : 0);
    }, 0);
    
    // Изчисляване на средна точност (правилни отговори / общо задачи)
    const totalCorrect = data.reduce((sum, t) => {
      if (!t.facts) return sum;
      const facts = Array.isArray(t.facts) ? t.facts : [];
      return sum + facts.filter(fact => fact.isCorrect).length;
    }, 0);
    
    const averageAccuracy = totalProblems > 0 
      ? Math.round((totalCorrect / totalProblems) * 100) 
      : 0;
    
    // Изчисляване на средно време за отговор (в секунди)
    const totalTime = data.reduce((sum, t) => sum + (t.total_time || 0), 0);
    const averageTimePerProblem = totalProblems > 0 
      ? parseFloat((totalTime / totalProblems).toFixed(2)) 
      : 0;
    
    // Намиране на най-висока точност в тренировка
    const bestAccuracy = data.reduce((best, t) => {
      if (!t.facts) return best;
      const facts = Array.isArray(t.facts) ? t.facts : [];
      if (facts.length === 0) return best;
      
      const correctCount = facts.filter(fact => fact.isCorrect).length;
      const accuracy = (correctCount / facts.length) * 100;
      return accuracy > best ? accuracy : best;
    }, 0);
    
    // Най-дълга тренировка (в минути)
    const longestTraining = data.reduce(
      (longest, t) => Math.max(longest, t.total_time || 0), 
      0
    ) / 60; // превръщаме в минути

    setStats({
      totalTrainings,
      totalProblems,
      averageAccuracy,
      averageTimePerProblem,
      bestAccuracy: Math.round(bestAccuracy),
      longestTraining: parseFloat(longestTraining.toFixed(1)),
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Неизвестна дата';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 сек.';
    if (seconds < 60) return `${Math.round(seconds)} сек.`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} мин. ${remainingSeconds} сек.`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Родителски дашборд</h1>
          <button 
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center"
          >
            <span className="mr-2">Назад към играта</span>
            <span>⬅️</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p>Зареждане на данни...</p>
          </div>
        ) : (
          <>
            {/* Обща статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Общ преглед</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Тренировки</span>
                    <span className="font-medium">{stats.totalTrainings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Общо задачи</span>
                    <span className="font-medium">{stats.totalProblems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Средна точност</span>
                    <span className="font-medium">{stats.averageAccuracy}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Време</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Средно време за задача</span>
                    <span className="font-medium">{stats.averageTimePerProblem} сек</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Най-дълга тренировка</span>
                    <span className="font-medium">{stats.longestTraining} мин</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Най-добра точност</span>
                    <span className="font-medium">{stats.bestAccuracy}%</span>
                  </div>
                </div>
              </div>
              
              <FactsStats 
                masteredFacts={stats.masteredFacts}
                inProgressFacts={stats.inProgressFacts}
                challengingFacts={stats.challengingFacts}
              />
            </div>

            {/* Графики */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Графика за броя тренировки по дни */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Брой тренировки по дни</h3>
                <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
                  <canvas ref={trainingsChartRef}></canvas>
                </div>
              </div>
              
              {/* Графика за точност по дни */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Точност по дни</h3>
                <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
                  <canvas ref={accuracyChartRef}></canvas>
                </div>
              </div>
            </div>
            
            {/* Последни тренировки */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-6">Последни тренировки</h2>
              
              {trainings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Няма записани тренировки</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Продължителност</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Задачи</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Правилни</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Грешни</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Точност</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trainings.slice(0, 10).map((training) => {
                        // Изчисляваме броя на задачите, правилните и грешните отговори
                        const facts = Array.isArray(training.facts) ? training.facts : [];
                        const totalProblems = facts.length;
                        const correctCount = facts.filter(fact => fact.isCorrect).length;
                        const incorrectCount = totalProblems - correctCount;
                        
                        const accuracy = totalProblems > 0 
                          ? Math.round((correctCount / totalProblems) * 100) 
                          : 0;
                        
                        return (
                          <tr key={training.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(training.started_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDuration(training.total_time)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{totalProblems}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600">{correctCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-red-600">{incorrectCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="mr-2">{accuracy}%</span>
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      accuracy > 80 ? 'bg-green-500' : 
                                      accuracy > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} 
                                    style={{ width: `${accuracy}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Топлинна карта на фактите */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-6">Топлинна карта на таблицата за умножение</h2>
              
              {allFacts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Зареждане на данни за топлинната карта...</p>
              ) : (
                <div className="overflow-x-auto">
                  <div 
                    className="heatmap-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(11, 1fr)',
                      gap: '4px',
                      maxWidth: '100%'
                    }}
                  >
                    {/* Празна клетка в ъгъла */}
                    <div 
                      className="heatmap-cell" 
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f3e8ff',
                        color: '#6b21a8',
                        fontWeight: 'bold',
                        borderRadius: '6px'
                      }}>
                    </div>
                    
                    {/* Заглавия на колоните */}
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <div 
                        key={`col-${num}`}
                        className="heatmap-cell" 
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f3e8ff',
                          color: '#6b21a8',
                          fontWeight: 'bold',
                          borderRadius: '6px'
                        }}
                      >
                        {num}
                      </div>
                    ))}
                    
                    {/* Тялото на топлинната карта */}
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(row => (
                      <React.Fragment key={`row-${row}`}>
                        {/* Заглавие на реда */}
                        <div 
                          className="heatmap-cell" 
                          style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f3e8ff',
                            color: '#6b21a8',
                            fontWeight: 'bold',
                            borderRadius: '6px'
                          }}
                        >
                          {row}
                        </div>
                        
                        {/* Клетки с факти */}
                        {Array.from({ length: 10 }, (_, j) => j + 1).map(col => {
                          // Намираме факта от базовите данни
                          const fact = allFacts.find(f => f.multiplicand === row && f.multiplier === col);
                          if (!fact) return null;
                          
                          // Изчисляваме статистики от trainings
                          let attempts = 0, correct = 0;
                          trainings.forEach(t => { 
                            if (!t.facts) return; 
                            (Array.isArray(t.facts) ? t.facts : []).forEach(fr => {
                              if (fr.fact.i === row && fr.fact.j === col) {
                                attempts++;
                                if (fr.isCorrect) correct++;
                              }
                            }); 
                          });
                          const accuracy = attempts > 0 ? correct / attempts : 0;
                          let backgroundColor = '#f0f0f0', textColor = 'rgba(0, 0, 0, 0.7)', tooltipText = `${row}×${col}=${row*col}\nНеопитан факт`, accuracyText = '';
                          if (attempts > 0) {
                            if (accuracy >= 0.8) backgroundColor = `rgba(0, 200, 83, ${Math.min(0.3 + accuracy * 0.7, 1)})`;
                            else if (accuracy >= 0.5) backgroundColor = `rgba(255, 193, 7, ${Math.min(0.3 + accuracy * 0.7, 1)})`;
                            else { backgroundColor = `rgba(244, 67, 54, ${Math.min(0.3 + (1 - accuracy) * 0.7, 1)})`; textColor = 'rgba(255, 255, 255, 0.87)'; }
                            tooltipText = `${row}×${col}=${row*col}\nОпити: ${attempts}, Правилни: ${correct}\nТочност: ${Math.round(accuracy * 100)}%`;
                            accuracyText = `${Math.round(accuracy * 100)}%`;
                          }
                          // Изчисляваме трудност за всеки факт
                          // Изчисляваме трудността директно от опитите
                          let difficultyRating = 5.0;
                          if (attempts > 0) {
                            // Начална трудност 5.0
                            // За всеки правилен отговор -0.2, за всеки грешен +0.5
                            difficultyRating = 5.0 + (correct * -0.2) + ((attempts - correct) * 0.5);
                            // Ограничаваме до пределите 1-10
                            difficultyRating = Math.max(1, Math.min(10, difficultyRating));
                          }
                          return (
                            <div 
                              key={`${row}-${col}`}
                              className="heatmap-cell" 
                              onMouseEnter={(e) => {
                                const content = (
                                  <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
                                    <div className="text-lg font-bold text-purple-800">{row} × {col} = {row * col}</div>
                                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                                      <div className="text-gray-600">Общо опити:</div>
                                      <div className="font-medium">{attempts}</div>
                                      
                                      <div className="text-gray-600">Правилни:</div>
                                      <div className="font-medium text-green-600">{correct}</div>
                                      
                                      <div className="text-gray-600">Грешни:</div>
                                      <div className="font-medium text-red-600">{attempts - correct}</div>
                                      
                                      <div className="text-gray-600">Точност:</div>
                                      <div className="font-medium flex items-center">
                                        <span>{Math.round(accuracy * 100)}%</span>
                                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${
                                              accuracy >= 0.8 ? 'bg-green-500' : 
                                              accuracy >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} 
                                            style={{ width: `${Math.round(accuracy * 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      <div className="text-gray-600">Трудност:</div>
                                      <div className="font-medium">{difficultyRating.toFixed(1)}</div>
                                    </div>
                                  </div>
                                );
                                
                                setTooltipInfo({ 
                                  visible: true, 
                                  x: e.clientX, 
                                  y: e.clientY, 
                                  content 
                                });
                              }}
                              onMouseLeave={() => setTooltipInfo(prev => ({ ...prev, visible: false }))}
                              onMouseMove={(e) => {
                                if (tooltipInfo.visible) {
                                  setTooltipInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                                }
                              }}
                              style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor,
                                color: textColor,
                                borderRadius: '6px',
                                fontWeight: 500,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'help'
                              }}
                            >
                              <div style={{ fontSize: '1.2rem' }}>{row * col}</div>
                              {accuracyText && (
                                <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>{accuracyText}</div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Интерактивен тултип */}
      {tooltipInfo.visible && (
        <div 
          style={{
            position: 'fixed', 
            top: tooltipInfo.y + 10, 
            left: tooltipInfo.x + 10,
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {tooltipInfo.content}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
