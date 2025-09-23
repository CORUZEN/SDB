import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Buscar TODOS os dispositivos para debug
    const devices = await sql`
      SELECT 
        id,
        name,
        metadata,
        created_at,
        status
      FROM devices 
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      all_devices: devices,
      count: devices.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}