'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Library as LibraryIcon, Play, Music } from 'lucide-react';
import MusicCard from '@/components/music/MusicCard';
import MusicPlayer from '@/components/music/MusicPlayer';
import { usePlayer } from '@/context/PlayerContext';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  coverUrl: string;
  musics: Array<{
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
  }>;
}

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

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [musics, setMusics] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const { currentTrack, queue, playTrack, nextTrack } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playlistRes, musicRes] = await Promise.all([
          fetch('/api/playlist'),
          fetch('/api/music?limit=50')
        ]);
        
        const playlistData = await playlistRes.json();
        const musicData = await musicRes.json();
        
        if (playlistData.success) {
          setPlaylists(playlistData.data);
        }
        if (musicData.success) {
          setMusics(musicData.data);
        }
      } catch (error) {
        console.error('Error fetching library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayMusic = (music: Music) => {
    playTrack(music, musics);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    if (playlist.musics.length > 0) {
      playTrack(playlist.musics[0], playlist.musics as Music[]);
    }
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <LibraryIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Your Library</h1>
        </div>
        <p className="text-gray-400">Playlists and all your music</p>
      </div>

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="px-8 mb-10">
          <h2 className="text-xl font-semibold mb-4">Playlists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <button
                key={playlist._id}
                onClick={() => handlePlayPlaylist(playlist)}
                className="group relative bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-all text-left"
              >
                <div className="relative aspect-square">
                  <Image
                    src={playlist.coverUrl}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{playlist.musics.length} tracks</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Music */}
      <div className="px-8">
        <h2 className="text-xl font-semibold mb-4">All Music</h2>
        {musics.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No music in your library</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {musics.map((music) => (
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
