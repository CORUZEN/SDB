import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// GET /api/device-register - Registro via GET para testes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Test Device';
    const model = searchParams.get('model') || 'Android Device';
    const android_version = searchParams.get('android_version') || 'Android 13';

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Gerar código único de 6 dígitos para emparelhamento
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Gerar ID único para o dispositivo
    const deviceId = `sdb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Inserir diretamente na tabela devices com status pending
    const result = await sql`
      INSERT INTO devices (
        id,
        name,
        fcm_token,
        status,
        os_version,
        owner,
        tags,
        created_at,
        updated_at
      ) VALUES (
        ${deviceId},
        ${name + ' (' + model + ')'},
        ${null},
        'offline',
        ${android_version},
        'pending_approval',
        ${JSON.stringify([pairingCode, 'pending_registration'])},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao criar registro de dispositivo' 
      }, { status: 500 });
    }

    const device = result[0];

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: device.id,
        pairing_code: pairingCode,
        status: 'pending',
        message: 'Dispositivo registrado. Use o código no sistema web para aprovar.',
        registered_device: device
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

// POST /api/device-register - Registro normal
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

    // Inserir diretamente na tabela devices com status pending
    const result = await sql`
      INSERT INTO devices (
        id,
        name,
        fcm_token,
        status,
        os_version,
        owner,
        tags,
        created_at,
        updated_at
      ) VALUES (
        ${deviceId},
        ${name + ' (' + model + ')'},
        ${firebase_token || null},
        'offline',
        ${android_version},
        'pending_approval',
        ${JSON.stringify([pairingCode, 'pending_registration'])},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao criar registro de dispositivo' 
      }, { status: 500 });
    }

    const device = result[0];

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: device.id,
        pairing_code: pairingCode,
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