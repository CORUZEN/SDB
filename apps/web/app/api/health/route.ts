import { NextResponse } from "next/server";
import { createCorsResponse, handlePreflight } from "@/lib/cors";

export async function OPTIONS() {
  return handlePreflight();
}

export async function GET() {
  return createCorsResponse({
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