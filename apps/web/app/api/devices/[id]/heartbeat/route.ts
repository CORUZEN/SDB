/**
 * API: Device Heartbeat
 * Endpoint para dispositivos reportarem que estão online
 * FRIAXIS v4.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// ================================
// POST /api/devices/[id]/heartbeat
// ================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sql: any;
  
  try {
    const deviceId = params.id;
    const body = await request.json();
    
    console.log(`💓 Heartbeat received from device: ${deviceId}`);

    // Create database connection
    sql = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Extract device status data from request body
    const {
      battery_level,
      battery_status,
      location_lat,
      location_lng,
      location_accuracy,
      network_info,
      app_version,
      os_version,
    } = body;

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
        location_accuracy = ${location_accuracy || null},
        location_timestamp = NOW(),
        updated_at = NOW()
      WHERE id = ${deviceId}
      RETURNING 
        id, 
        name, 
        last_heartbeat,
        battery_level,
        location_lat,
        location_lng
    `;

    if (updateResult.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const device = updateResult[0];
    
    console.log(`✅ Heartbeat updated for ${device.name}:`);
    console.log(`   Battery: ${device.battery_level}%`);
    console.log(`   Location: ${device.location_lat}, ${device.location_lng}`);

    await sql.end();

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
    
    if (sql) {
      try {
        await sql.end();
      } catch (endError) {
        console.error('Error closing database connection:', endError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to record heartbeat', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}