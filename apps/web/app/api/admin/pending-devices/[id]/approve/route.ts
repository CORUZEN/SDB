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
  // Get auth token from headers
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                   request.headers.get('x-auth-token');

  if (!authToken) {
    throw new Error('Authentication required');
  }

  // Mock organization context for development
  return {
    organization: {
      id: 'org_development_001',
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

    const deviceId = params.id;
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 3. Find pending device registration (with RLS)
    const registration = await sql`
      SELECT * FROM device_registrations 
      WHERE id = ${deviceId}
      AND status = 'pending'
      AND expires_at > NOW()
      AND organization_id = ${context.organization.id}
    `;

    if (registration.length === 0) {
      await sql.end();
      return NextResponse.json({ 
        error: 'Registration not found, expired, or not from your organization' 
      }, { status: 404 });
    }

    const reg = registration[0];

    // 4. Create device in main table with organization isolation
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
        ${reg.device_id},
        ${context.organization.id},
        ${reg.name},
        'offline',
        ${reg.device_id},
        ${reg.device_id},
        'smartphone',
        'Unknown',
        ${reg.model},
        'android',
        ${reg.android_version},
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
      AND organization_id = ${context.organization.id}
    `;

    await sql.end();

    console.log(`✅ Device approved: ${reg.name} for organization: ${context.organization.name}`);

    return NextResponse.json({
      success: true,
      message: 'Device approved successfully',
      device: {
        id: reg.device_id,
        name: reg.name,
        model: reg.model,
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