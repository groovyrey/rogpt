import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { robloxCloud } from '@/lib/roblox';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  // ... (no changes to GET)
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const redisKey = `datastore:Player_${userId}`;

  try {
    const body = await request.json();
    const { coins, weapon } = body;

    if (!redis) throw new Error("Redis not configured");

    // 1. Fetch current data to ensure we don't wipe other fields (inventory, etc.)
    let currentData: any = await redis.get(redisKey);
    if (!currentData && process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      currentData = await robloxCloud.getEntry("MainDataStore", userId, "Players");
    }

    const updatedData = {
      ...(currentData || { inventory: [], player_settings: {} }),
      coins: coins !== undefined ? Number(coins) : currentData?.coins,
      weapon: weapon || currentData?.weapon
    };

    // 2. Update Redis
    await redis.set(redisKey, updatedData, { ex: 86400 * 7 });

    // 3. Update Roblox Open Cloud
    if (process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      await robloxCloud.setEntry("MainDataStore", userId, updatedData, "Players");
    }

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
