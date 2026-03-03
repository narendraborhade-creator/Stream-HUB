'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Download,
  Heart,
  Repeat,
  Shuffle,
  ListMusic
} from 'lucide-react';
import Image from 'next/image';

interface MusicTrack {
  _id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
}

interface MusicPlayerProps {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  onTrackEnd: () => void;
  onPlayTrack: (track: MusicTrack) => void;
}

export default function MusicPlayer({ currentTrack, queue, onTrackEnd, onPlayTrack }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeated, setIsRepeated] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeated) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else {
      onTrackEnd();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!currentTrack) return;
    
    try {
      const response = await fetch(currentTrack.audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.artist} - ${currentTrack.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-64 right-0 h-24 bg-gray-900 border-t border-gray-800 flex items-center justify-center">
        <p className="text-gray-500">Select a track to play</p>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <div className="fixed bottom-0 left-64 right-0 h-24 bg-gray-900 border-t border-gray-800 flex items-center px-6 z-50">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-medium truncate">{currentTrack.title}</h4>
            <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
          </div>
          <button 
            onClick={toggleLike}
            className={`p-2 ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 ${isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const currentIndex = queue.findIndex(t => t._id === currentTrack._id);
                if (currentIndex > 0) {
                  onPlayTrack(queue[currentIndex - 1]);
                }
              }}
              className="p-2 text-gray-400 hover:text-white"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-gray-900" />
              ) : (
                <Play className="w-5 h-5 text-gray-900 ml-0.5" />
              )}
            </button>
            <button 
              onClick={() => {
                const currentIndex = queue.findIndex(t => t._id === currentTrack._id);
                if (currentIndex < queue.length - 1) {
                  onPlayTrack(queue[currentIndex + 1]);
                }
              }}
              className="p-2 text-gray-400 hover:text-white"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsRepeated(!isRepeated)}
              className={`p-2 ${isRepeated ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full max-w-xl">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Extra Controls */}
        <div className="w-1/4 flex items-center justify-end gap-4">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 ${showQueue ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            <ListMusic className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="fixed bottom-24 right-6 w-80 max-h-96 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Queue</h3>
            <p className="text-gray-400 text-sm">{queue.length} tracks</p>
          </div>
          <div className="overflow-y-auto max-h-72">
            {queue.map((track, index) => (
              <button
                key={track._id}
                onClick={() => onPlayTrack(track)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors ${
                  track._id === currentTrack._id ? 'bg-gray-700' : ''
                }`}
              >
                <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={track.coverUrl}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 text-left">
                  <p className={`text-sm truncate ${track._id === currentTrack._id ? 'text-purple-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
