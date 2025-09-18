import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { z } from 'zod';

// GET /api/locations - Lista localizações com filtros opcionais
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const device_id = searchParams.get('device_id');
  const limit = searchParams.get('limit') || '50';

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    let locations;
    
    if (device_id) {
      locations = await sql`
        SELECT * FROM locations 
        WHERE device_id = ${device_id}
        ORDER BY captured_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else {
      // Buscar última localização de cada dispositivo
      locations = await sql`
        SELECT DISTINCT ON (device_id) 
          id, device_id, latitude, longitude, accuracy, altitude, speed, bearing, source, captured_at, created_at
        FROM locations 
        ORDER BY device_id, captured_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    }
    
    // Prepare response data
    const responseData = locations.map(location => ({
      id: location.id,
      device_id: location.device_id,
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      accuracy: location.accuracy,
      altitude: location.altitude,
      speed: location.speed,
      bearing: location.bearing,
      source: location.source,
      captured_at: location.captured_at?.toISOString(),
      created_at: location.created_at?.toISOString(),
    }));
    
    await sql.end();
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/locations - Adiciona nova localização
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validação básica dos dados
  const schema = z.object({
    device_id: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).nullable().optional(),
    altitude: z.number().nullable().optional(),
    speed: z.number().min(0).nullable().optional(),
    bearing: z.number().min(0).max(360).nullable().optional(),
    source: z.enum(['gps', 'network', 'passive', 'fused']).default('gps'),
    captured_at: z.string().datetime().optional(),
  });
  
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parse.error.errors }, { status: 400 });
  }

  const { device_id, latitude, longitude, accuracy, altitude, speed, bearing, source, captured_at } = parse.data;
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const [location] = await sql`
      INSERT INTO locations (device_id, latitude, longitude, accuracy, altitude, speed, bearing, source, captured_at)
      VALUES (
        ${device_id}, 
        ${latitude}, 
        ${longitude}, 
        ${accuracy || null}, 
        ${altitude || null},
        ${speed || null},
        ${bearing || null},
        ${source},
        ${captured_at ? new Date(captured_at) : new Date()}
      )
      RETURNING *
    `;
    
    // Prepare response data
    const responseData = {
      id: location.id,
      device_id: location.device_id,
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      accuracy: location.accuracy,
      altitude: location.altitude,
      speed: location.speed,
      bearing: location.bearing,
      source: location.source,
      captured_at: location.captured_at?.toISOString(),
      created_at: location.created_at?.toISOString(),
    };
    
    await sql.end();
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}