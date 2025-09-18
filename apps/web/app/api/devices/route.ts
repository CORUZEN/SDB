import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { DeviceSchema, DeviceListFilterSchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// GET /api/devices - Lista dispositivos (com filtros)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parse = DeviceListFilterSchema.safeParse(params);

  if (!parse.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos', details: parse.error.errors }, { status: 400 });
  }

  const { status, owner, tags, search } = parse.data;
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  let query = 'SELECT * FROM devices WHERE 1=1';
  const values: any[] = [];

  if (status) {
    query += ' AND status = $' + (values.length + 1);
    values.push(status);
  }
  if (owner) {
    query += ' AND owner = $' + (values.length + 1);
    values.push(owner);
  }
  if (tags && tags.length > 0) {
    query += ' AND tags ?& $' + (values.length + 1);
    values.push(tags);
  }
  if (search) {
    query += ' AND (name ILIKE $' + (values.length + 1) + ' OR owner ILIKE $' + (values.length + 1) + ')';
    values.push(`%${search}%`);
  }

  query += ' ORDER BY updated_at DESC LIMIT 100';

  try {
    const result = await sql.unsafe(query, values);
    const devices = result.map((d: any) => {
      // Convert dates to ISO strings and parse tags from JSON
      const deviceData = {
        ...d,
        tags: typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags, // Parse JSON tags
        created_at: d.created_at?.toISOString() || null,
        updated_at: d.updated_at?.toISOString() || null,
        last_seen_at: d.last_seen_at?.toISOString() || null,
      };
      return DeviceSchema.parse(deviceData);
    });
    await sql.end();
    return NextResponse.json({ success: true, data: devices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/devices - Criar novo dispositivo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const deviceData = {
      name: body.name,
      owner: body.owner || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      fcm_token: body.fcm_token || null,
      status: body.status || 'offline',
    };

    // Validações básicas
    if (!deviceData.name || deviceData.name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome do dispositivo é obrigatório' }, { status: 400 });
    }

    if (deviceData.name.length > 255) {
      return NextResponse.json({ error: 'Nome do dispositivo deve ter no máximo 255 caracteres' }, { status: 400 });
    }

    if (!['online', 'offline', 'inactive'].includes(deviceData.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Inserir dispositivo no banco
    const result = await sql`
      INSERT INTO devices (
        name, 
        fcm_token, 
        status, 
        owner, 
        tags, 
        created_at, 
        updated_at
      ) VALUES (
        ${deviceData.name},
        ${deviceData.fcm_token},
        ${deviceData.status},
        ${deviceData.owner},
        ${JSON.stringify(deviceData.tags)},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Erro ao criar dispositivo' }, { status: 500 });
    }

    const newDevice = result[0];
    
    // Formatar resposta
    const deviceResponse = {
      id: newDevice.id,
      name: newDevice.name,
      fcm_token: newDevice.fcm_token,
      status: newDevice.status,
      owner: newDevice.owner,
      tags: typeof newDevice.tags === 'string' ? JSON.parse(newDevice.tags) : newDevice.tags,
      last_seen_at: newDevice.last_seen_at?.toISOString() || null,
      battery_level: newDevice.battery_level,
      os_version: newDevice.os_version,
      ssid: newDevice.ssid,
      app_in_foreground: newDevice.app_in_foreground,
      created_at: newDevice.created_at.toISOString(),
      updated_at: newDevice.updated_at.toISOString(),
    };

    return NextResponse.json({ 
      success: true, 
      data: deviceResponse,
      message: 'Dispositivo criado com sucesso' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar dispositivo:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
