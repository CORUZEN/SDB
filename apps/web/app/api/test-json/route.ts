import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing request.json()...');
    
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Request parsing working',
      received_data: body
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}