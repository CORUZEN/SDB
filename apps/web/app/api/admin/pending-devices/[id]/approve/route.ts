/**
 * API Multi-tenant: Approve Pending Device
 * /api/admin/pending-devices/[id]/approve
 * FRIAXIS v4.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// ================================
// Multi-tenant Helper Functions
// ================================

async function getOrganizationContext(request: NextRequest) {
  // Development mode - accept any context
  if (process.env.NODE_ENV === 'development') {
    return {
      organization: {
        id: 1, // Usar ID numérico para o banco
        name: 'Development Organization',
        slug: 'dev-org'
      },
      user: {
        id: 'user_dev_001',
        role: 'admin',
        permissions: ['devices:read', 'devices:write', 'devices:admin']
      }
    };
  }

  // Get auth token from headers for production
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                   request.headers.get('x-auth-token');

  if (!authToken) {
    throw new Error('Authentication required');
  }

  // TODO: In production, verify Firebase token and get user context
  return {
    organization: {
      id: 1, // Usar ID numérico para o banco
      name: 'Development Organization',
      slug: 'dev-org'
    },
    user: {
      id: 'user_dev_001',
      role: 'admin',
      permissions: ['devices:read', 'devices:write', 'devices:admin']
    }
  };
}

// POST /api/admin/pending-devices/[id]/approve - Approve device
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('✅ Approving pending device:', params.id);

    // 1. Get organization context
    const context = await getOrganizationContext(request);
    
    // 2. Check admin permissions
    if (!context.user.permissions.includes('devices:admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for device approval' },
        { status: 403 }
      );
    }

    const deviceId = parseInt(params.id); // Converter para número
    if (isNaN(deviceId)) {
      return NextResponse.json({ 
        error: 'Invalid device ID format' 
      }, { status: 400 });
    }
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 3. Find pending device registration
    const registration = await sql`
      SELECT * FROM device_registrations 
      WHERE id = ${deviceId}
      AND status = 'pending'
      AND expires_at > NOW()
    `;

    if (registration.length === 0) {
      await sql.end();
      return NextResponse.json({ 
        error: 'Registration not found, expired, or not from your organization' 
      }, { status: 404 });
    }

    const reg = registration[0];

    // 4. Create device in main table with organization isolation
    let deviceInfo: any = {};
    try {
      // Se device_info é string, fazer parse
      deviceInfo = typeof reg.device_info === 'string' 
        ? JSON.parse(reg.device_info) 
        : reg.device_info || {};
    } catch (e) {
      console.warn('⚠️ Error parsing device_info, using empty object');
      deviceInfo = {};
    }
    
    await sql`
      INSERT INTO devices (
        id,
        organization_id,
        name, 
        status, 
        device_identifier,
        serial_number,
        device_type,
        manufacturer,
        model,
        os_type,
        os_version,
        created_at, 
        updated_at
      ) VALUES (
        ${deviceInfo.device_id || reg.id},
        ${context.organization.id},
        ${deviceInfo.name || deviceInfo.device_name || 'Novo Dispositivo'},
        'offline',
        ${deviceInfo.device_id || reg.id},
        ${deviceInfo.device_id || reg.id},
        'smartphone',
        'Unknown',
        ${deviceInfo.model || deviceInfo.device_model || 'Unknown Model'},
        'android',
        ${deviceInfo.android_version || 'Unknown'},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        status = 'offline',
        updated_at = NOW()
    `;

    // 5. Mark registration as approved
    await sql`
      UPDATE device_registrations 
      SET 
        status = 'approved', 
        approved_at = NOW(), 
        approved_by = ${context.user.id}
      WHERE id = ${deviceId}
    `;

    await sql.end();

    console.log(`✅ Device approved: ${deviceInfo.name || 'Dispositivo'} for organization: ${context.organization.name}`);

    return NextResponse.json({
      success: true,
      message: 'Device approved successfully',
      device: {
        id: deviceInfo.device_id || reg.id,
        name: deviceInfo.name || deviceInfo.device_name || 'Novo Dispositivo',
        model: deviceInfo.model || deviceInfo.device_model || 'Unknown Model',
        organization: context.organization.name
      }
    });

  } catch (error: any) {
    console.error('❌ Error approving device:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}