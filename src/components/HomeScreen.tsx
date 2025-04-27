import React from 'react';

interface HomeScreenProps {
  onPlay: () => void;
  onAchievements: () => void;
  onAlbum: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onPlay, onAchievements, onAlbum }) => {
  return (
    <div className="app-wrapper flex items-center justify-center min-h-screen bg-[#f3f6f9]">
      <div className="bg-[#d8f6e3] rounded-3xl shadow-2xl p-4 md:p-12 max-w-[1200px] max-h-[95vh] w-full flex items-center justify-center mx-auto my-auto">
        <div className="main-content grid grid-cols-[2fr_1fr] gap-4 w-full">
        {/* Обединен ляв+централен панел */}
        <div className="left-panel flex items-center justify-center">
          <div className="puzzle-placeholder aspect-[3/4] w-full max-w-[500px] max-h-[75vh] mx-auto bg-[#e6f3fa] rounded-2xl shadow-xl border border-[#e0eef5] flex items-center justify-center">
  <video
    src="/Pics/Dragon's Math Puzzle.mp4"
    autoPlay
    loop
    muted
    playsInline
    className="object-contain w-full h-full rounded-xl"
  >
    Вашият браузър не поддържа видео.
  </video>
</div>
        </div>
        {/* Десен панел с бутони */}
        <div className="right-panel flex flex-col items-center justify-center gap-6 w-full max-w-[320px] mx-auto">
          <button
            onClick={onPlay}
            className="flex items-center gap-4 bg-white shadow-lg rounded-xl px-7 py-5 text-2xl font-semibold text-[#24405a] hover:bg-blue-50 transition border border-[#e0eef5] w-full"
          >
            <svg width="32" height="32" fill="#2b7cff" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 3.5v13l11-6.5-11-6.5z"/></svg>
            Играй
          </button>
          <button
            onClick={onAchievements}
            className="flex items-center gap-4 bg-white shadow-lg rounded-xl px-7 py-5 text-2xl font-semibold text-[#24405a] hover:bg-blue-50 transition border border-[#e0eef5] w-full"
          >
            <svg width="32" height="32" fill="#ffa800" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2l2.09 6.26H18l-5.18 3.77L14.18 18 10 14.27 5.82 18l1.36-5.97L2 8.26h5.91z"/></svg>
            Постижения
          </button>
          <button
            onClick={onAlbum}
            className="flex items-center gap-4 bg-white shadow-lg rounded-xl px-7 py-5 text-2xl font-semibold text-[#24405a] hover:bg-blue-50 transition border border-[#e0eef5] w-full"
          >
            <svg width="32" height="32" fill="#15b6c6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect width="18" height="14" x="1" y="3" rx="3"/><circle cx="6.5" cy="8.5" r="1.5" fill="#fff"/><path d="M2 16l4-5 4 4 5-7 3 8" fill="none" stroke="#15b6c6" strokeWidth={2}/></svg>
            Албум
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
