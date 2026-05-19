import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Note: Using auth() if using NextAuth v5, but we used authOptions in the previous turn.
// Actually, we set up NextAuth in src/app/api/auth/[...nextauth]/route.ts.
// For NextAuth v4/v5 compatibility in App Router, we can use getServerSession.
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const configKey = `companion_config:${userId}`;

  try {
    if (!redis) throw new Error("Redis not configured");
    const config = await redis.get(configKey);
    return NextResponse.json(config || {
      name: session.user.name || "Gemma",
      persona: "You are an intelligent Roblox NPC. You should be loyal and helpful to your owner.",
      ownerName: session.user.name || "Owner"
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

    await redis.set(configKey, newConfig);
    return NextResponse.json({ success: true, config: newConfig });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
