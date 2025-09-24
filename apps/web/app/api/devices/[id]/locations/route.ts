/**
 * API: Device Locations
 * GET /api/devices/[id]/locations - Get locations for device
 * POST /api/devices/[id]/locations - Add location for device
 * FRIAXIS v4.0.7
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// ================================
// GET /api/devices/[id]/locations - Get locations for device
// ================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    console.log(`🔍 Fetching locations for device: ${id}`);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Query locations for device
    const locations = await sql`
      SELECT 
        id,
        device_id,
        organization_id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        location_method,
        address,
        created_at
      FROM device_locations 
      WHERE device_id = ${id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    await sql.end();

    console.log(`✅ Found ${locations.length} locations for device`);

    return NextResponse.json({
      success: true,
      data: locations.map(loc => ({
        id: loc.id,
        device_id: loc.device_id,
        organization_id: loc.organization_id,
        latitude: parseFloat(loc.latitude) || 0,
        longitude: parseFloat(loc.longitude) || 0,
        accuracy: loc.accuracy,
        altitude: loc.altitude,
        speed: loc.speed,
        heading: loc.heading,
        location_method: loc.location_method,
        address: loc.address,
        created_at: loc.created_at
      }))
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching locations:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// ================================
// POST /api/devices/[id]/locations - Add location for device
// ================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`📍 Adding location for device: ${id}`, body);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Create location record
    const newLocation = await sql`
      INSERT INTO device_locations (
        device_id,
        organization_id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        location_method,
        address,
        created_at
      ) VALUES (
        ${id},
        1,
        ${body.latitude || 0},
        ${body.longitude || 0},
        ${body.accuracy || null},
        ${body.altitude || null},
        ${body.speed || null},
        ${body.heading || null},
        ${body.location_method || 'gps'},
        ${body.address || null},
        NOW()
      )
      RETURNING *
    `;

    await sql.end();

    if (!newLocation || newLocation.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create location record' 
        },
        { status: 500 }
      );
    }

    const location = newLocation[0];

    console.log(`✅ Location created: ${location.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: location.id,
        device_id: location.device_id,
        organization_id: location.organization_id,
        latitude: parseFloat(location.latitude) || 0,
        longitude: parseFloat(location.longitude) || 0,
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        location_method: location.location_method,
        address: location.address,
        created_at: location.created_at
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error creating location:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}