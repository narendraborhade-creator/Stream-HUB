import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Playlist } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();
    
    const playlists = await Playlist.find({ isPublic: true })
      .populate('musics')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: playlists
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
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
