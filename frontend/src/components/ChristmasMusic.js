import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const ChristmasMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef(null);

  useEffect(() => {
    // Free Christmas music from YouTube Audio Library or similar
    // Using a placeholder - you should replace with actual Christmas music URL
    const audio = new Audio();
    // Popular royalty-free Christmas music URLs:
    // Option 1: Use a direct MP3 link
    // Option 2: Embed from a service
    audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // Placeholder - replace with Christmas music
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.log("Audio play failed:", err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-red-600 to-green-600 p-3 rounded-full shadow-2xl border-2 border-yellow-400">
      <button
        onClick={toggleMusic}
        className="text-white hover:scale-110 transition-transform"
        title={isPlaying ? "Stop julemusik" : "Afspil julemusik"}
      >
        {isPlaying ? (
          <Volume2 className="w-6 h-6" />
        ) : (
          <VolumeX className="w-6 h-6" />
        )}
      </button>
      
      {isPlaying && (
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(e.target.value / 100)}
          className="w-20 h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${volume * 100}%, #ffffff40 ${volume * 100}%, #ffffff40 100%)`
          }}
        />
      )}
      
      <span className="text-white text-sm font-bold">🎵</span>
    </div>
  );
};

export default ChristmasMusic;
