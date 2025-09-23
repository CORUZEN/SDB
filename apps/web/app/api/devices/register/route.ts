import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// POST /api/devices/register - Registro inicial de dispositivo Android
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados obrigatórios
    const { name, model, android_version, firebase_token, device_identifier } = body;
    
    if (!name || !model || !android_version) {
      return NextResponse.json({ 
        success: false,
        error: 'Dados obrigatórios: name, model, android_version' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Gerar código único de 6 dígitos para emparelhamento
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Usar primeira organização disponível (para desenvolvimento)
    const orgResult = await sql`SELECT id FROM organizations ORDER BY id LIMIT 1`;
    
    if (orgResult.length === 0) {
      await sql.end();
      return NextResponse.json({ 
        success: false,
        error: 'Nenhuma organização encontrada' 
      }, { status: 500 });
    }

    const organizationId = orgResult[0].id;

    // Inserir dispositivo de forma simples e compatível
    const metadata = {
      pairing_code: pairingCode,
      registration_source: 'android_app',
      requires_approval: true,
      registration_timestamp: new Date().toISOString()
    };

    const result = await sql`
      INSERT INTO devices (
        organization_id,
        name,
        device_identifier,
        fcm_token,
        status,
        device_type,
        os_type,
        model,
        os_version,
        owner_name,
        metadata
      ) VALUES (
        ${organizationId},
        ${name},
        ${device_identifier || `android_${Date.now()}`},
        ${firebase_token},
        'inactive',
        'smartphone',
        'android',
        ${model},
        ${android_version},
        'Usuário Android',
        ${JSON.stringify(metadata)}
      ) RETURNING id, name, status, metadata
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao criar registro de dispositivo' 
      }, { status: 500 });
    }

    const device = result[0];
    const deviceMetadata = device.metadata as any;

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: device.id,
        pairing_code: deviceMetadata.pairing_code,
        status: 'pending',
        message: 'Dispositivo registrado. Use o código no sistema web para aprovar.'
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao registrar dispositivo:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/devices/register/[code] - Verificar status de aprovação
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.pathname.split('/').pop();

    if (!code) {
      return NextResponse.json({ 
        success: false,
        error: 'Código de emparelhamento é obrigatório' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar dispositivo pelo código de emparelhamento no metadata
    const result = await sql`
      SELECT id, name, status, metadata, created_at
      FROM devices 
      WHERE metadata->>'pairing_code' = ${code}
      AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Código inválido ou expirado' 
      }, { status: 404 });
    }

    const device = result[0];
    const isApproved = device.status === 'online' || device.status === 'offline';

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: device.id,
        status: isApproved ? 'approved' : 'pending',
        approved: isApproved,
        device_status: device.status
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar registro:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}