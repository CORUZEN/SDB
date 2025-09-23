import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Buscar dispositivos criados nas últimas 24 horas com pairing code
    const devices = await sql`
      SELECT 
        id,
        name,
        metadata,
        created_at,
        status
      FROM devices 
      WHERE metadata ? 'pairing_code'
      AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    await sql.end();
    
    const devicesWithCodes = devices.map(device => ({
      id: device.id,
      name: device.name,
      status: device.status,
      pairing_code: device.metadata?.pairing_code,
      created_at: device.created_at
    }));
    
    return NextResponse.json({
      success: true,
      recent_devices: devicesWithCodes,
      count: devices.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}