import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Music, Video } from '@/lib/models';
import { fallbackMusic, fallbackVideos } from '../seed/route';

let cachedDb: Awaited<ReturnType<typeof connectDB>> | null = null;

export async function GET(request: Request) {
  try {
    // Try to connect to DB
    if (!cachedDb) {
      cachedDb = await connectDB();
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        music: [],
        videos: []
      });
    }

    const searchRegex = new RegExp(query, 'i');

    // If DB not connected, use fallback data
    if (!cachedDb) {
      let musicResults: typeof fallbackMusic = [];
      let videoResults: typeof fallbackVideos = [];

      if (type === 'all' || type === 'music') {
        musicResults = fallbackMusic.filter(m => 
          searchRegex.test(m.title) || 
          searchRegex.test(m.artist) || 
          searchRegex.test(m.album) || 
          searchRegex.test(m.genre)
        ).slice(0, 20);
      }

      if (type === 'all' || type === 'video') {
        videoResults = fallbackVideos.filter(v => 
          searchRegex.test(v.title) || 
          searchRegex.test(v.description) || 
          searchRegex.test(v.category)
        ).slice(0, 20);
      }

      return NextResponse.json({
        success: true,
        music: musicResults,
        videos: videoResults,
        query,
        isFallback: true
      });
    }

    // DB is connected, use MongoDB
    let musicResults = [];
    let videoResults = [];

    if (type === 'all' || type === 'music') {
      musicResults = await Music.find({
        $or: [
          { title: searchRegex },
          { artist: searchRegex },
          { album: searchRegex },
          { genre: searchRegex }
        ]
      })
        .sort({ playCount: -1 })
        .limit(20);
    }

    if (type === 'all' || type === 'video') {
      videoResults = await Video.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ]
      })
        .sort({ views: -1 })
        .limit(20);
    }

    return NextResponse.json({
      success: true,
      music: musicResults,
      videos: videoResults,
      query
    });
  } catch (error) {
    console.error('Error searching:', error);
    
    // Return fallback search on error
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const searchRegex = new RegExp(query, 'i');

    let musicResults: typeof fallbackMusic = [];
    let videoResults: typeof fallbackVideos = [];

    if (type === 'all' || type === 'music') {
      musicResults = fallbackMusic.filter(m => 
        searchRegex.test(m.title) || 
        searchRegex.test(m.artist) || 
        searchRegex.test(m.album) || 
        searchRegex.test(m.genre)
      ).slice(0, 20);
    }

    if (type === 'all' || type === 'video') {
      videoResults = fallbackVideos.filter(v => 
        searchRegex.test(v.title) || 
        searchRegex.test(v.description) || 
        searchRegex.test(v.category)
      ).slice(0, 20);
    }

    return NextResponse.json({
      success: true,
      music: musicResults,
      videos: videoResults,
      query,
      isFallback: true
    });
  }
}
