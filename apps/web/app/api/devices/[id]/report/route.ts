import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { DeviceReportSchema } from '@sdb/shared/schemas';

// POST /api/devices/[id]/report - Recebe relatório de status do device
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deviceId = params.id;
  
  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID é obrigatório' }, { status: 400 });
  }

  const body = await request.json();
  const parse = DeviceReportSchema.safeParse(body);
  
  if (!parse.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parse.error.errors }, { status: 400 });
  }

  const { battery_level, os_version, ssid, app_in_foreground, status } = parse.data;
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    // Verificar se o device existe
    const [device] = await sql`
      SELECT id, name FROM devices WHERE id = ${deviceId}
    `;
    
    if (!device) {
      await sql.end();
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }

    // Atualizar dados do device
    const [updatedDevice] = await sql`
      UPDATE devices 
      SET 
        battery_level = ${battery_level || null},
        os_version = ${os_version || null},
        ssid = ${ssid || null},
        app_in_foreground = ${app_in_foreground || null},
        status = ${status},
        last_seen_at = NOW(),
        updated_at = NOW()
      WHERE id = ${deviceId}
      RETURNING *
    `;

    // Criar evento de report
    await sql`
      INSERT INTO events (device_id, type, description, data_json, severity)
      VALUES (
        ${deviceId}, 
        'DEVICE_REPORT', 
        'Relatório de status recebido',
        ${JSON.stringify({ 
          battery_level, 
          os_version, 
          ssid, 
          app_in_foreground, 
          status,
          timestamp: new Date().toISOString()
        })},
        'info'
      )
    `;

    const deviceData = {
      ...updatedDevice,
      created_at: updatedDevice.created_at?.toISOString() || null,
      updated_at: updatedDevice.updated_at?.toISOString() || null,
      last_seen_at: updatedDevice.last_seen_at?.toISOString() || null,
    };

    await sql.end();
    return NextResponse.json({ success: true, data: deviceData });
  } catch (error: any) {
    await sql.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}