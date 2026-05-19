import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { robloxCloud } from '@/lib/roblox';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type') || 'Companion'; // 'Companion' or 'Player'

  if (!userId) {
    return NextResponse.json({ error: "UserID is required" }, { status: 400 });
  }

  const dsInfo = MAPPING[type];
  if (!dsInfo) {
    return NextResponse.json({ error: "Invalid data type" }, { status: 400 });
  }

  const results: any = {
    userId,
    type,
    redis: { status: 'pending', data: null },
    openCloud: { status: 'pending', data: null, error: null },
    syncStatus: 'unknown',
    config: {
      universeId: process.env.ROGPT_UNIVERSE_ID ? "Configured" : "MISSING",
      apiKey: process.env.ROBLOX_API_KEY ? "Configured" : "MISSING"
    }
  };

  console.log(`[TestSync] Diagnostics for ${type} (UserID: ${userId})`);

  try {
    // 1. Check Redis
    if (redis) {
      const redisKey = `datastore:${type}_${userId}`;
      const redisData = await redis.get(redisKey);
      results.redis.status = redisData ? 'found' : 'not_found';
      results.redis.data = redisData;
    }

    // 2. Check Open Cloud
    if (process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      try {
        const cloudData = await robloxCloud.getEntry(dsInfo.name, userId, dsInfo.scope);
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
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const MAPPING: Record<string, { name: string; scope: string }> = {
  Companion: { name: "CompanionDataStore", scope: "Companions" },
  Player: { name: "MainDataStore", scope: "Players" },
};
