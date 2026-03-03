import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Music, Video, Playlist } from '@/lib/models';

// Sample music data using free audio sources
const sampleMusic = [
  {
    title: 'Summer Vibes',
    artist: 'Chill Wave',
    album: 'Sunset Dreams',
    duration: 210,
    coverUrl: 'https://picsum.photos/seed/music1/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Electronic',
    year: 2024,
    playCount: 15420,
    downloadCount: 3420,
    isDownloaded: true
  },
  {
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    album: 'Night Sky',
    duration: 245,
    coverUrl: 'https://picsum.photos/seed/music2/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Ambient',
    year: 2024,
    playCount: 12350,
    downloadCount: 2890,
    isDownloaded: true
  },
  {
    title: 'Urban Rhythm',
    artist: 'City Beats',
    album: 'Street Sounds',
    duration: 198,
    coverUrl: 'https://picsum.photos/seed/music3/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Hip Hop',
    year: 2023,
    playCount: 9870,
    downloadCount: 2100,
    isDownloaded: true
  },
  {
    title: 'Ocean Waves',
    artist: 'Nature Sounds',
    album: 'Relaxation',
    duration: 320,
    coverUrl: 'https://picsum.photos/seed/music4/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Ambient',
    year: 2024,
    playCount: 22450,
    downloadCount: 5670,
    isDownloaded: true
  },
  {
    title: 'Electric Soul',
    artist: 'Neon Lights',
    album: 'Digital Age',
    duration: 225,
    coverUrl: 'https://picsum.photos/seed/music5/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    genre: 'Electronic',
    year: 2024,
    playCount: 8760,
    downloadCount: 1890,
    isDownloaded: true
  },
  {
    title: 'Mountain High',
    artist: 'Folk Tales',
    album: 'Journey Home',
    duration: 267,
    coverUrl: 'https://picsum.photos/seed/music6/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    genre: 'Folk',
    year: 2023,
    playCount: 6540,
    downloadCount: 1230,
    isDownloaded: true
  },
  {
    title: 'Cosmic Journey',
    artist: 'Space Drift',
    album: 'Galaxy Dreams',
    duration: 289,
    coverUrl: 'https://picsum.photos/seed/music7/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    genre: 'Ambient',
    year: 2024,
    playCount: 11230,
    downloadCount: 2450,
    isDownloaded: true
  },
  {
    title: 'Dance Floor',
    artist: 'Party Masters',
    album: 'Weekend Vibes',
    duration: 195,
    coverUrl: 'https://picsum.photos/seed/music8/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'Dance',
    year: 2024,
    playCount: 18920,
    downloadCount: 4320,
    isDownloaded: true
  }
];

// Sample video data using free video sources
const sampleVideos = [
  {
    title: 'Beautiful Nature Scenery',
    description: 'Relaxing nature footage with peaceful music',
    thumbnailUrl: 'https://picsum.photos/seed/video1/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 600,
    views: 45670,
    category: 'Nature',
    uploader: 'Nature Lover'
  },
  {
    title: 'City Night Timelapse',
    description: 'Stunning city lights at night',
    thumbnailUrl: 'https://picsum.photos/seed/video2/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 480,
    views: 32100,
    category: 'Travel',
    uploader: 'Urban Explorer'
  },
  {
    title: 'Cooking Masterclass',
    description: 'Learn to cook delicious pasta',
    thumbnailUrl: 'https://picsum.photos/seed/video3/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 1200,
    views: 28750,
    category: 'Food',
    uploader: 'Chef John'
  },
  {
    title: 'Tech Review 2024',
    description: 'Latest gadgets review',
    thumbnailUrl: 'https://picsum.photos/seed/video4/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 900,
    views: 19800,
    category: 'Technology',
    uploader: 'Tech Guru'
  },
  {
    title: 'Yoga for Beginners',
    description: '30-minute yoga session',
    thumbnailUrl: 'https://picsum.photos/seed/video5/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 1800,
    views: 54230,
    category: 'Fitness',
    uploader: 'Wellness Coach'
  },
  {
    title: 'Documentary: Ocean Life',
    description: 'Amazing underwater world',
    thumbnailUrl: 'https://picsum.photos/seed/video6/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 2700,
    views: 67340,
    category: 'Documentary',
    uploader: 'Ocean Explorer'
  }
];

// In-memory fallback storage
interface FallbackMusic {
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
}

interface FallbackVideo {
  _id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  views: number;
  category: string;
  uploader: string;
}

interface FallbackPlaylist {
  _id: string;
  name: string;
  description: string;
  coverUrl: string;
  musics: string[];
  isPublic: boolean;
}

