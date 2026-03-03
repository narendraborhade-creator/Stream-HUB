'use client';

import { useEffect, useState } from 'react';
import { Video as VideoIcon, Filter } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';

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

const categories = ['All', 'Nature', 'Travel', 'Food', 'Technology', 'Fitness', 'Documentary'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
        const res = await fetch(`/api/video?limit=50${categoryParam}`);
        const data = await res.json();
        if (data.success) {
          setVideos(data.data);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [selectedCategory]);

  const handleWatchVideo = (video: Video) => {
    window.location.href = `/videos/${video._id}`;
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
          <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
            <VideoIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Videos</h1>
        </div>
        <p className="text-gray-400">Watch videos for free</p>
      </div>

      {/* Category Filters */}
      <div className="px-8 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="px-8">
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <VideoIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onWatch={handleWatchVideo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
