import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Playlist } from '@/lib/models';
import { fallbackPlaylists, fallbackMusic } from '../../seed/route';

let cachedDb: Awaited<ReturnType<typeof connectDB>> | null = null;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try to connect to DB
    if (!cachedDb) {
      cachedDb = await connectDB();
    }

    const { id } = await params;
    
    // If DB not connected, use fallback data
    if (!cachedDb) {
      const playlist = fallbackPlaylists.find(p => p._id === id);
      
      if (!playlist) {
        return NextResponse.json(
          { success: false, error: 'Playlist not found' },
          { status: 404 }
        );
      }

      // Populate musics
      const populatedPlaylist = {
        ...playlist,
        musics: playlist.musics.map((musicId: string) => {
          const index = parseInt(musicId.replace('music-', ''));
          return fallbackMusic[index] || null;
        }).filter(Boolean)
      };
      
      return NextResponse.json({
        success: true,
        data: populatedPlaylist,
        isFallback: true
      });
    }

    const playlist = await Playlist.findById(id).populate('musics');
    
    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    
    // Try fallback on error
    const { id } = await params.catch(() => ({ id: '' }));
    const playlist = fallbackPlaylists.find(p => p._id === id);
    
    if (playlist) {
      return NextResponse.json({
        success: true,
        data: {
          ...playlist,
          musics: playlist.musics.map((musicId: string) => {
            const index = parseInt(musicId.replace('music-', ''));
            return fallbackMusic[index] || null;
          }).filter(Boolean)
        },
        isFallback: true
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
