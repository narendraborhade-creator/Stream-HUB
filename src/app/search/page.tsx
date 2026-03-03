'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Music, Video } from 'lucide-react';
import MusicCard from '@/components/music/MusicCard';
import VideoCard from '@/components/video/VideoCard';
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

interface VideoItem {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  views: number;
  category: string;
  uploader: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [musicResults, setMusicResults] = useState<Music[]>([]);
  const [videoResults, setVideoResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const { currentTrack, queue, playTrack, nextTrack } = usePlayer();

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setMusicResults(data.music);
        setVideoResults(data.videos);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput)}`;
    }
  };

  const handlePlayMusic = (music: Music) => {
    playTrack(music, musicResults);
  };

  const handleWatchVideo = (video: VideoItem) => {
    window.location.href = `/videos/${video._id}`;
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-8 py-8">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for music, videos, artists..."
              className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="px-8 flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : query ? (
        <div className="px-8">
          <p className="text-gray-400 mb-6">
            Found {musicResults.length} music and {videoResults.length} videos for &quot;{query}&quot;
          </p>

          {/* Music Results */}
          {musicResults.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">Music</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {musicResults.map((music) => (
                  <MusicCard
                    key={music._id}
                    music={music}
                    onPlay={handlePlayMusic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Video Results */}
          {videoResults.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-pink-400" />
                <h2 className="text-xl font-semibold">Videos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoResults.map((video) => (
                  <VideoCard
                    key={video._id}
                    video={video}
                    onWatch={handleWatchVideo}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {musicResults.length === 0 && videoResults.length === 0 && (
            <div className="text-center py-16">
              <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No results found for &quot;{query}&quot;</p>
              <p className="text-gray-500">Try different keywords</p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-8 text-center py-16">
          <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Search for your favorite music and videos</p>
        </div>
      )}

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

function LoadingFallback() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-8 py-8">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
      </div>
      <div className="px-8 flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchContent />
    </Suspense>
  );
}
