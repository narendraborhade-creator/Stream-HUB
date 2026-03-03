import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/entertainment_app';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

let isConnected: boolean | 'failed' = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  // If already connected, return cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // If connection already failed once, return null (will use fallback)
  if (isConnected === 'failed') {
    return null;
  }

  try {
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
      isConnected = true;
    } catch (e) {
      cached.promise = null;
      isConnected = 'failed';
      console.warn('MongoDB connection failed, using fallback data');
      return null;
    }

    return cached.conn;
  } catch (e) {
    isConnected = 'failed';
    console.warn('MongoDB connection failed, using fallback data');
    return null;
  }
}

export default connectDB;
