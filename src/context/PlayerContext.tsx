'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MusicTrack {
  _id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
}

interface PlayerContextType {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  isPlaying: boolean;
  playTrack: (track: MusicTrack, queue?: MusicTrack[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: MusicTrack, newQueue?: MusicTrack[]) => {
    setCurrentTrack(track);
    if (newQueue) {
      setQueue(newQueue);
    } else if (!queue.find(t => t._id === track._id)) {
      setQueue(prev => [...prev, track]);
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t._id === currentTrack._id);
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentTrack(queue[nextIndex]);
  };

  const previousTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t._id === currentTrack._id);
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentTrack(queue[prevIndex]);
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      queue,
      isPlaying,
      playTrack,
      togglePlay,
      nextTrack,
      previousTrack
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
