'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Upload, X, FolderOpen } from 'lucide-react';

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
  isLocal?: boolean;
}

interface VideoImportButtonProps {
  onImport: (videos: Video[]) => void;
  localVideos: Video[];
}

export default function VideoImportButton({ onImport, localVideos }: VideoImportButtonProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
    onImport(updatedLocalVideos);
    
    setShowUploadModal(false);
    
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
  }, [handleImportVideo]);

  return (
    <>
      {/* Import Video Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 font-medium"
      >
        <Plus className="w-5 h-5" />
        Import from Device
      </button>

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
    </>
  );
}
