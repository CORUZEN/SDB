import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    service: 'FRIAXIS MDM API',
    environment: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID
    }
  });
}