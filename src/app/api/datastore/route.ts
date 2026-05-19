import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { robloxCloud } from '@/lib/roblox';

const DATASTORE_TTL = 86400 * 7; // 7 days persistence
const ROBLOX_DATASTORE_NAME = "CompanionDataStore"; // Matches DATASTORE_NAME in Lua

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

      // DATA CONSISTENCY: If this is a companion sync, update the bot config too
      if (key.startsWith("Companion_") && value.name) {
        const userId = key.replace("Companion_", "");
        const configKey = `companion_config:${userId}`;
        
        const existingConfig = await redis.get(configKey) as any;
        const updatedConfig = {
          name: value.name,
          persona: existingConfig?.persona || "You are an intelligent Roblox NPC. You should be loyal and helpful to your owner.",
          ownerName: existingConfig?.ownerName || "Owner"
        };
        
        await redis.set(configKey, updatedConfig);
      }

      // OPTIONAL: Also push to Open Cloud for absolute persistence
      // We do this in a background-like way (no await) to keep the response fast
      if (process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
        robloxCloud.setEntry(ROBLOX_DATASTORE_NAME, key, value).catch(err => {
          console.warn("Failed to push to Roblox Open Cloud:", err.message);
        });
      }

      return NextResponse.json({ success: true, message: "Data synced to Redis" });
    }

    if (action === "fetch") {
      // 1. Try Redis first (fast)
      let data = await redis.get(redisKey);
      
      // 2. Fallback to Roblox Open Cloud (source of truth)
      if (!data && process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
        console.log(`Key [${key}] not in Redis, fetching from Open Cloud...`);
        try {
          data = await robloxCloud.getEntry(ROBLOX_DATASTORE_NAME, key);
          if (data) {
            // Backfill Redis
            await redis.set(redisKey, data, { ex: DATASTORE_TTL });
          }
        } catch (err) {
          console.error("Open Cloud fetch failed:", err);
        }
      }

      return NextResponse.json({ success: true, value: data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("DataStore API Error:", error);
    return NextResponse.json({ success: false, error: "Server error: " + ((error as Error).message || "Unknown error") }, { status: 500 });
  }
}
