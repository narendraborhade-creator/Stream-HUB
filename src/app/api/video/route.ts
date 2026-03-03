import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Video } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const category = searchParams.get('category');

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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
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
