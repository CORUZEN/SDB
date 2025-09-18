import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { z } from 'zod';

// Schema para validação da localização
const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

// POST /api/devices/[id]/location - Recebe localização do device
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deviceId = params.id;
  
  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID é obrigatório' }, { status: 400 });
  }

  const body = await request.json();
  const parse = LocationSchema.safeParse(body);
  
  if (!parse.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parse.error.errors }, { status: 400 });
  }

  const { latitude, longitude, accuracy, timestamp } = parse.data;
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    // Verificar se o device existe
    const [device] = await sql`
      SELECT id FROM devices WHERE id = ${deviceId}
    `;
    
    if (!device) {
      await sql.end();
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }

    // Inserir localização
    const [location] = await sql`
      INSERT INTO locations (device_id, latitude, longitude, accuracy, captured_at, source)
      VALUES (${deviceId}, ${latitude}, ${longitude}, ${accuracy || null}, ${timestamp || new Date().toISOString()}, 'device_gps')
      RETURNING *
    `;

    // Atualizar last_seen_at do device
    await sql`
      UPDATE devices 
      SET last_seen_at = NOW(), status = 'online'
      WHERE id = ${deviceId}
    `;

    // Criar evento de localização
    await sql`
      INSERT INTO events (device_id, type, description, data_json, severity)
      VALUES (
        ${deviceId}, 
        'LOCATION_RECEIVED', 
        'Localização recebida do dispositivo',
        ${JSON.stringify({ latitude, longitude, accuracy, source: 'device_gps' })},
        'info'
      )
    `;

    const locationData = {
      ...location,
      captured_at: location.captured_at?.toISOString() || null,
      created_at: location.created_at?.toISOString() || null,
    };

    await sql.end();
    return NextResponse.json({ success: true, data: locationData });
  } catch (error: any) {
    await sql.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/devices/[id]/location - Busca últimas localizações do device
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deviceId = params.id;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID é obrigatório' }, { status: 400 });
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const locations = await sql`
      SELECT * FROM locations 
      WHERE device_id = ${deviceId}
      ORDER BY captured_at DESC
      LIMIT ${Math.min(limit, 100)}
    `;

    const locationsData = locations.map((loc: any) => ({
      ...loc,
      captured_at: loc.captured_at?.toISOString() || null,
      created_at: loc.created_at?.toISOString() || null,
    }));

    await sql.end();
    return NextResponse.json({ success: true, data: locationsData });
  } catch (error: any) {
    await sql.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}