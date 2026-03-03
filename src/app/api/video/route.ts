import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Video } from '@/lib/models';
import { fallbackVideos } from '../seed/route';

let cachedDb: Awaited<ReturnType<typeof connectDB>> | null = null;

export async function GET(request: Request) {
  try {
    // Try to connect to DB
    if (!cachedDb) {
      cachedDb = await connectDB();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const category = searchParams.get('category');

    // If DB not connected, use fallback data
    if (!cachedDb) {
      let filteredVideos = [...fallbackVideos];
      
      if (category) {
        filteredVideos = filteredVideos.filter(v => v.category === category);
      }

      const total = filteredVideos.length;
      const paginatedVideos = filteredVideos.slice(skip, skip + limit);

      return NextResponse.json({
        success: true,
        data: paginatedVideos,
        total,
        hasMore: skip + paginatedVideos.length < total,
        isFallback: true
      });
    }

    // DB is connected, use MongoDB
    let query: Record<string, unknown> = {};
    if (category) query.category = category;

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: videos,
      total,
      hasMore: skip + videos.length < total
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    
    // Return fallback data on error
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    return NextResponse.json({
      success: true,
      data: fallbackVideos.slice(skip, skip + limit),
      total: fallbackVideos.length,
      hasMore: skip + fallbackVideos.length < fallbackVideos.length,
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
    const video = await Video.create(body);
    
    return NextResponse.json({
      success: true,
      data: video
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
