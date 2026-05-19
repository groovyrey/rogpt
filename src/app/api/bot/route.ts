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
  const configKey = `companion_config:${userId}`;
  const datastoreKey = `datastore:Companion_${userId}`;

  try {
    if (!redis) throw new Error("Redis not configured");
    
    // 1. Fetch Web Config
    const config = await redis.get(configKey) as any;
    
    // 2. Fetch Roblox DataStore (Source of Truth for name)
    const datastoreData = await redis.get(datastoreKey) as any;

    return NextResponse.json({
      name: config?.name || datastoreData?.name || "Gemma",
      persona: config?.persona || "You are an intelligent Roblox NPC. You should be loyal and helpful to your owner.",
      ownerName: config?.ownerName || datastoreData?.ownerName || session.user.name || "Owner"
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
  const configKey = `companion_config:${userId}`;

  try {
    const body = await request.json();
    const { name, persona, ownerName } = body;

    if (!redis) throw new Error("Redis not configured");

    const newConfig = {
      name: name || "Gemma",
      persona: persona || "",
      ownerName: ownerName || session.user.name || "Owner"
    };

    // 1. Update Redis (Web UI config)
    await redis.set(configKey, newConfig);

    // 2. Update Roblox DataStore (Open Cloud)
    // We fetch the existing datastore object to avoid overwriting things like chat_history
    if (process.env.ROGPT_UNIVERSE_ID && process.env.ROBLOX_API_KEY) {
      try {
        const existingData = await robloxCloud.getEntry("CompanionDataStore", userId, "Companions") as any;
        const updatedData = {
          ...(existingData || {}),
          name: newConfig.name,
          ownerName: newConfig.ownerName
          // Note: persona is primarily a web-side instruction, but we could save it too if needed
        };
        await robloxCloud.setEntry("CompanionDataStore", userId, updatedData, "Companions");
        console.log(`[BotSync] Pushed name update to Roblox for ${userId}`);
      } catch (cloudErr) {
        console.warn("[BotSync] Failed to push to Open Cloud:", cloudErr);
      }
    }

    return NextResponse.json({ success: true, config: newConfig });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
