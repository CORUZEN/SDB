import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID
    }
  });
}