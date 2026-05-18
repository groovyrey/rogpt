import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.ROBLOX_API_KEY || "roblox-to-gpt-secret-123";
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Log the request from Roblox for debugging
    console.log('Received data from Roblox:', body);

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to rogpt-server',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error processing Roblox request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Roblox API endpoint is active',
  });
}
