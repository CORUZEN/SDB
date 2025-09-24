/**
 * API: Individual Device Operations
 * GET /api/devices/[id] - Get device by ID
 * PUT /api/devices/[id] - Update device
 * DELETE /api/devices/[id] - Delete device
 * FRIAXIS v4.0.7
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// ================================
// GET /api/devices/[id] - Get device by ID
// ================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`🔍 Fetching device by ID: ${id}`);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Query device by ID
    const device = await sql`
      SELECT 
        id,
        organization_id,
        name,
        device_identifier,
        fcm_token,
        CASE 
          WHEN last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 'online'
          WHEN last_heartbeat > NOW() - INTERVAL '1 hour' THEN 'idle'
          ELSE 'offline'
        END as status,
        device_type,
        manufacturer,
        model,
        os_type,
        os_version,
        app_version,
        owner_name,
        owner_email,
        department,
        location_name,
        location_lat,
        location_lng,
        last_heartbeat,
        last_command_check,
        battery_level,
        storage_available,
        network_type,
        tags,
        notes,
        created_at,
        updated_at
      FROM devices 
      WHERE id = ${id}
      LIMIT 1
    `;

    await sql.end();

    if (!device || device.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Device not found' 
        },
        { status: 404 }
      );
    }

    const foundDevice = device[0];

    console.log(`✅ Device found: ${foundDevice.name}`);

    return NextResponse.json({
      success: true,
      data: {
        id: foundDevice.id,
        organization_id: foundDevice.organization_id,
        name: foundDevice.name,
        device_identifier: foundDevice.device_identifier,
        fcm_token: foundDevice.fcm_token,
        status: foundDevice.status,
        device_type: foundDevice.device_type,
        manufacturer: foundDevice.manufacturer,
        model: foundDevice.model,
        os_type: foundDevice.os_type,
        os_version: foundDevice.os_version,
        app_version: foundDevice.app_version,
        owner_name: foundDevice.owner_name,
        owner_email: foundDevice.owner_email,
        department: foundDevice.department,
        location_name: foundDevice.location_name,
        location_lat: foundDevice.location_lat,
        location_lng: foundDevice.location_lng,
        last_heartbeat: foundDevice.last_heartbeat,
        last_command_check: foundDevice.last_command_check,
        battery_level: foundDevice.battery_level,
        storage_available: foundDevice.storage_available,
        network_type: foundDevice.network_type,
        tags: foundDevice.tags,
        notes: foundDevice.notes,
        created_at: foundDevice.created_at,
        updated_at: foundDevice.updated_at
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching device by ID:', error);
    
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
// PUT /api/devices/[id] - Update device
// ================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`🔄 Updating device: ${id}`, body);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Update device
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        name = ${body.name || null},
        owner_name = ${body.owner_name || null},
        owner_email = ${body.owner_email || null},
        department = ${body.department || null},
        location_name = ${body.location_name || null},
        location_lat = ${body.location_lat || null},
        location_lng = ${body.location_lng || null},
        tags = ${body.tags || null},
        notes = ${body.notes || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    await sql.end();

    if (!updatedDevice || updatedDevice.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Device not found' 
        },
        { status: 404 }
      );
    }

    console.log(`✅ Device updated: ${updatedDevice[0].name}`);

    return NextResponse.json({
      success: true,
      data: updatedDevice[0]
    });

  } catch (error: unknown) {
    console.error('❌ Error updating device:', error);
    
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
// DELETE /api/devices/[id] - Delete device
// ================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`🗑️ Deleting device: ${id}`);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Delete device
    const deletedDevice = await sql`
      DELETE FROM devices 
      WHERE id = ${id}
      RETURNING id, name
    `;

    await sql.end();

    if (!deletedDevice || deletedDevice.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Device not found' 
        },
        { status: 404 }
      );
    }

    console.log(`✅ Device deleted: ${deletedDevice[0].name}`);

    return NextResponse.json({
      success: true,
      message: `Device ${deletedDevice[0].name} deleted successfully`
    });

  } catch (error: unknown) {
    console.error('❌ Error deleting device:', error);
    
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