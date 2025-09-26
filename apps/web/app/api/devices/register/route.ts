import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// POST /api/devices/register - Registro inicial de dispositivo Android
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados obrigatórios
    const { name, model, android_version, firebase_token } = body;
    
    if (!name || !model || !android_version) {
      return NextResponse.json({ 
        success: false,
        error: 'Dados obrigatórios: name, model, android_version' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Gerar código único de 6 dígitos para emparelhamento
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Gerar ID único para o dispositivo
    const deviceId = `sdb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Inserir registro pendente (não aparece na lista até ser aprovado)
    const deviceInfo = {
      device_id: deviceId,
      name,
      model,
      android_version,
      firebase_token: firebase_token || null
    };

    const result = await sql`
      INSERT INTO device_registrations (
        pairing_code,
        device_info,
        status,
        created_at,
        expires_at,
        organization_id
      ) VALUES (
        ${pairingCode},
        ${JSON.stringify(deviceInfo)},
        'pending',
        NOW(),
        NOW() + INTERVAL '1 hour',
        1
      ) RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao criar registro de dispositivo' 
      }, { status: 500 });
    }

    const registration = result[0];

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: deviceId,
        pairing_code: registration.pairing_code,
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

    // Verificar status do registro
    const result = await sql`
      SELECT * FROM device_registrations 
      WHERE pairing_code = ${code} 
      AND expires_at > NOW()
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Código inválido ou expirado' 
      }, { status: 404 });
    }

    const registration = result[0];

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: registration.device_info?.device_id,
        status: registration.status,
        approved: registration.status === 'approved'
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