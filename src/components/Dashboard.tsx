import React, { useState, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../services/supabase';

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

  useEffect(() => {
    fetchTrainingData();
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
      setLoading(false);
    } catch (err) {
      console.error('Грешка при зареждане на данни за тренировките:', err);
      setError('Възникна грешка при зареждане на данните');
      setLoading(false);
    }
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

            {/* Бележка за родители */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <h3 className="text-lg font-medium text-blue-800 mb-2">💡 Съвет за родителите</h3>
              <p className="text-blue-700">
                Редовните кратки тренировки са по-ефективни от дългите и редки. Насърчавайте детето да тренира по 10-15 минути на ден, 
                вместо по час-два веднъж седмично. Наблюдавайте процента на точност и времето за отговор, за да видите подобрението.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
