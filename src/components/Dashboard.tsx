import React, { useState, useEffect, useRef } from 'react';
import { supabase, getCurrentUserId } from '../services/supabase';
import Chart from 'chart.js/auto';

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

const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalProblems: 0,
    averageAccuracy: 0,
    averageTimePerProblem: 0,
    bestAccuracy: 0,
    longestTraining: 0,
  });
  
  // Референции за графиките
  const trainingsChartRef = useRef<HTMLCanvasElement>(null);
  const accuracyChartRef = useRef<HTMLCanvasElement>(null);
  const trainingsChartInstance = useRef<Chart | null>(null);
  const accuracyChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
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

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      
      if (!userId) {
        setError('Потребителят не е влязъл в системата');
        setLoading(false);
        return;
      }

      // Извличаме тренировките за текущия потребител
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTrainings(data || []);
      calculateStats(data || []);
      renderCharts(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Грешка при зареждане на данни за тренировките:', err);
      setError('Възникна грешка при зареждане на данните');
      setLoading(false);
    }
  };

  // Подготвяне на данни и рендериране на графики
  const renderCharts = (data: Training[]) => {
    if (!data || data.length === 0 || !trainingsChartRef.current || !accuracyChartRef.current) {
      return;
    }
    
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
      if (training.facts && Array.isArray(training.facts)) {
        const correctCount = training.facts.filter(fact => fact.isCorrect).length;
        acc[date].totalCorrect += correctCount;
        acc[date].totalProblems += training.facts.length;
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
    if (!seconds) return '0 сек';
    if (seconds < 60) return `${seconds} сек`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} мин ${remainingSeconds} сек`;
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
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Постижения</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Най-добра точност</span>
                    <span className="font-medium">{stats.bestAccuracy}%</span>
                  </div>
                </div>
              </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
