import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  
  // We'll look for recent chat sessions. 
  // For simplicity, let's assume we store a list of active sessions for the user or just use a default one.
  // In the test page, it was randomized. Let's try to find keys matching 'chat_session:test-session-*'
  // Or better, let's just show the global or user-specific history if we refactor gemma route to use userId.
  
  try {
    if (!redis) throw new Error("Redis not configured");
    
    // For now, let's fetch a list of keys and get the most recent one, 
    // or just return an empty list if none found.
    // A better approach is to have a stable key for the dashboard.
    const historyKey = `chat_session:user_${userId}`;
    const history = await redis.get(historyKey);
    
    return NextResponse.json({ messages: history || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
