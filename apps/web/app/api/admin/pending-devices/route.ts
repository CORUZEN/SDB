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
        id: 1,
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

  // Get auth token from headers for production
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                   request.headers.get('x-auth-token');

  if (!authToken) {
    throw new Error('Authentication required');
  }

  // TODO: In production, verify Firebase token and get user context
  return {
    organization: {
      id: 1,
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

    // 3. Buscar registros pendentes (simplificado para desenvolvimento)
    const result = await sql`
      SELECT 
        id,
        pairing_code,
        device_info,
        status,
        created_at,
        expires_at,
        created_by_admin,
        organization_id
      FROM device_registrations 
      WHERE status = 'pending' 
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    await sql.end();

    const pendingDevices = result.map((device: any) => {
      // Extrair informações do device_info JSON
      const deviceInfo = device.device_info || {};
      
      return {
        id: device.id,
        device_id: deviceInfo.device_id || `FRIAXIS-${device.pairing_code}`,
        pairing_code: device.pairing_code,
        device_name: deviceInfo.name || deviceInfo.device_name || 'Dispositivo Android', 
        device_model: deviceInfo.model || deviceInfo.device_model || 'Unknown Model',
        android_version: deviceInfo.android_version || 'Unknown',
        status: device.status,
        created_at: device.created_at?.toISOString(),
        expires_at: device.expires_at?.toISOString(),
        created_by_admin: device.created_by_admin || false
      };
    });

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
      // 3. Aprovar dispositivo - buscar dados do registro
      const registration = await sql`
        SELECT * FROM device_registrations 
        WHERE pairing_code = ${pairing_code} 
        AND status = 'pending'
        AND expires_at > NOW()
      `;

      if (registration.length === 0) {
        await sql.end();
        return NextResponse.json({ 
          error: 'Registration not found or expired' 
        }, { status: 404 });
      }

      const reg = registration[0];

        // 4. Extrair informações do device_info JSONB
      const deviceInfo = reg.device_info || {};
      
      // 5. Criar dispositivo na tabela principal com nova estrutura
      await sql`
        INSERT INTO devices (
          organization_id,
          device_id,
          name, 
          model,
          android_version,
          fcm_token,
          is_active,
          created_at, 
          updated_at
        ) VALUES (
          ${reg.organization_id},
          ${deviceInfo.device_id || reg.device_id},
          ${deviceInfo.name || deviceInfo.device_name || 'Dispositivo Android'},
          ${deviceInfo.model || deviceInfo.device_model || 'Unknown Model'},
          ${deviceInfo.android_version || 'Unknown'},
          ${deviceInfo.fcm_token || deviceInfo.firebase_token},
          true,
          NOW(),
          NOW()
        )
      `;

      // 5. Marcar registro como aprovado
      await sql`
        UPDATE device_registrations 
        SET status = 'approved', updated_at = NOW()
        WHERE pairing_code = ${pairing_code}
      `;

      console.log(`✅ Device approved: ${reg.name} for organization: ${context.organization.name}`);

    } else {
      // 6. Rejeitar dispositivo
      const result = await sql`
        UPDATE device_registrations 
        SET status = 'rejected', updated_at = NOW()
        WHERE pairing_code = ${pairing_code}
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