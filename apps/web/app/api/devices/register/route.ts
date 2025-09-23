import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// POST /api/devices/register - Registro inicial de dispositivo Android
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando registro de dispositivo...');
    
    const body = await request.json();
    console.log('📱 Dados recebidos:', body);
    
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
    console.log('🔐 Código de emparelhamento gerado:', pairingCode);

    // Usar primeira organização disponível (ID = 1 que sabemos que existe)
    const organizationId = 1;

    // Inserir dispositivo com campos mínimos e compatíveis
    console.log('💾 Inserindo dispositivo no banco...');
    
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
        ${firebase_token || null},
        'inactive',
        'smartphone',
        'android',
        ${model},
        ${android_version},
        'Usuário Android',
        ${JSON.stringify({
          pairing_code: pairingCode,
          registration_source: 'android_app',
          requires_approval: true,
          registration_timestamp: new Date().toISOString()
        })}
      ) RETURNING id, name, status, metadata, created_at
    `;

    await sql.end();

    if (result.length === 0) {
      console.error('❌ Falha ao inserir dispositivo');
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao criar registro de dispositivo' 
      }, { status: 500 });
    }

    const device = result[0];
    const deviceMetadata = device.metadata as any;
    
    console.log('✅ Dispositivo registrado com sucesso:', device.id);

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: device.id,
        pairing_code: deviceMetadata.pairing_code,
        status: 'pending',
        message: 'Dispositivo registrado. Use o código no sistema web para aprovar.',
        created_at: device.created_at
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erro ao registrar dispositivo:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      code: error.code
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