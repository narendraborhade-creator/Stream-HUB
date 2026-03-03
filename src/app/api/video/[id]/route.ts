import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Video } from '@/lib/models';
import { fallbackVideos } from '../../seed/route';

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
      const video = fallbackVideos.find(v => v._id === id);
      
      if (!video) {
        return NextResponse.json(
          { success: false, error: 'Video not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: video,
        isFallback: true
      });
    }

    const video = await Video.findById(id);
    
    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    return NextResponse.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    
    // Try fallback on error
    const { id } = await params.catch(() => ({ id: '' }));
    const video = fallbackVideos.find(v => v._id === id);
    
    if (video) {
      return NextResponse.json({
        success: true,
        data: video,
        isFallback: true
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
