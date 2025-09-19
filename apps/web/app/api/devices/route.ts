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
  status: z.enum(['online', 'offline', 'maintenance', 'error']).optional(),
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
    requirePermission(context, 'devices', 'read');

    // 4. Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, status, device_type, search, sort, order } = deviceQuerySchema.parse(queryParams);

    // 5. Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 6. Build query with RLS (organization_id automatically filtered)
    let query = `
      SELECT 
        d.*,
        dt.last_telemetry_at,
        CASE 
          WHEN dt.last_telemetry_at > NOW() - INTERVAL '5 minutes' THEN 'online'
          WHEN dt.last_telemetry_at > NOW() - INTERVAL '1 hour' THEN 'offline'
          ELSE 'inactive'
        END as computed_status
      FROM devices d
      LEFT JOIN (
        SELECT 
          device_id,
          MAX(timestamp) as last_telemetry_at
        FROM device_telemetry 
        WHERE organization_id = $1
        GROUP BY device_id
      ) dt ON d.id = dt.device_id
      WHERE d.organization_id = $1
    `;

    const queryParams_db: (string | number)[] = [context.organization.id];
    let paramIndex = 2;

    // Add filters
    if (status) {
      if (status === 'online') {
        query += ` AND dt.last_telemetry_at > NOW() - INTERVAL '5 minutes'`;
      } else if (status === 'offline') {
        query += ` AND dt.last_telemetry_at BETWEEN NOW() - INTERVAL '1 hour' AND NOW() - INTERVAL '5 minutes'`;
      } else if (status === 'maintenance') {
        query += ` AND d.status = 'maintenance'`;
      } else if (status === 'error') {
        query += ` AND d.status = 'error'`;
      }
    }

    if (device_type) {
      query += ` AND d.device_type = $${paramIndex}`;
      queryParams_db.push(device_type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (d.device_name ILIKE $${paramIndex} OR d.device_id ILIKE $${paramIndex})`;
      queryParams_db.push(`%${search}%`);
      paramIndex++;
    }

    // Add sorting
    const sortColumn = sort === 'name' ? 'd.device_name' : 
                      sort === 'status' ? 'computed_status' :
                      sort === 'last_seen' ? 'dt.last_telemetry_at' :
                      'd.created_at';
    
    query += ` ORDER BY ${sortColumn} ${order.toUpperCase()}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams_db.push(limit, offset);

    // 7. Execute queries
    const [devicesResult, countResult] = await Promise.all([
      sql.unsafe(query, queryParams_db),
      sql.unsafe(
        'SELECT COUNT(*) FROM devices WHERE organization_id = $1',
        [context.organization.id]
      ),
    ]);

    const devices = devicesResult.map((d: any) => ({
      ...d,
      created_at: d.created_at?.toISOString() || null,
      updated_at: d.updated_at?.toISOString() || null,
      last_seen_at: d.last_seen_at?.toISOString() || null,
      last_telemetry_at: d.last_telemetry_at?.toISOString() || null,
    }));

    const total = parseInt(countResult[0].count, 10);

    await sql.end();

    // 8. Return paginated response
    return NextResponse.json({
      success: true,
      data: devices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      organization: {
        id: context.organization.id,
        name: context.organization.name,
      },
    });

  } catch (error: unknown) {
    console.error('Error fetching devices:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

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
