import { NextResponse } from 'next/server';
import { cachedDataStore } from './store';

export async function POST(request: Request) {
  try {
    const { action, key, value } = await request.json();

    if (action === "sync") {
      // Roblox is sending data to the server
      cachedDataStore[key] = value;
      console.log(`Synced DataStore Key [${key}]:`, value);
      return NextResponse.json({ success: true, message: "Data synced to server" });
    }

    if (action === "fetch") {
      // Roblox is asking for the server's version of the data
      return NextResponse.json({ success: true, value: cachedDataStore[key] });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
