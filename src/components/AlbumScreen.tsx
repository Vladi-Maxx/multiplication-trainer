import React from 'react';

interface AlbumScreenProps {
  onBack: () => void;
}

import dragonImg from '../../Pics/Dragon 1.png';

const AlbumScreen: React.FC<AlbumScreenProps> = ({ onBack }) => {
  // Генерираме 24 картинки
  const images = Array.from({ length: 24 });

  return (
    <div className="app-wrapper flex items-center justify-center min-h-screen bg-[#f3f6f9]">
      <div className="bg-[#d8f6e3] rounded-3xl shadow-2xl p-4 md:p-12 max-w-[1200px] w-full flex flex-col items-center mx-auto my-8">
        <div className="w-full flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#24405a]">Албум</h1>
          <button
            onClick={onBack}
            className="bg-white rounded-lg shadow px-4 py-2 text-[#24405a] font-semibold border border-[#e0eef5] hover:bg-blue-50 transition"
          >Назад</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full overflow-y-auto">
          {images.map((_, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-full aspect-[3/4] max-w-[200px] bg-[#e6f3fa] rounded-2xl shadow-xl border border-[#e0eef5] flex items-center justify-center">
                {/* Замени src с реалния път до картинката! */}
                <img src={dragonImg} alt="Драконче" className="object-contain w-full h-full rounded-xl" />
              </div>
              <span className="mt-2 text-[#24405a] font-medium">Драконче #{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlbumScreen;
