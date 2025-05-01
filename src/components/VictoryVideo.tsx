import React, { useEffect, useState, useRef } from 'react';

interface VictoryVideoProps {
  onVideoEnd: () => void;
}

const VictoryVideo: React.FC<VictoryVideoProps> = ({ onVideoEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      // Започваме да възпроизвеждаме видеото веднага след зареждане
      const playVideo = async () => {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Грешка при възпроизвеждане на видеото:', error);
          // Ако има грешка, веднага преминаваме към Summary
          onVideoEnd();
        }
      };
      
      playVideo();
      
      // Когато видеото свърши, извикваме onVideoEnd
      video.addEventListener('ended', onVideoEnd);
      
      return () => {
        video.removeEventListener('ended', onVideoEnd);
      };
    }
  }, [onVideoEnd]);

  const handleSkip = () => {
    setIsPlaying(false);
    onVideoEnd();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
      <video 
        ref={videoRef}
        className="max-w-full max-h-screen"
        src="/Pics/Victory.mp4"
        autoPlay
        playsInline
        muted={false}
      />
      <button 
        onClick={handleSkip}
        className="absolute bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-colors"
      >
        Пропусни видеото
      </button>
    </div>
  );
};

export default VictoryVideo;
