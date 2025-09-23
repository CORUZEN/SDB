import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Validate-pairing endpoint test working!',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'POST validate-pairing test working!',
      received: body
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON'
    }, { status: 400 });
  }
}