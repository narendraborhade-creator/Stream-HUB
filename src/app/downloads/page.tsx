'use client';

import { useState } from 'react';
import { Download, Music } from 'lucide-react';
import MusicCard from '@/components/music/MusicCard';
import MusicPlayer from '@/components/music/MusicPlayer';
import { usePlayer } from '@/context/PlayerContext';

interface Music {
  _id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  genre: string;
  playCount: number;
  downloadCount: number;
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Music[]>([]);
  const { currentTrack, queue, playTrack, nextTrack } = usePlayer();

  const handlePlayMusic = (music: Music) => {
    playTrack(music, downloads);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Downloads</h1>
        </div>
        <p className="text-gray-400">Your downloaded tracks</p>
      </div>

      {/* Downloads Content */}
      <div className="px-8">
        {downloads.length === 0 ? (
          <div className="text-center py-16">
            <Download className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No downloads yet</p>
            <p className="text-gray-500">Download music to listen offline</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {downloads.map((music) => (
              <MusicCard
                key={music._id}
                music={music}
                onPlay={handlePlayMusic}
              />
            ))}
          </div>
        )}
      </div>

      {/* Music Player */}
      {currentTrack && (
        <MusicPlayer
          currentTrack={currentTrack}
          queue={queue}
          onTrackEnd={nextTrack}
          onPlayTrack={playTrack}
        />
      )}
    </div>
  );
}
