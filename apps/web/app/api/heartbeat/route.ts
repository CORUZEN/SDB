/**
 * API: Device Heartbeat Alternative Route
 * POST /api/heartbeat
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// Database connection
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Heartbeat endpoint is working',
    method: 'GET',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, battery_level, battery_status, location_lat, location_lng } = body;
    
    if (!device_id) {
      return NextResponse.json(
        { error: 'device_id is required' },
        { status: 400 }
      );
    }

    console.log(`💓 Heartbeat received from device: ${device_id}`);

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Update device with heartbeat and current status
    const updateResult = await sql`
      UPDATE devices 
      SET 
        last_heartbeat = NOW(),
        last_seen_at = NOW(),
        battery_level = ${battery_level || null},
        battery_status = ${battery_status || 'unknown'},
        location_lat = ${location_lat || null},
        location_lng = ${location_lng || null},
        updated_at = NOW()
      WHERE id = ${device_id}
      RETURNING 
        id, 
        name, 
        last_heartbeat,
        battery_level
    `;

    await sql.end();

    if (updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const device = updateResult[0];
    
    console.log(`✅ Heartbeat updated for ${device.name}:`);
    console.log(`   Battery: ${device.battery_level}%`);

    return NextResponse.json({
      success: true,
      message: 'Heartbeat recorded',
      device: {
        id: device.id,
        name: device.name,
        last_heartbeat: device.last_heartbeat,
        status: 'online', // Will be online since heartbeat is recent
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('❌ Error recording heartbeat:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to record heartbeat', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}