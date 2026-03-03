'use client';

import Image from 'next/image';
import { Play, Eye, Clock, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  youtubeId?: string;
  duration: number;
  views: number;
  category: string;
  uploader: string;
}

interface VideoCardProps {
  video: Video;
  onWatch: (video: Video) => void;
}

export default function VideoCard({ video, onWatch }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M views';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K views';
    return num + ' views';
  };

  return (
    <div
      className="group bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onWatch(video)}
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-16 h-16 bg-purple-600/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
          {formatDuration(video.duration)}
        </div>
        <div className="absolute top-2 left-2">
          <span className="bg-purple-600/80 px-2 py-1 rounded text-xs text-white font-medium">
            {video.category}
          </span>
        </div>
        {video.youtubeId && (
          <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-semibold line-clamp-2 mb-2">{video.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{video.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{formatViews(video.views)}</span>
          </div>
          <span>by {video.uploader}</span>
        </div>
      </div>
    </div>
  );
}
