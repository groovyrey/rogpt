import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log the request from Roblox for debugging
    console.log('Received data from Roblox:', body);

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to rogpt-server',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing Roblox request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Roblox API endpoint is active',
  });
}
