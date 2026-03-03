import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Music } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const genre = searchParams.get('genre');
    const artist = searchParams.get('artist');

    let query: Record<string, unknown> = {};
    if (genre) query.genre = genre;
    if (artist) query.artist = artist;

    const musics = await Music.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Music.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: musics,
      total,
      hasMore: skip + musics.length < total
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch music' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const music = await Music.create(body);
    
    return NextResponse.json({
      success: true,
      data: music
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating music:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create music' },
      { status: 500 }
    );
  }
}
