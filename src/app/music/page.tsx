'use client';

import { useEffect, useState } from 'react';
import { Music as MusicIcon, Filter, Grid, List } from 'lucide-react';
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

const genres = ['All', 'Electronic', 'Ambient', 'Hip Hop', 'Dance', 'Folk'];

export default function MusicPage() {
  const [musics, setMusics] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { currentTrack, queue, playTrack, nextTrack } = usePlayer();

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const genreParam = selectedGenre !== 'All' ? `&genre=${selectedGenre}` : '';
        const res = await fetch(`/api/music?limit=50${genreParam}`);
        const data = await res.json();
        if (data.success) {
          setMusics(data.data);
        }
      } catch (error) {
        console.error('Error fetching music:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, [selectedGenre]);

  const handlePlayMusic = (music: Music) => {
    playTrack(music, musics);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <MusicIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Music Library</h1>
        </div>
        <p className="text-gray-400">Browse and stream music for free</p>
      </div>

      {/* Filters */}
      <div className="px-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedGenre === genre
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Music Grid */}
      <div className="px-8">
        {musics.length === 0 ? (
          <div className="text-center py-16">
            <MusicIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No music found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {musics.map((music) => (
              <MusicCard
                key={music._id}
                music={music}
                onPlay={handlePlayMusic}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {musics.map((music) => (
              <button
                key={music._id}
                onClick={() => handlePlayMusic(music)}
                className="w-full flex items-center gap-4 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors text-left"
              >
                <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={music.coverUrl} alt={music.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{music.title}</p>
                  <p className="text-gray-400 text-sm truncate">{music.artist}</p>
                </div>
                <div className="text-gray-500 text-sm">
                  {Math.floor(music.duration / 60)}:{String(music.duration % 60).padStart(2, '0')}
                </div>
              </button>
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
