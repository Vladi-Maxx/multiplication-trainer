import React, { useState, useEffect } from 'react';
import { getUnlockedDragons, getDragonImageUrl } from '../services/dragons';
import { Dragon } from '../services/dragons';

interface AlbumScreenProps {
  onBack: () => void;
}

// Запазваме резервно изображение, ако няма отключени дракони
import dragonImg from '../../Pics/Dragon 1.png';

const AlbumScreen: React.FC<AlbumScreenProps> = ({ onBack }) => {
  // Състояние за отключените дракони
  const [unlockedDragons, setUnlockedDragons] = useState<Dragon[]>([]);
  // Състояние за зареждане
  const [loading, setLoading] = useState(true);
  // Състояние за грешка при зареждане
  const [error, setError] = useState<string | null>(null);
  
  // Зареждаме отключените дракони при монтиране на компонента
  useEffect(() => {
    const loadUnlockedDragons = async () => {
      try {
        setLoading(true);
        const dragons = await getUnlockedDragons();
        // Сортираме в обратен ред (най-новите най-отгоре)
        const sortedDragons = [...dragons].sort((a, b) => {
          // Сортираме по дата на създаване, в низходящ ред
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setUnlockedDragons(sortedDragons);
      } catch (err) {
        console.error('Грешка при зареждане на отключените дракони:', err);
        setError('Грешка при зареждане на драконите.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUnlockedDragons();
  }, []);

  return (
    <div className="app-wrapper flex items-center justify-center min-h-screen bg-[#f3f6f9]">
      <div className="bg-[#d8f6e3] rounded-3xl shadow-2xl p-4 md:p-12 max-w-[1200px] w-full flex flex-col items-center mx-auto my-8">
        <div className="w-full flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#24405a]">Албум с дракони</h1>
          <button
            onClick={onBack}
            className="bg-white rounded-lg shadow px-4 py-2 text-[#24405a] font-semibold border border-[#e0eef5] hover:bg-blue-50 transition"
          >Назад</button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : unlockedDragons.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p className="text-xl mb-4">Все още нямате отключени дракони.</p>
            <p>Играйте и спечелвайте точки, за да отключите нови дракони!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full overflow-y-auto">
            {unlockedDragons.map((dragon, idx) => (
              <div key={dragon.id} className="flex flex-col items-center">
                <div className="w-full aspect-[3/4] max-w-[200px] bg-[#e6f3fa] rounded-2xl shadow-xl border border-[#e0eef5] flex items-center justify-center overflow-hidden">
                  <img 
                    src={getDragonImageUrl(dragon) || dragonImg} 
                    alt={dragon.name} 
                    className="object-contain w-full h-full rounded-xl" 
                  />
                </div>
                <span className="mt-2 text-[#24405a] font-medium">{dragon.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumScreen;
