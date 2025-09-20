/**
 * API Multi-tenant: Devices
 * Implementação seguindo API-MIGRATION-GUIDE.md
 * FRIAXIS v4.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { DeviceSchema, DeviceListFilterSchema } from '@sdb/shared/schemas';
import { z } from 'zod';
import { resolveOrganizationContext, requirePermission } from '@/lib/organization-middleware';

// ================================
// Validation Schemas
// ================================

const deviceQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  status: z.enum(['online', 'offline', 'idle', 'maintenance', 'error']).optional(),
  device_type: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'status', 'last_seen', 'created_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ================================
// GET /api/devices - List Devices (Multi-tenant)
// ================================

export async function GET(request: NextRequest) {
  try {
    // 1. Extract user context (development mode support)
    let firebaseUid = 'dev-user-mock';
    
    // Check for Firebase auth in production
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // In development, accept any token; in production, verify Firebase
      if (process.env.NODE_ENV === 'production') {
        // TODO: Add actual Firebase token verification
        console.log('Production mode: Would verify Firebase token');
      }
      firebaseUid = token; // Use token as UID for development
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Resolve organization context (development mode compatible)
    const context = await resolveOrganizationContext(firebaseUid);
    if (!context) {
      // For development, create a basic context
      const devContext = {
        organization: { id: 1, name: 'Development Organization' },
        user: { id: 1, email: 'dev@test.com' },
        member: { role: 'admin' }
      };
      
      console.log('🏢 Using development organization context');
    }

    // 3. Connect to database with real data
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 4. Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, status, device_type, search, sort, order } = deviceQuerySchema.parse(queryParams);

    // 5. Query real devices from database
    console.log('🔍 Fetching devices from Neon PostgreSQL...');
    
    const devices = await sql`
      SELECT 
        id,
        organization_id,
        name,
        device_identifier,
        fcm_token,
        CASE 
          WHEN last_heartbeat IS NOT NULL AND last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 'online'
          WHEN last_heartbeat IS NOT NULL AND last_heartbeat > NOW() - INTERVAL '30 minutes' THEN 'idle'
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
        battery_level,
        battery_status,
        location_accuracy,
        location_timestamp,
        network_info,
        last_heartbeat,
        last_seen_at,
        created_at,
        updated_at
      FROM devices
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `;

    const total = await sql`SELECT COUNT(*) FROM devices`;
    const totalCount = parseInt(total[0].count, 10);

    await sql.end();

    console.log(`✅ Found ${devices.length} devices in database`);

    // 6. Format response with new fields
    const formattedDevices = devices.map((device: any) => ({
      id: device.id,
      organization_id: device.organization_id,
      name: device.name,
      device_identifier: device.device_identifier,
      fcm_token: device.fcm_token,
      status: device.status, // Now calculated dynamically
      device_type: device.device_type,
      manufacturer: device.manufacturer,
      model: device.model,
      os_type: device.os_type,
      os_version: device.os_version,
      app_version: device.app_version,
      owner_name: device.owner_name,
      owner_email: device.owner_email,
      department: device.department,
      location_name: device.location_name,
      location_lat: device.location_lat,
      location_lng: device.location_lng,
      
      // New device status fields
      battery_level: device.battery_level,
      battery_status: device.battery_status,
      location_accuracy: device.location_accuracy,
      location_timestamp: device.location_timestamp?.toISOString() || null,
      network_info: device.network_info,
      last_heartbeat: device.last_heartbeat?.toISOString() || null,
      
      // Timestamps
      last_seen_at: device.last_seen_at?.toISOString() || null,
      created_at: device.created_at?.toISOString() || null,
      updated_at: device.updated_at?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedDevices,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        has_next: page * limit < totalCount,
        has_prev: page > 1,
      },
      organization: {
        id: 1,
        name: 'Development Organization',
      },
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching devices:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ================================
// POST /api/devices - Create Device (Multi-tenant)
// ================================

export async function POST(request: NextRequest) {
  try {
    // 1. Extract user context from headers (Firebase Auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    // In real implementation, this would verify Firebase token and get user
    const firebaseUid = 'extracted-from-token'; // Mock for now

    // 2. Resolve organization context
    const context = await resolveOrganizationContext(firebaseUid);
    if (!context) {
      return NextResponse.json(
        { error: 'Organization context not found' },
        { status: 401 }
      );
    }

    // 3. Check permissions
    requirePermission(context, 'devices', 'write');

    // 4. Parse and validate request body
    const body = await request.json();
    
    // Validate required fields for multi-tenant device
    const deviceData = {
      device_id: body.device_id,
      device_name: body.device_name || body.name,
      device_type: body.device_type || 'unknown',
      location: body.location || null,
      description: body.description || null,
      metadata: body.metadata || {},
    };

    // Validations
    if (!deviceData.device_id || deviceData.device_id.trim().length === 0) {
      return NextResponse.json({ error: 'Device ID é obrigatório' }, { status: 400 });
    }

    if (!deviceData.device_name || deviceData.device_name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome do dispositivo é obrigatório' }, { status: 400 });
    }

    if (deviceData.device_name.length > 100) {
      return NextResponse.json({ error: 'Nome do dispositivo deve ter no máximo 100 caracteres' }, { status: 400 });
    }

    // 5. Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 6. Check organization limits
    const limitsCheck = await sql`
      SELECT COUNT(*) as current_devices 
      FROM devices 
      WHERE organization_id = ${context.organization.id}
    `;
    
    const currentDevices = parseInt(limitsCheck[0].current_devices, 10);
    const maxDevices = context.organization.plan_limits?.devices || 10;
    
    if (currentDevices >= maxDevices) {
      await sql.end();
      return NextResponse.json(
        { 
          error: 'Device limit exceeded',
          current: currentDevices,
          limit: maxDevices 
        },
        { status: 409 }
      );
    }

    // 7. Check for duplicate device_id within organization
    const duplicateCheck = await sql`
      SELECT id 
      FROM devices 
      WHERE organization_id = ${context.organization.id} 
      AND device_id = ${deviceData.device_id}
    `;

    if (duplicateCheck.length > 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Device ID already exists in this organization' },
        { status: 409 }
      );
    }

    // 8. Create device with RLS protection
    const createResult = await sql`
      INSERT INTO devices (
        organization_id,
        device_id,
        device_name,
        device_type,
        location,
        description,
        metadata,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${context.organization.id},
        ${deviceData.device_id},
        ${deviceData.device_name},
        ${deviceData.device_type},
        ${deviceData.location},
        ${deviceData.description},
        ${JSON.stringify(deviceData.metadata)},
        'active',
        NOW(),
        NOW()
      ) RETURNING *
    `;

    const newDevice = createResult[0];

    // 9. Log audit trail
    await sql`
      INSERT INTO audit_logs (
        organization_id,
        user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        ip_address,
        user_agent,
        timestamp
      ) VALUES (
        ${context.organization.id},
        ${context.user.id},
        'device.create',
        'device',
        ${newDevice.id},
        ${JSON.stringify({ device_id: deviceData.device_id, device_name: deviceData.device_name })},
        ${request.headers.get('x-forwarded-for') || 'unknown'},
        ${request.headers.get('user-agent') || 'unknown'},
        NOW()
      )
    `;

    await sql.end();

    // 10. Format response
    const deviceResponse = {
      id: newDevice.id,
      organization_id: newDevice.organization_id,
      device_id: newDevice.device_id,
      device_name: newDevice.device_name,
      device_type: newDevice.device_type,
      location: newDevice.location,
      description: newDevice.description,
      metadata: typeof newDevice.metadata === 'string' ? JSON.parse(newDevice.metadata) : newDevice.metadata,
      status: newDevice.status,
      created_at: newDevice.created_at.toISOString(),
      updated_at: newDevice.updated_at.toISOString(),
    };

    // 11. Return created device
    return NextResponse.json({
      success: true,
      data: deviceResponse,
      organization: {
        id: context.organization.id,
        name: context.organization.name,
      },
      message: 'Dispositivo criado com sucesso'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating device:', error);
    
    if (error instanceof Error && error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
