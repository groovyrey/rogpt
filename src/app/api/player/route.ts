import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { robloxCloud } from '@/lib/roblox';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const redisKey = `datastore:Player_${userId}`;

  try {
    if (!redis) throw new Error("Redis not configured");
    
    // 1. Try Redis
    let data = await redis.get(redisKey);

    // 2. Try Open Cloud
    if (!data && process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      try {
        data = await robloxCloud.getEntry("MainDataStore", userId, "Players");
        if (data) {
          await redis.set(redisKey, data, { ex: 86400 * 7 });
        }
      } catch (err) {
        console.error("Failed to fetch player stats from Open Cloud:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: data || {
        weapon: "Fist",
        coins: 0,
        inventory: [],
        player_settings: {}
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
