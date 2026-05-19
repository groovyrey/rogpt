import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { robloxCloud } from '@/lib/roblox';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "UserID is required" }, { status: 400 });
  }

  const results: any = {
    userId,
    redis: { status: 'pending', data: null },
    openCloud: { status: 'pending', data: null, error: null },
    syncStatus: 'unknown'
  };

  try {
    // 1. Check Redis
    if (redis) {
      const redisData = await redis.get(`datastore:Companion_${userId}`);
      results.redis.status = redisData ? 'found' : 'not_found';
      results.redis.data = redisData;
    } else {
      results.redis.status = 'error';
      results.redis.error = 'Redis not configured';
    }

    // 2. Check Open Cloud
    if (process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      try {
        const cloudData = await robloxCloud.getEntry("CompanionDataStore", `Companion_${userId}`);
        results.openCloud.status = cloudData ? 'found' : 'not_found';
        results.openCloud.data = cloudData;
        
        if (cloudData && !results.redis.data) {
          results.syncStatus = 'needs_backfill';
        } else if (cloudData && results.redis.data) {
          results.syncStatus = 'synchronized';
        }
      } catch (err: any) {
        results.openCloud.status = 'error';
        results.openCloud.error = err.message;
      }
    } else {
      results.openCloud.status = 'not_configured';
      results.openCloud.error = 'Universe ID or API Key missing in .env';
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
