import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Music } from '@/lib/models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const music = await Music.findById(id);
    
    if (!music) {
      return NextResponse.json(
        { success: false, error: 'Music not found' },
        { status: 404 }
      );
    }

    // Increment play count
    await Music.findByIdAndUpdate(id, { $inc: { playCount: 1 } });
    
    return NextResponse.json({
      success: true,
      data: music
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch music' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    const music = await Music.findByIdAndUpdate(id, body, { new: true });
    
    if (!music) {
      return NextResponse.json(
        { success: false, error: 'Music not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: music
    });
  } catch (error) {
    console.error('Error updating music:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update music' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const music = await Music.findByIdAndDelete(id);
    
    if (!music) {
      return NextResponse.json(
        { success: false, error: 'Music not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting music:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete music' },
      { status: 500 }
    );
  }
}
