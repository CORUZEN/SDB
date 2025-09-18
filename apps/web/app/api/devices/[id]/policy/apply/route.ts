import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { ApplyPolicySchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// POST /api/devices/[id]/policy/apply - Aplicar política a um dispositivo
export async function POST(
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
    
    console.log(`📥 Aplicando política ao dispositivo ${deviceId}:`, body);
    
    // Validar dados de entrada
    const { policy_id } = ApplyPolicySchema.parse(body);

    // Verificar se o dispositivo existe
    const devices = await sql`
      SELECT id, name FROM devices WHERE id = ${deviceId}
    `;

    if (devices.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Dispositivo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se a política existe e está ativa
    const policies = await sql`
      SELECT id, name, policy_json FROM policies 
      WHERE id = ${policy_id} AND is_active = true
    `;

    if (policies.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Política não encontrada ou inativa' },
        { status: 404 }
      );
    }

    // Verificar se a associação já existe
    const existingAssociation = await sql`
      SELECT id FROM device_policies 
      WHERE device_id = ${deviceId} AND policy_id = ${policy_id}
    `;

    if (existingAssociation.length > 0) {
      // Atualizar status para reaplica
      const updatedAssociation = await sql`
        UPDATE device_policies 
        SET status = 'pending', applied_at = NOW(), error_message = NULL
        WHERE device_id = ${deviceId} AND policy_id = ${policy_id}
        RETURNING *
      `;

      await sql.end();

      return NextResponse.json({
        success: true,
        data: {
          id: updatedAssociation[0].id,
          device_id: deviceId,
          policy_id: policy_id,
          status: updatedAssociation[0].status,
          applied_at: updatedAssociation[0].applied_at?.toISOString(),
        },
        message: 'Política reaplicada com sucesso'
      });
    }

    // Criar nova associação
    const newAssociation = await sql`
      INSERT INTO device_policies (device_id, policy_id, status)
      VALUES (${deviceId}, ${policy_id}, 'pending')
      RETURNING *
    `;

    // TODO: Aqui seria onde enviamos o comando FCM para o dispositivo
    // aplicar a política. Por enquanto, simulamos sucesso imediato.
    await sql`
      UPDATE device_policies 
      SET status = 'applied'
      WHERE id = ${newAssociation[0].id}
    `;

    await sql.end();

    console.log(`✅ Política ${policy_id} aplicada ao dispositivo ${deviceId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: newAssociation[0].id,
        device_id: deviceId,
        policy_id: policy_id,
        status: 'applied',
        applied_at: newAssociation[0].applied_at?.toISOString(),
      },
      message: 'Política aplicada com sucesso'
    });

  } catch (error) {
    await sql.end();
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Erro ao aplicar política:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/devices/[id]/policy/apply - Listar políticas aplicadas ao dispositivo
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
    // Buscar políticas aplicadas ao dispositivo
    const appliedPolicies = await sql`
      SELECT 
        dp.id as association_id,
        dp.status,
        dp.applied_at,
        dp.error_message,
        p.id as policy_id,
        p.name as policy_name,
        p.description as policy_description,
        p.policy_json,
        p.is_active
      FROM device_policies dp
      JOIN policies p ON dp.policy_id = p.id
      WHERE dp.device_id = ${deviceId}
      ORDER BY dp.applied_at DESC
    `;

    const responseData = appliedPolicies.map(item => ({
      association_id: item.association_id,
      policy_id: item.policy_id,
      policy_name: item.policy_name,
      policy_description: item.policy_description,
      policy_json: typeof item.policy_json === 'string' 
        ? JSON.parse(item.policy_json) 
        : item.policy_json,
      policy_is_active: item.is_active,
      status: item.status,
      applied_at: item.applied_at?.toISOString(),
      error_message: item.error_message,
    }));

    await sql.end();

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    await sql.end();
    console.error('Erro ao listar políticas do dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}