import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Video } from '@/lib/models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
