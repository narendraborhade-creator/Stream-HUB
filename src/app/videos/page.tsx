'use client';

import { useEffect, useState, useCallback } from 'react';
import { Video as VideoIcon, FolderOpen, Film } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';
import VideoImportButton from '@/components/video/VideoImportButton';

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
  fileData?: ArrayBuffer;
}

const categories = ['All', 'Nature', 'Travel', 'Food', 'Technology', 'Fitness', 'Documentary', 'My Videos'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localVideos, setLocalVideos] = useState<Video[]>([]);

  // Get MIME type from file extension
  const getVideoMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      m4v: 'video/x-m4v',
    };
    return mimeTypes[ext || ''] || 'video/mp4';
  };

  // IndexedDB helpers
  const openDB = useCallback(async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StreamHubVideos', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('localVideos')) {
          db.createObjectStore('localVideos', { keyPath: '_id' });
        }
      };
    });
  }, []);

  // Load local videos from IndexedDB on mount
  useEffect(() => {
    const loadLocalVideos = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction('localVideos', 'readonly');
        const store = tx.objectStore('localVideos');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const videos = request.result || [];
          const videosWithUrls: Video[] = videos.map((v: Video) => {
            if (v.fileData) {
              const blob = new Blob([v.fileData], { type: getVideoMimeType(v.title) });
              const url = URL.createObjectURL(blob);
              return { ...v, videoUrl: url, isLocal: true };
            }
            return { ...v, isLocal: true };
          });
          setLocalVideos(videosWithUrls);
        };
        request.onerror = () => {
          console.error('Error loading local videos:', request.error);
        };
      } catch (e) {
        console.error('Error loading local videos:', e);
      }
    };

    loadLocalVideos();
  }, [openDB]);

  // Delete video from IndexedDB
  const deleteVideoFromDB = async (videoId: string) => {
    return new Promise<void>((resolve, reject) => {
      openDB().then(db => {
        const tx = db.transaction('localVideos', 'readwrite');
        const store = tx.objectStore('localVideos');
        const request = store.delete(videoId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }).catch(reject);
    });
  };

  // Fetch server videos
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

  const handleDeleteLocalVideo = async (videoId: string) => {
    await deleteVideoFromDB(videoId);
    const updatedVideos = localVideos.filter(v => v._id !== videoId);
    setLocalVideos(updatedVideos);
  };

  // Filter videos based on category
  const getFilteredVideos = () => {
    if (selectedCategory === 'My Videos') {
      return localVideos;
    }
    if (selectedCategory === 'All') {
      return [...localVideos, ...videos];
    }
    return videos.filter(v => v.category === selectedCategory);
  };

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Videos</h1>
          </div>
          
          {/* Import Video Button - Separate Component */}
          <VideoImportButton 
            onImport={(videos) => setLocalVideos(videos)} 
            localVideos={localVideos} 
          />
        </div>
        <p className="text-gray-400">Watch videos for free • Import videos from your device</p>
      </div>

      {/* Quick Access to Local Videos */}
      {localVideos.length > 0 && (
        <div className="px-8 mb-6">
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">My Device Videos</h3>
                  <p className="text-green-400 text-sm">{localVideos.length} video{localVideos.length !== 1 ? 's' : ''} imported</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory('My Videos')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                View All
              </button>
            </div>
          </div>
        </div>
      )}

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
              {category === 'My Videos' && localVideos.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  {localVideos.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="px-8">
        {getFilteredVideos().length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No videos found</p>
            <p className="text-gray-500 text-sm">
              {selectedCategory === 'My Videos' 
                ? 'Import videos from your device to get started'
                : 'Import videos from your device or browse online content'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredVideos().map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onWatch={handleWatchVideo}
                onDelete={video.isLocal ? handleDeleteLocalVideo : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
