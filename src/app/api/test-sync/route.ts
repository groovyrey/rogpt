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
    syncStatus: 'unknown',
    config: {
      universeId: process.env.ROGPT_UNIVERSE_ID ? "Configured" : "MISSING",
      apiKey: process.env.ROBLOX_API_KEY ? "Configured" : "MISSING"
    }
  };

  console.log(`[TestSync] Diagnostics for UserID: ${userId}`);

  try {
    // 1. Check Redis (Sync Key format: Companion_{userId})
    if (redis) {
      const redisKey = `datastore:Companion_${userId}`;
      const redisData = await redis.get(redisKey);
      results.redis.status = redisData ? 'found' : 'not_found';
      results.redis.data = redisData;
      console.log(`[TestSync] Redis Status: ${results.redis.status}`);
    }

    // 2. Check Open Cloud (Roblox format: name=CompanionDataStore, scope=Companions, key={userId})
    if (process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      try {
        const datastoreName = "CompanionDataStore";
        const scope = "Companions";
        const entryKey = userId;
        
        console.log(`[TestSync] Fetching Open Cloud: DS=${datastoreName}, Scope=${scope}, Key=${entryKey}`);
        
        const cloudData = await robloxCloud.getEntry(datastoreName, entryKey, scope);
        results.openCloud.status = cloudData ? 'found' : 'not_found';
        results.openCloud.data = cloudData;
        
        if (cloudData && !results.redis.data) {
          results.syncStatus = 'needs_backfill';
        } else if (cloudData && results.redis.data) {
          results.syncStatus = 'synchronized';
        }
        console.log(`[TestSync] Open Cloud Status: ${results.openCloud.status}`);
      } catch (err: any) {
        results.openCloud.status = 'error';
        results.openCloud.error = err.message;
        console.error(`[TestSync] Open Cloud Error:`, err.message);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error(`[TestSync] Critical Error:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
