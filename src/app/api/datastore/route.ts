import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const DATASTORE_TTL = 86400 * 7; // 7 days persistence

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.ROBLOX_API_KEY || "roblox-to-gpt-secret-123";
    
    if (authHeader !== `Bearer ${secret}`) {
      console.warn("Unauthorized DataStore request attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, key, value } = await request.json();

    if (!redis) {
      return NextResponse.json({ success: false, error: "Redis not configured" }, { status: 500 });
    }

    const redisKey = `datastore:${key}`;

    if (action === "sync") {
      // Roblox is sending data to the server
      await redis.set(redisKey, value, { ex: DATASTORE_TTL });
      console.log(`Synced DataStore Key [${redisKey}]:`, value);
      return NextResponse.json({ success: true, message: "Data synced to Redis" });
    }

    if (action === "fetch") {
      // Roblox is asking for the server's version of the data
      const data = await redis.get(redisKey);
      return NextResponse.json({ success: true, value: data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("DataStore API Error:", error);
    return NextResponse.json({ success: false, error: "Server error: " + ((error as Error).message || "Unknown error") }, { status: 500 });
  }
}
