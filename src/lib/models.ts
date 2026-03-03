import mongoose, { Schema, Document } from 'mongoose';

export interface IMusic {
  _id?: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  genre: string;
  year: number;
  playCount: number;
  downloadCount: number;
  isDownloaded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVideo {
  _id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  views: number;
  category: string;
  uploader: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlaylist {
  _id?: string;
  name: string;
  description: string;
  coverUrl: string;
  musics: string[];
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MusicSchema = new Schema<IMusic>(
  {
    title: { type: String, required: true, index: true },
    artist: { type: String, required: true, index: true },
    album: { type: String, default: 'Unknown Album' },
    duration: { type: Number, default: 0 },
    coverUrl: { type: String, default: '/placeholder-album.jpg' },
    audioUrl: { type: String, required: true },
    genre: { type: String, default: 'Unknown' },
    year: { type: Number, default: new Date().getFullYear() },
    playCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    isDownloaded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MusicSchema.index({ title: 'text', artist: 'text', album: 'text' });

const VideoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '/placeholder-video.jpg' },
    videoUrl: { type: String, required: true },
    duration: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    uploader: { type: String, default: 'Anonymous' },
  },
  { timestamps: true }
);

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    coverUrl: { type: String, default: '/placeholder-playlist.jpg' },
    musics: [{ type: String }],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Music = mongoose.models.Music || mongoose.model<IMusic>('Music', MusicSchema);
export const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
export const Playlist = mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
