import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Playlist } from '@/lib/models';
import { fallbackPlaylists, fallbackMusic } from '../seed/route';

let cachedDb: Awaited<ReturnType<typeof connectDB>> | null = null;

export async function GET() {
  try {
    // Try to connect to DB
    if (!cachedDb) {
      cachedDb = await connectDB();
    }

    // If DB not connected, use fallback data
    if (!cachedDb) {
      // Populate musics in fallback playlists
      const populatedPlaylists = fallbackPlaylists.map(playlist => ({
        ...playlist,
        musics: playlist.musics.map((musicId: string) => {
          const index = parseInt(musicId.replace('music-', ''));
          return fallbackMusic[index] || null;
        }).filter(Boolean)
      }));

      return NextResponse.json({
        success: true,
        data: populatedPlaylists,
        isFallback: true
      });
    }

    // DB is connected, use MongoDB
    const playlists = await Playlist.find({ isPublic: true })
      .populate('musics')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: playlists
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: fallbackPlaylists,
      isFallback: true
    });
  }
}

export async function POST(request: Request) {
  try {
    // Try to connect to DB
    if (!cachedDb) {
      cachedDb = await connectDB();
    }

    // If DB not connected, return error
    if (!cachedDb) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const playlist = await Playlist.create(body);
    
    return NextResponse.json({
      success: true,
      data: playlist
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
