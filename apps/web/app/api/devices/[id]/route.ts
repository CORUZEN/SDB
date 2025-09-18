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
      type: device.type,
      status: device.status,
      battery_level: device.battery_level,
      last_seen: device.last_seen,
      created_at: device.created_at,
      updated_at: device.updated_at,
      user_id: device.user_id,
      fcm_token: device.fcm_token,
      os_version: device.os_version,
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

    // Deletar localizações relacionadas
    await sql`DELETE FROM locations WHERE device_id = ${deviceId}`;
    
    // Deletar comandos relacionados
    await sql`DELETE FROM commands WHERE device_id = ${deviceId}`;
    
    // Deletar o dispositivo
    await sql`DELETE FROM devices WHERE id = ${deviceId}`;

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Dispositivo deletado com sucesso'
    });

  } catch (error) {
    await sql.end();
    console.error('Erro ao deletar dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}