import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
          key.includes('DATABASE') || 
          key.includes('POSTGRES') || 
          key.includes('NEON')
        )
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}