let fallbackMusic: FallbackMusic[] = [...sampleMusic];
let fallbackVideos: FallbackVideo[] = [...sampleVideos];
let fallbackPlaylists: FallbackPlaylist[] = [
  {
    _id: 'playlist-1',
    name: 'My Favorites',
    description: 'My favorite tracks',
    coverUrl: 'https://picsum.photos/seed/playlist1/300/300',
    musics: fallbackMusic.slice(0, 4).map((_, i) => `music-${i}`),
    isPublic: true
  },
  {
    _id: 'playlist-2',
    name: 'Chill Vibes',
    description: 'Relaxing music collection',
    coverUrl: 'https://picsum.photos/seed/playlist2/300/300',
    musics: fallbackMusic.slice(4).map((_, i) => `music-${i + 4}`),
    isPublic: true
  }
];

export async function POST() {
  try {
    const db = await connectDB();

    if (!db) {
      // Use fallback data
      fallbackMusic = [...sampleMusic];
      fallbackVideos = [...sampleVideos];
      fallbackPlaylists = [
        {
          _id: 'playlist-1',
          name: 'My Favorites',
          description: 'My favorite tracks',
          coverUrl: 'https://picsum.photos/seed/playlist1/300/300',
          musics: fallbackMusic.slice(0, 4).map((_, i) => `music-${i}`),
          isPublic: true
        },
        {
          _id: 'playlist-2',
          name: 'Chill Vibes',
          description: 'Relaxing music collection',
          coverUrl: 'https://picsum.photos/seed/playlist2/300/300',
          musics: fallbackMusic.slice(4).map((_, i) => `music-${i + 4}`),
          isPublic: true
        }
      ];
      
      // Add IDs to fallback music and videos
      fallbackMusic = fallbackMusic.map((m, i) => ({ ...m, _id: `music-${i}` }));
      fallbackVideos = fallbackVideos.map((v, i) => ({ ...v, _id: `video-${i}` }));

      return NextResponse.json({
        success: true,
        message: 'Database seeded successfully (fallback mode)',
        musicCount: fallbackMusic.length,
        videoCount: fallbackVideos.length,
        playlistCount: fallbackPlaylists.length,
        isFallback: true
      });
    }

    // Clear existing data
    await Music.deleteMany({});
    await Video.deleteMany({});
    await Playlist.deleteMany({});

    // Insert sample data
    const createdMusic = await Music.insertMany(sampleMusic);
    const createdVideos = await Video.insertMany(sampleVideos);

    // Create default playlists
    const musicIds = createdMusic.slice(0, 4).map((m: { _id: { toString: () => string } }) => m._id.toString());
    await Playlist.create({
      name: 'My Favorites',
      description: 'My favorite tracks',
      coverUrl: 'https://picsum.photos/seed/playlist1/300/300',
      musics: musicIds,
      isPublic: true
    });

    const musicIds2 = createdMusic.slice(4).map((m: { _id: { toString: () => string } }) => m._id.toString());
    await Playlist.create({
      name: 'Chill Vibes',
      description: 'Relaxing music collection',
      coverUrl: 'https://picsum.photos/seed/playlist2/300/300',
      musics: musicIds2,
      isPublic: true
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      musicCount: createdMusic.length,
      videoCount: createdVideos.length,
      playlistCount: 2
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    
    // Return fallback data on error
    fallbackMusic = sampleMusic.map((m, i) => ({ ...m, _id: `music-${i}` }));
    fallbackVideos = sampleVideos.map((v, i) => ({ ...v, _id: `video-${i}` }));
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully (fallback mode)',
      musicCount: fallbackMusic.length,
      videoCount: fallbackVideos.length,
      playlistCount: fallbackPlaylists.length,
      isFallback: true
    });
  }
}

export async function GET() {
  try {
    const db = await connectDB();

    if (!db) {
      return NextResponse.json({
        success: true,
        musicCount: fallbackMusic.length,
        videoCount: fallbackVideos.length,
        playlistCount: fallbackPlaylists.length,
        message: fallbackMusic.length > 0 ? 'Using fallback data' : 'Database is empty',
        isFallback: true
      });
    }

    const musicCount = await Music.countDocuments();
    const videoCount = await Video.countDocuments();
    const playlistCount = await Playlist.countDocuments();

    return NextResponse.json({
      success: true,
      musicCount,
      videoCount,
      playlistCount,
      message: musicCount > 0 ? 'Database already has data' : 'Database is empty'
    });
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({
      success: true,
      musicCount: fallbackMusic.length,
      videoCount: fallbackVideos.length,
      playlistCount: fallbackPlaylists.length,
      message: 'Using fallback data',
      isFallback: true
    });
  }
}

// Export fallback data for use in other routes
export { fallbackMusic, fallbackVideos, fallbackPlaylists };
