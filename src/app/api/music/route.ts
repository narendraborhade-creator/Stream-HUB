import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Music } from '@/lib/models';
import { fallbackMusic } from '../seed/route';

let dbConnected = false;
let cachedDb: Awaited<ReturnType<typeof connectDB>> | null = null;

export async function GET(request: Request) {
  try {
    // Try to connect to DB
    if (!cachedDb) {
      cachedDb = await connectDB();
    }
    dbConnected = !!cachedDb;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const genre = searchParams.get('genre');
    const artist = searchParams.get('artist');

    // If DB not connected, use fallback data
    if (!dbConnected || !cachedDb) {
      let filteredMusic = [...fallbackMusic];
      
      if (genre) {
        filteredMusic = filteredMusic.filter(m => m.genre === genre);
      }
      if (artist) {
        filteredMusic = filteredMusic.filter(m => m.artist === artist);
      }

      const total = filteredMusic.length;
      const paginatedMusic = filteredMusic.slice(skip, skip + limit);

      return NextResponse.json({
        success: true,
        data: paginatedMusic,
        total,
        hasMore: skip + paginatedMusic.length < total,
        isFallback: true
      });
    }

    // DB is connected, use MongoDB
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
    
    // Return fallback data on error
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    return NextResponse.json({
      success: true,
      data: fallbackMusic.slice(skip, skip + limit),
      total: fallbackMusic.length,
      hasMore: skip + fallbackMusic.length < fallbackMusic.length,
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
    dbConnected = !!cachedDb;

    // If DB not connected, return error
    if (!dbConnected || !cachedDb) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

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
