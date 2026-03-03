import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Music, Video } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'music', 'video', 'all'

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        music: [],
        videos: []
      });
    }

    const searchRegex = new RegExp(query, 'i');

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
    return NextResponse.json(
      { success: false, error: 'Failed to search' },
      { status: 500 }
    );
  }
}
