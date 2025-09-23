/**
 * API: Device Heartbeat
 * Endpoint para dispositivos reportarem que estão online
 * FRIAXIS v4.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

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
    
    // Verificar se é um POST válido
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    console.log(`💓 Heartbeat received from device: ${deviceId}`);

    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Parse body safely
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      console.log('No JSON body provided, using empty object');
    }

    // Create database connection - dynamic import to avoid webpack issues
    const { default: postgres } = await import('postgres');
    sql = postgres(process.env.DATABASE_URL, {
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
    } = body as any;

    // Update device with heartbeat and current status (using correct columns)
    const updateResult = await sql`
      UPDATE devices 
      SET 
        last_heartbeat = NOW(),
        last_seen_at = NOW(),
        last_checkin_at = NOW(),
        status = 'online',
        battery_level = ${battery_level || null},
        battery_status = ${battery_status || 'unknown'},
        location_lat = ${location_lat || null},
        location_lng = ${location_lng || null},
        location_accuracy = ${location_accuracy || null},
        location_timestamp = ${location_lat && location_lng ? sql`NOW()` : sql`location_timestamp`},
        network_info = ${network_info ? JSON.stringify(network_info) : sql`network_info`},
        updated_at = NOW()
      WHERE id = ${deviceId}
      RETURNING 
        id, 
        name, 
        last_heartbeat,
        last_seen_at,
        status,
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
    console.log(`   Status: ${device.status}`);

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Heartbeat recorded',
      device: {
        id: device.id,
        name: device.name,
        last_heartbeat: device.last_heartbeat,
        last_seen_at: device.last_seen_at,
        status: device.status,
        battery_level: device.battery_level,
        location_lat: device.location_lat,
        location_lng: device.location_lng,
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