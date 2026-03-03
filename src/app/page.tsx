'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Music, Video, TrendingUp, Star, Sparkles } from 'lucide-react';
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

interface Video {
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

export default function Home() {
  const [musics, setMusics] = useState<Music[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, queue, playTrack, nextTrack } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we need to seed the database first
        const checkRes = await fetch('/api/seed');
        const checkData = await checkRes.json();
        
        if (checkData.musicCount === 0) {
          // Seed the database
          await fetch('/api/seed', { method: 'POST' });
        }

        // Fetch music
        const musicRes = await fetch('/api/music?limit=8');
        const musicData = await musicRes.json();
        if (musicData.success) {
          setMusics(musicData.data);
        }

        // Fetch videos
        const videoRes = await fetch('/api/video?limit=6');
        const videoData = await videoRes.json();
        if (videoData.success) {
          setVideos(videoData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayMusic = (music: Music) => {
    playTrack(music, musics);
  };

  const handleWatchVideo = (video: Video) => {
    window.location.href = `/videos/${video._id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent"></div>
        
        <div className="relative z-10 h-full flex items-center px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span className="text-pink-400 font-medium">Welcome to StreamHub</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Unlimited Entertainment
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Stream music and videos for free. Search, discover, and download your favorite content.
            </p>
            <div className="flex gap-4">
              <Link
                href="/music"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Music className="w-5 h-5" />
                Browse Music
              </Link>
              <Link
                href="/videos"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Video className="w-5 h-5" />
                Watch Videos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Music Section */}
      <section className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Trending Music</h2>
          </div>
          <Link href="/music" className="text-purple-400 hover:text-purple-300 font-medium">
            View All →
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {musics.slice(0, 4).map((music) => (
            <MusicCard
              key={music._id}
              music={music}
              onPlay={handlePlayMusic}
            />
          ))}
        </div>
      </section>

      {/* Popular Videos Section */}
      <section className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Popular Videos</h2>
          </div>
          <Link href="/videos" className="text-purple-400 hover:text-purple-300 font-medium">
            View All →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.slice(0, 3).map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onWatch={handleWatchVideo}
            />
          ))}
        </div>
      </section>

      {/* All Music Section */}
      <section className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">All Music</h2>
          </div>
          <Link href="/library" className="text-purple-400 hover:text-purple-300 font-medium">
            Go to Library →
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {musics.map((music) => (
            <MusicCard
              key={music._id}
              music={music}
              onPlay={handlePlayMusic}
            />
          ))}
        </div>
      </section>

      {/* All Videos Section */}
      <section className="px-8 py-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-red-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">All Videos</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onWatch={handleWatchVideo}
            />
          ))}
        </div>
      </section>

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
