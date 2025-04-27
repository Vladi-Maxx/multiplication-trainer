import React from 'react';

interface HomeScreenProps {
  onPlay: () => void;
  onAchievements: () => void;
  onAlbum: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onPlay, onAchievements, onAlbum }) => {
  return (
    <div className="home-screen flex flex-col items-center justify-center min-h-screen gap-8 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">да счупим математиката</h1>
      <div className="flex flex-col gap-4 w-60">
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded" onClick={onPlay}>
          Играй
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded" onClick={onAchievements}>
          Постижения
        </button>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded" onClick={onAlbum}>
          Албум
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
