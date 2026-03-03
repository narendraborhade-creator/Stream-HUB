'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Video as VideoIcon, Filter, Upload, FolderOpen, X, Play, Plus, Trash2, Film } from 'lucide-react';
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
  fileData?: ArrayBuffer;
}

const categories = ['All', 'Nature', 'Travel', 'Food', 'Technology', 'Fitness', 'Documentary', 'My Videos'];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localVideos, setLocalVideos] = useState<Video[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  // Save video to IndexedDB
  const saveVideoToDB = async (video: Video, arrayBuffer: ArrayBuffer) => {
    return new Promise<void>((resolve, reject) => {
      openDB().then(db => {
        const tx = db.transaction('localVideos', 'readwrite');
        const store = tx.objectStore('localVideos');
        
        const data = { ...video, fileData: arrayBuffer };
        const request = store.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }).catch(reject);
    });
  };

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

  // Handle file import
  const handleImportVideo = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    let files: FileList | null = null;
    
    if (e instanceof FileList) {
      files = e;
    } else {
      files = e.target.files;
    }
    
    if (!files || files.length === 0) return;

    const newVideos: Video[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Read file as ArrayBuffer for storage
      const arrayBuffer = await file.arrayBuffer();
      
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
        video.src = URL.createObjectURL(file);
      });

      const videoUrl = URL.createObjectURL(file);

      const newVideo: Video = {
        _id: `local_${Date.now()}_${i}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Local video file from your device',
        thumbnailUrl: `https://picsum.photos/seed/${Date.now() + i}/320/180`,
        videoUrl,
        duration: Math.floor(duration),
        views: 0,
        category: 'My Videos',
        uploader: 'Local Device',
        isLocal: true,
      };

      // Save video file to IndexedDB
      await saveVideoToDB(newVideo, arrayBuffer);
      newVideos.push(newVideo);
    }

    const updatedLocalVideos = [...localVideos, ...newVideos];
    setLocalVideos(updatedLocalVideos);
    
    setShowUploadModal(false);
    setUploadingProgress(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImportVideo(files);
    }
  }, [localVideos]);

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
          
          {/* Import Video Button - More Prominent */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 font-medium"
          >
            <Plus className="w-5 h-5" />
            Import from Device
          </button>
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
            <p className="text-gray-500 text-sm mb-6">
              {selectedCategory === 'My Videos' 
                ? 'Import videos from your device to get started'
                : 'Import videos from your device or browse online content'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Import Video
            </button>
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
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-purple-500" />
                Import Videos from Device
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Drop Zone */}
            <div 
              ref={dropZoneRef}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-purple-500 hover:bg-gray-800/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className={`w-8 h-8 ${isDragging ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
              <p className="text-white font-medium text-lg mb-2">
                {isDragging ? 'Drop your videos here' : 'Click to select or drag & drop'}
              </p>
              <p className="text-gray-400 text-sm">
                Supports MP4, WebM, MKV, AVI, MOV
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleImportVideo}
              className="hidden"
            />
            
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-sm">
                <span className="text-yellow-400 font-medium">💡 Tip:</span> Imported videos are stored securely in your browser. 
                They will persist as long as you don&apos;t clear your browser data. Your videos never leave your device!
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
              >
                Browse Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
