import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { CreatePolicySchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// GET /api/policies/[id] - Buscar política por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const policyId = params.id;
  
  if (!policyId) {
    return NextResponse.json(
      { error: 'ID da política é obrigatório' },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const policies = await sql`
      SELECT * FROM policies WHERE id = ${policyId}
    `;

    if (policies.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Política não encontrada' },
        { status: 404 }
      );
    }

    const policy = policies[0];

    const responseData = {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      policy_json: typeof policy.policy_json === 'string' 
        ? JSON.parse(policy.policy_json) 
        : policy.policy_json,
      is_active: policy.is_active,
      created_at: policy.created_at?.toISOString(),
      updated_at: policy.updated_at?.toISOString(),
    };

    await sql.end();

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    await sql.end();
    console.error('Erro ao buscar política:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/policies/[id] - Atualizar política
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const policyId = params.id;
  
  if (!policyId) {
    return NextResponse.json(
      { error: 'ID da política é obrigatório' },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const body = await request.json();
    
    // Usar o mesmo schema de criação para validação
    const updateData = CreatePolicySchema.partial().parse(body);

    // Verificar se a política existe
    const existingPolicies = await sql`
      SELECT id FROM policies WHERE id = ${policyId}
    `;

    if (existingPolicies.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Política não encontrada' },
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

    if (updateData.description !== undefined) {
      updateFields.push('description = $' + (updateValues.length + 2));
      updateValues.push(updateData.description);
    }

    if (updateData.policy_json !== undefined) {
      updateFields.push('policy_json = $' + (updateValues.length + 2));
      updateValues.push(JSON.stringify(updateData.policy_json));
    }

    if (updateData.is_active !== undefined) {
      updateFields.push('is_active = $' + (updateValues.length + 2));
      updateValues.push(updateData.is_active);
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
      UPDATE policies 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const updatedPolicies = await sql.unsafe(updateQuery, [policyId, ...updateValues]);

    if (updatedPolicies.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Falha ao atualizar política' },
        { status: 500 }
      );
    }

    const updatedPolicy = updatedPolicies[0];

    const responseData = {
      id: updatedPolicy.id,
      name: updatedPolicy.name,
      description: updatedPolicy.description,
      policy_json: typeof updatedPolicy.policy_json === 'string' 
        ? JSON.parse(updatedPolicy.policy_json) 
        : updatedPolicy.policy_json,
      is_active: updatedPolicy.is_active,
      created_at: updatedPolicy.created_at?.toISOString(),
      updated_at: updatedPolicy.updated_at?.toISOString(),
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

    console.error('Erro ao atualizar política:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/policies/[id] - Deletar política
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const policyId = params.id;
  
  if (!policyId) {
    return NextResponse.json(
      { error: 'ID da política é obrigatório' },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    // Verificar se a política existe
    const existingPolicies = await sql`
      SELECT id FROM policies WHERE id = ${policyId}
    `;

    if (existingPolicies.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Política não encontrada' },
        { status: 404 }
      );
    }

    // Deletar associações primeiro
    await sql`DELETE FROM device_policies WHERE policy_id = ${policyId}`;
    
    // Deletar a política
    await sql`DELETE FROM policies WHERE id = ${policyId}`;

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Política deletada com sucesso'
    });

  } catch (error) {
    await sql.end();
    console.error('Erro ao deletar política:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}