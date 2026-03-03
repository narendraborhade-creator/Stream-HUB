'use client';

import { useState, useRef, useCallback } from 'react';
import { FolderSearch, Play, X, FileVideo } from 'lucide-react';

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

interface DeviceFilePickerProps {
  onPlayVideo: (video: Video) => void;
}

export default function DeviceFilePicker({ onPlayVideo }: DeviceFilePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection from picker
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
    setIsLoading(true);

    try {
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

      const preview: Video = {
        _id: `device_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: 'Video from your device (not stored)',
        thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/320/180`,
        videoUrl,
        duration: Math.floor(duration),
        views: 0,
        category: 'Device',
        uploader: 'My Device',
        isLocal: true,
      };

      setVideoPreview(preview);
    } catch (error) {
      console.error('Error loading video:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Play the selected video
  const handlePlayVideo = useCallback(() => {
    if (videoPreview) {
      onPlayVideo(videoPreview);
      setShowPicker(false);
      setSelectedFile(null);
      setVideoPreview(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [videoPreview, onPlayVideo]);

  // Close the picker
  const handleClose = useCallback(() => {
    setShowPicker(false);
    setSelectedFile(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <>
      {/* Browse Device Button */}
      <button
        onClick={() => setShowPicker(true)}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg hover:shadow-green-500/25 font-medium"
      >
        <FolderSearch className="w-5 h-5" />
        Browse Device
      </button>

      {/* File Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderSearch className="w-5 h-5 text-green-500" />
                Browse Videos on Device
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* File Input Area */}
            <div 
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-gray-800/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <FileVideo className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-white font-medium text-lg mb-2">
                    Click to browse your device
                  </p>
                  <p className="text-gray-400 text-sm">
                    Select any video file from your computer
                  </p>
                </>
              )}
            </div>

            {/* Video Preview */}
            {videoPreview && (
              <div className="mt-6 p-4 bg-gray-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={videoPreview.thumbnailUrl} 
                      alt={videoPreview.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{videoPreview.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Duration: {Math.floor(videoPreview.duration / 60)}:{(videoPreview.duration % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-yellow-400 text-xs mt-2">
                      ⚠️ Video plays directly - not saved to app
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
              <p className="text-blue-300 text-sm">
                <span className="font-medium">💡 Quick Play:</span> Browse and play videos directly from your device without importing them. 
                Great for large files you do not want to store in the browser.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePlayVideo}
                disabled={!videoPreview || isLoading}
                className={`flex-1 px-4 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                  videoPreview && !isLoading
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Play Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
