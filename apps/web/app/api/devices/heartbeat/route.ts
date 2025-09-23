import { NextRequest, NextResponse } from 'next/server';

// POST /api/devices/heartbeat - Device heartbeat
export async function POST(request: NextRequest) {
  let sql: any;
  
  try {
    const { device_id, battery_level, battery_status, location_lat, location_lng, network_info } = await request.json();
    
    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'Device ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`💓 Heartbeat recebido do dispositivo: ${device_id}`);

    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Dynamic import to avoid webpack issues
    const { default: postgres } = await import('postgres');
    sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    // Atualizar último heartbeat e status do dispositivo
    const result = await sql`
      UPDATE devices 
      SET last_heartbeat = NOW(),
          status = 'online',
          battery_level = ${battery_level || null},
          battery_status = ${battery_status || null},
          location_lat = ${location_lat || null},
          location_lng = ${location_lng || null},
          location_timestamp = ${location_lat && location_lng ? sql`NOW()` : sql`location_timestamp`},
          network_info = ${network_info ? JSON.stringify(network_info) : sql`network_info`},
          updated_at = NOW()
      WHERE id = ${device_id}
      RETURNING id, name, status, last_heartbeat, organization_id
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dispositivo não encontrado' },
        { status: 404 }
      );
    }

    const device = result[0];
    console.log(`✅ Heartbeat processado para ${device.name}`);

    return NextResponse.json({
      success: true,
      data: {
        device_id: device.id,
        name: device.name,
        status: device.status,
        last_heartbeat: device.last_heartbeat?.toISOString(),
        organization_id: device.organization_id,
        message: 'Heartbeat recebido com sucesso'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar heartbeat:', error);
    
    if (sql) {
      try {
        await sql.end();
      } catch (endError) {
        console.error('Error closing database connection:', endError);
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}