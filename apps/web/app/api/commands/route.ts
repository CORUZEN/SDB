import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// GET /api/commands - Lista comandos com filtros opcionais
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const device_id = searchParams.get('device_id');
  const status = searchParams.get('status');
  const limit = searchParams.get('limit') || '50';

  console.log('🔍 Buscando comandos para device_id:', device_id);

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    let commands;
    
    // Verificar se device_id é válido antes de fazer query
    if (device_id && device_id.trim() === '') {
      console.log('❌ Device ID vazio');
      await sql.end();
      return NextResponse.json({ 
        success: true, 
        data: [],
        count: 0,
        message: 'Device ID vazio - nenhum comando encontrado'
      });
    }
    
    if (device_id && status) {
      commands = await sql`
        SELECT * FROM commands 
        WHERE device_id::text = ${device_id} AND status = ${status}
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else if (device_id) {
      commands = await sql`
        SELECT * FROM commands 
        WHERE device_id::text = ${device_id}
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else if (status) {
      commands = await sql`
        SELECT * FROM commands 
        WHERE status = ${status}
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else {
      commands = await sql`
        SELECT * FROM commands 
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    }
    
    console.log(`✅ Encontrados ${commands.length} comandos`);
    
    // Prepare response data
    const responseData = commands.map((command: any) => ({
      id: command.id,
      device_id: command.device_id,
      type: command.type,
      payload_json: command.payload_json ? JSON.parse(command.payload_json) : null,
      status: command.status,
      created_at: command.created_at?.toISOString(),
      sent_at: command.sent_at?.toISOString() || null,
      executed_at: command.executed_at?.toISOString() || null,
      error_message: command.error_message,
      result_json: command.result_json ? JSON.parse(command.result_json) : null,
    }));
    
    await sql.end();
    
    return NextResponse.json({ 
      success: true, 
      data: responseData,
      count: responseData.length 
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar comandos:', error);
    await sql.end();
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// POST /api/commands - Cria comando remoto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Dados recebidos na API commands:', JSON.stringify(body, null, 2));
    
    // Validação básica sem schema
    const { deviceId, type, payload } = body;
    
    if (!deviceId || !type) {
      return NextResponse.json({ 
        success: false,
        error: 'deviceId e type são obrigatórios',
        received: body 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se o device existe primeiro
    const deviceCheck = await sql`
      SELECT id FROM devices WHERE id = ${deviceId}
    `;
    
    if (deviceCheck.length === 0) {
      await sql.end();
      return NextResponse.json({ 
        success: false,
        error: 'Device não encontrado',
        device_id: deviceId 
      }, { status: 404 });
    }

    // Adicionar o device_id original no payload para referência
    const enrichedPayload = {
      ...payload,
      original_device_id: deviceId
    };

    // Gerar UUID aleatório para device_id (incompatibilidade de schema)
    const [command] = await sql`
      INSERT INTO commands (device_id, type, payload_json, status)
      VALUES (
        gen_random_uuid(),
        ${type}, 
        ${JSON.stringify(enrichedPayload)}, 
        'pending'
      )
      RETURNING *
    `;
    
    // Prepare response data
    const payloadData = command.payload_json ? JSON.parse(command.payload_json) : {};
    const responseData = {
      id: command.id,
      device_id: payloadData.original_device_id || command.device_id, // Usar device_id original
      uuid_device_id: command.device_id, // UUID interno da tabela
      type: command.type,
      payload_json: payloadData,
      status: command.status,
      created_at: command.created_at?.toISOString(),
      sent_at: command.sent_at?.toISOString() || null,
      executed_at: command.executed_at?.toISOString() || null,
      error_message: command.error_message,
      result_json: command.result_json ? JSON.parse(command.result_json) : null,
    };
    
    await sql.end();
    return NextResponse.json({ success: true, data: responseData });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar comando:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}