'use client';

import { useEffect, useState, useRef } from 'react';
import { Video as VideoIcon, Filter, Upload, FolderOpen, X } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';

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
  localFile?: File;
}

const categories = ['All', 'Nature', 'Travel', 'Food', 'Technology', 'Fitness', 'Documentary', 'My Videos'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localVideos, setLocalVideos] = useState<Video[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          // Recreate blob URLs from stored files
          const videosWithUrls = videos.map((v: Video & { file?: File }) => {
            if (v.file) {
              return { ...v, videoUrl: URL.createObjectURL(v.file) };
            }
            return v;
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
  }, []);

  // IndexedDB helpers
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

  async function saveVideoToDB(video: Video, file: File) {
    return new Promise<void>((resolve, reject) => {
      openDB().then(db => {
        const tx = db.transaction('localVideos', 'readwrite');
        const store = tx.objectStore('localVideos');
        
        const data = { ...video, file };
        const request = store.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }).catch(reject);
    });
  }

  async function deleteVideoFromDB(videoId: string) {
    return new Promise<void>((resolve, reject) => {
      openDB().then(db => {
        const tx = db.transaction('localVideos', 'readwrite');
        const store = tx.objectStore('localVideos');
        const request = store.delete(videoId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }).catch(reject);
    });
  }

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

  // Handle importing local video files
  const handleImportVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newVideos: Video[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileUrl = URL.createObjectURL(file);
      
      // Get video duration
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve(video.duration);
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
          resolve(0);
          URL.revokeObjectURL(video.src);
        };
        video.src = fileUrl;
      });

      const newVideo: Video = {
        _id: `local_${Date.now()}_${i}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Local video file',
        thumbnailUrl: 'https://picsum.photos/seed/' + Date.now() + '/320/180',
        videoUrl: fileUrl,
        duration: Math.floor(duration),
        views: 0,
        category: 'My Videos',
        uploader: 'Local Device',
        isLocal: true,
      };

      // Save video file to IndexedDB
      await saveVideoToDB(newVideo, file);
      newVideos.push(newVideo);
    }

    const updatedLocalVideos = [...localVideos, ...newVideos];
    setLocalVideos(updatedLocalVideos);
    
    setShowUploadModal(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle deleting a local video
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
      return [...videos, ...localVideos];
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
              <VideoIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Videos</h1>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            Import Video
          </button>
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
        {getFilteredVideos().length === 0 ? (
          <div className="text-center py-16">
            <VideoIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredVideos().map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onWatch={handleWatchVideo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Import Video</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Click to select video files</p>
              <p className="text-gray-400 text-sm">Supports MP4, WebM, MKV, AVI</p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleImportVideo}
              className="hidden"
            />
            
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-sm">
                <span className="text-yellow-400">Note:</span> Imported videos are stored locally in your browser. 
                They will persist as long as you do not clear your browser data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
