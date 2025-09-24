import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { CreateCommandSchema, CommandSchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// GET /api/commands - Lista comandos com filtros opcionais
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const device_id = searchParams.get('device_id');
  const status = searchParams.get('status');
  const limit = searchParams.get('limit') || '50';

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    let commands;
    
    if (device_id && status) {
      commands = await sql`
        SELECT * FROM commands 
        WHERE device_id = ${device_id} AND status = ${status}
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else if (device_id) {
      commands = await sql`
        SELECT * FROM commands 
        WHERE device_id = ${device_id}
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
    
    // Prepare response data
    const responseData = commands.map(command => ({
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
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/commands - Cria comando remoto
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  console.log('📥 Dados recebidos na API commands:', JSON.stringify(body, null, 2));
  
  const parse = CreateCommandSchema.safeParse(body);
  if (!parse.success) {
    console.error('❌ Erro de validação:', parse.error.errors);
    return NextResponse.json({ 
      error: 'Dados inválidos', 
      details: parse.error.errors,
      received: body 
    }, { status: 400 });
  }

  const { deviceId, type, payload } = parse.data;
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const [command] = await sql`
      INSERT INTO commands (device_id, type, payload_json, status)
      VALUES (${deviceId}, ${type}, ${JSON.stringify(payload || {})}, 'pending')
      RETURNING *
    `;
    
    // Prepare response data without schema validation since payload_json is stored as string
    const responseData = {
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
    };
    
    await sql.end();
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
