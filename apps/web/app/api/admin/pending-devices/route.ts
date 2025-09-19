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
  // In production, this would verify Firebase token and get user context
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

// GET /api/admin/pending-devices - Listar dispositivos pendentes de aprovação (Multi-tenant)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching pending devices with multi-tenant isolation...');

    // 1. Get organization context
    const context = await getOrganizationContext(request);
    
    // 2. Check admin permissions
    if (!context.user.permissions.includes('devices:admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for pending devices management' },
        { status: 403 }
      );
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 3. Buscar registros pendentes da organização do usuário (RLS)
    const result = await sql`
      SELECT 
        id,
        device_id,
        organization_id,
        pairing_code,
        name,
        model,
        android_version,
        status,
        created_at,
        expires_at
      FROM device_registrations 
      WHERE status = 'pending' 
      AND expires_at > NOW()
      AND organization_id = ${context.organization.id}
      ORDER BY created_at DESC
    `;

    await sql.end();

    const pendingDevices = result.map((device: any) => ({
      id: device.id,
      device_id: device.device_id,
      pairing_code: device.pairing_code,
      device_name: device.name, // Map to frontend interface
      device_model: device.model, // Map to frontend interface
      android_version: device.android_version,
      status: device.status,
      created_at: device.created_at?.toISOString(),
      expires_at: device.expires_at?.toISOString(),
      organization_id: device.organization_id
    }));

    console.log(`✅ Found ${pendingDevices.length} pending devices for organization: ${context.organization.name}`);

    return NextResponse.json(pendingDevices, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error fetching pending devices:', error);
    
    // Se a tabela não existe, retornar resposta específica
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database schema not configured. Please run schema setup.',
        needsSetup: true
      }, { status: 503 }); // Service unavailable
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/admin/pending-devices - Aprovar/rejeitar dispositivo (Multi-tenant)
export async function POST(request: NextRequest) {
  try {
    console.log('⚙️ Processing pending device approval/rejection...');

    // 1. Get organization context
    const context = await getOrganizationContext(request);
    
    // 2. Check admin permissions
    if (!context.user.permissions.includes('devices:admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for device approval' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pairing_code, action } = body; // action: 'approve' ou 'reject'

    if (!pairing_code || !action) {
      return NextResponse.json({ 
        error: 'pairing_code and action are required' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'action must be "approve" or "reject"' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    if (action === 'approve') {
      // 3. Aprovar dispositivo - buscar dados do registro (com RLS)
      const registration = await sql`
        SELECT * FROM device_registrations 
        WHERE pairing_code = ${pairing_code} 
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

      // 4. Criar dispositivo na tabela principal com organization_id
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
      `;

      // 5. Marcar registro como aprovado
      await sql`
        UPDATE device_registrations 
        SET status = 'approved', approved_at = NOW(), approved_by = ${context.user.id}
        WHERE pairing_code = ${pairing_code}
        AND organization_id = ${context.organization.id}
      `;

      console.log(`✅ Device approved: ${reg.name} for organization: ${context.organization.name}`);

    } else {
      // 6. Rejeitar dispositivo (com RLS)
      const result = await sql`
        UPDATE device_registrations 
        SET status = 'rejected', approved_at = NOW(), approved_by = ${context.user.id}
        WHERE pairing_code = ${pairing_code}
        AND organization_id = ${context.organization.id}
        AND status = 'pending'
      `;

      if (result.count === 0) {
        await sql.end();
        return NextResponse.json({ 
          error: 'Registration not found or not from your organization' 
        }, { status: 404 });
      }

      console.log(`❌ Device rejected: ${pairing_code} for organization: ${context.organization.name}`);
    }

    await sql.end();

    return NextResponse.json({ 
      success: true,
      message: `Device ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      action,
      pairing_code,
      organization: context.organization.name
    });

  } catch (error: any) {
    console.error('❌ Error processing device approval:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}