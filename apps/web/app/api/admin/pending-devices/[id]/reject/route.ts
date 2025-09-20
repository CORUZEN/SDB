/**
 * API Multi-tenant: Reject Pending Device
 * /api/admin/pending-devices/[id]/reject
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
      id: 1, // Usar ID numérico para compatibilidade com banco
      role: 'admin',
      permissions: ['devices:read', 'devices:write', 'devices:admin']
    }
  };
}

// POST /api/admin/pending-devices/[id]/reject - Reject device
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('❌ Rejecting pending device:', params.id);

    // 1. Get organization context
    const context = await getOrganizationContext(request);
    
    // 2. Check admin permissions
    if (!context.user.permissions.includes('devices:admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for device rejection' },
        { status: 403 }
      );
    }

    const deviceId = params.id;
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 3. Reject device with organization isolation (RLS)
    const result = await sql`
      UPDATE device_registrations 
      SET 
        status = 'rejected', 
        approved_at = NOW(), 
        approved_by = ${context.user.id}
      WHERE id = ${deviceId}
      AND organization_id = ${context.organization.id}
      AND status = 'pending'
      RETURNING name, model, pairing_code
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found or not from your organization' 
      }, { status: 404 });
    }

    const rejected = result[0];

    console.log(`❌ Device rejected: ${rejected.name} for organization: ${context.organization.name}`);

    return NextResponse.json({
      success: true,
      message: 'Device rejected successfully',
      device: {
        id: deviceId,
        name: rejected.name,
        model: rejected.model,
        pairing_code: rejected.pairing_code,
        organization: context.organization.name
      }
    });

  } catch (error: any) {
    console.error('❌ Error rejecting device:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}