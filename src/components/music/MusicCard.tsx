'use client';

import Image from 'next/image';
import { Play, Heart, Download, MoreVertical } from 'lucide-react';
import { useState } from 'react';

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

interface MusicCardProps {
  music: Music;
  onPlay: (music: Music) => void;
}

export default function MusicCard({ music, onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      className="group relative bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={music.coverUrl}
          alt={music.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onPlay(music)}
            className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          >
            <Play className="w-6 h-6 text-white ml-1" />
          </button>
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isLiked 
                ? 'bg-pink-500 text-white' 
                : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-semibold truncate mb-1">{music.title}</h3>
        <p className="text-gray-400 text-sm truncate">{music.artist}</p>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{formatDuration(music.duration)}</span>
          <div className="flex items-center gap-3">
            <span>{formatNumber(music.playCount)} plays</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const downloadUrl = `/api/download?url=${encodeURIComponent(music.audioUrl)}&filename=${encodeURIComponent(music.artist + ' - ' + music.title)}`;
                window.open(downloadUrl, '_blank');
              }}
              className="hover:text-purple-400 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
