import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { UpdateDeviceSchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// GET /api/devices/[id] - Buscar dispositivo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deviceId = params.id;
  
  if (!deviceId) {
    return NextResponse.json(
      { error: 'ID do dispositivo é obrigatório' },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    // Buscar o dispositivo
    const devices = await sql`
      SELECT * FROM devices WHERE id = ${deviceId}
    `;

    if (devices.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Dispositivo não encontrado' },
        { status: 404 }
      );
    }

    const device = devices[0];

    // Preparar dados de resposta
    const responseData = {
      id: device.id,
      name: device.name,
      device_identifier: device.device_identifier,
      fcm_token: device.fcm_token,
      status: device.status,
      device_type: device.device_type,
      manufacturer: device.manufacturer,
      model: device.model,
      os_type: device.os_type,
      os_version: device.os_version,
      app_version: device.app_version,
      owner_name: device.owner_name,
      owner: device.owner || device.owner_name, // compatibility
      owner_email: device.owner_email,
      department: device.department,
      location_name: device.location_name,
      location_lat: device.location_lat,
      location_lng: device.location_lng,
      battery_level: device.battery_level,
      battery_status: device.battery_status,
      location_accuracy: device.location_accuracy,
      location_timestamp: device.location_timestamp?.toISOString() || null,
      network_info: device.network_info,
      last_heartbeat: device.last_heartbeat?.toISOString() || null,
      last_seen_at: device.last_seen_at?.toISOString() || null,
      created_at: device.created_at?.toISOString() || null,
      updated_at: device.updated_at?.toISOString() || null,
      ssid: device.ssid,
      app_in_foreground: device.app_in_foreground,
      tags: typeof device.tags === 'string' 
        ? JSON.parse(device.tags) 
        : device.tags || []
    };

    await sql.end();

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    await sql.end();
    console.error('Erro ao buscar dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/devices/[id] - Atualizar dispositivo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deviceId = params.id;
  
  if (!deviceId) {
    return NextResponse.json(
      { error: 'ID do dispositivo é obrigatório' },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const updateData = UpdateDeviceSchema.parse(body);

    // Verificar se o dispositivo existe
    const devices = await sql`
      SELECT id FROM devices WHERE id = ${deviceId}
    `;

    if (devices.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Dispositivo não encontrado' },
        { status: 404 }
      );
    }

    // Construir query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];

    if (updateData.name !== undefined) {
      updateFields.push('name = $' + (updateValues.length + 2));
      updateValues.push(updateData.name);
    }

    if (updateData.owner !== undefined) {
      updateFields.push('owner = $' + (updateValues.length + 2));
      updateValues.push(updateData.owner);
    }

    if (updateData.status !== undefined) {
      updateFields.push('status = $' + (updateValues.length + 2));
      updateValues.push(updateData.status);
    }

    if (updateData.tags !== undefined) {
      updateFields.push('tags = $' + (updateValues.length + 2));
      updateValues.push(JSON.stringify(updateData.tags));
    }

    if (updateFields.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Adicionar updated_at
    updateFields.push('updated_at = $' + (updateValues.length + 2));
    updateValues.push(new Date().toISOString());

    // Executar atualização
    const updateQuery = `
      UPDATE devices 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const updatedDevices = await sql.unsafe(updateQuery, [deviceId, ...updateValues]);

    if (updatedDevices.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Falha ao atualizar dispositivo' },
        { status: 500 }
      );
    }

    const updatedDevice = updatedDevices[0];

    // Preparar dados de resposta
    const responseData = {
      id: updatedDevice.id,
      name: updatedDevice.name,
      type: updatedDevice.type,
      status: updatedDevice.status,
      battery_level: updatedDevice.battery_level,
      last_seen: updatedDevice.last_seen,
      created_at: updatedDevice.created_at,
      updated_at: updatedDevice.updated_at,
      user_id: updatedDevice.user_id,
      fcm_token: updatedDevice.fcm_token,
      os_version: updatedDevice.os_version,
      ssid: updatedDevice.ssid,
      app_in_foreground: updatedDevice.app_in_foreground,
      owner: updatedDevice.owner,
      tags: typeof updatedDevice.tags === 'string' 
        ? JSON.parse(updatedDevice.tags) 
        : updatedDevice.tags || []
    };

    await sql.end();

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    await sql.end();
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/[id] - Deletar dispositivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deviceId = params.id;
  
  if (!deviceId) {
    return NextResponse.json(
      { error: 'ID do dispositivo é obrigatório' },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    console.log(`🗑️ Tentando deletar dispositivo: ${deviceId}`);
    
    // Verificar se o dispositivo existe
    const devices = await sql`
      SELECT id FROM devices WHERE id = ${deviceId}
    `;

    if (devices.length === 0) {
      await sql.end();
      console.log(`❌ Dispositivo não encontrado: ${deviceId}`);
      return NextResponse.json(
        { error: 'Dispositivo não encontrado' },
        { status: 404 }
      );
    }

    console.log(`✅ Dispositivo encontrado, prosseguindo com deleção: ${deviceId}`);

    // Deletar relacionamentos primeiro (se existirem)
    try {
      await sql`DELETE FROM locations WHERE device_id = ${deviceId}`;
      console.log(`✅ Localizações deletadas para dispositivo: ${deviceId}`);
    } catch (error) {
      console.log(`⚠️ Erro ao deletar localizações (pode não existir): ${error}`);
    }
    
    try {
      await sql`DELETE FROM commands WHERE device_id = ${deviceId}`;
      console.log(`✅ Comandos deletados para dispositivo: ${deviceId}`);
    } catch (error) {
      console.log(`⚠️ Erro ao deletar comandos (pode não existir): ${error}`);
    }
    
    try {
      await sql`DELETE FROM events WHERE device_id = ${deviceId}`;
      console.log(`✅ Eventos deletados para dispositivo: ${deviceId}`);
    } catch (error) {
      console.log(`⚠️ Erro ao deletar eventos (pode não existir): ${error}`);
    }
    
    // Deletar o dispositivo
    const deleteResult = await sql`DELETE FROM devices WHERE id = ${deviceId}`;
    console.log(`✅ Dispositivo deletado: ${deviceId}`, deleteResult);

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Dispositivo deletado com sucesso'
    });

  } catch (error) {
    await sql.end();
    console.error('❌ Erro ao deletar dispositivo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}