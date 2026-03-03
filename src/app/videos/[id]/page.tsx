'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Eye, Clock, User } from 'lucide-react';

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
  isLocal?: boolean;
}

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  // IndexedDB helper
  async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StreamHubVideos', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('localVideos')) {
          db.createObjectStore('localVideos', { keyPath: '_id' });
        }
      };
    });
  }

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        // Check if this is a local video (starts with local_)
        if (params.id && String(params.id).startsWith('local_')) {
          // Load from IndexedDB
          const db = await openDB();
          const tx = db.transaction('localVideos', 'readonly');
          const store = tx.objectStore('localVideos');
          const request = store.get(String(params.id));
          
          request.onsuccess = () => {
            const result = request.result;
            if (result) {
              // Create blob URL from the stored file
              const blob = result.file;
              const url = URL.createObjectURL(blob);
              setLocalVideoUrl(url);
              setVideo({
                _id: result._id,
                title: result.title,
                description: result.description,
                thumbnailUrl: result.thumbnailUrl,
                videoUrl: url,
                duration: result.duration,
                views: result.views,
                category: result.category,
                uploader: result.uploader,
                isLocal: true,
              });
            } else {
              router.push('/videos');
            }
          };
          request.onerror = () => {
            console.error('Error loading video from IndexedDB');
            router.push('/videos');
          };
        } else {
          // Fetch from API (original behavior)
          const res = await fetch(`/api/video/${params.id}`);
          const data = await res.json();
          if (data.success) {
            setVideo(data.data);
          } else {
            router.push('/videos');
          }
        }
      } catch (error) {
        console.error('Error fetching video:', error);
        router.push('/videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [params.id, router]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (localVideoUrl) {
        URL.revokeObjectURL(localVideoUrl);
      }
    };
  }, [localVideoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M views';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K views';
    return num + ' views';
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Back Button */}
      <div className="px-8 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Videos
        </button>
      </div>

      {/* Video Player */}
      <div className="px-8">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          {video.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={video.videoUrl}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer mb-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-black" />
                      ) : (
                        <Play className="w-5 h-5 text-black ml-0.5" />
                      )}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-white hover:text-gray-300"
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
                        className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                    </div>
                    
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-gray-300"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
        
        <div className="flex items-center gap-6 text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span>{formatViews(video.views)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{formatTime(video.duration)}</span>
          </div>
          <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
            {video.category}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">{video.uploader}</p>
            <p className="text-gray-400 text-sm">Uploader</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">Description</h3>
          <p className="text-gray-400">{video.description}</p>
        </div>
      </div>
    </div>
  );
}
