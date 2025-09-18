import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { CreatePolicySchema, PolicySchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// GET /api/policies - Listar políticas
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const is_active = searchParams.get('is_active');
  const search = searchParams.get('search');
  const limit = searchParams.get('limit') || '50';

  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    let policies;
    
    // Construir query baseada nos filtros
    if (is_active && search) {
      policies = await sql`
        SELECT * FROM policies 
        WHERE is_active = ${is_active === 'true'} 
        AND (name ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else if (is_active) {
      policies = await sql`
        SELECT * FROM policies 
        WHERE is_active = ${is_active === 'true'}
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else if (search) {
      policies = await sql`
        SELECT * FROM policies 
        WHERE name ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`}
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else {
      policies = await sql`
        SELECT * FROM policies 
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    }
    
    // Preparar dados de resposta
    const responseData = policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      policy_json: typeof policy.policy_json === 'string' 
        ? JSON.parse(policy.policy_json) 
        : policy.policy_json,
      is_active: policy.is_active,
      created_at: policy.created_at?.toISOString(),
      updated_at: policy.updated_at?.toISOString(),
    }));

    await sql.end();
    return NextResponse.json({ success: true, data: responseData });

  } catch (error: any) {
    await sql.end();
    console.error('Erro ao listar políticas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/policies - Criar nova política
export async function POST(request: NextRequest) {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const body = await request.json();
    
    console.log('📥 Dados recebidos para nova política:', JSON.stringify(body, null, 2));
    
    // Validar dados de entrada
    const policyData = CreatePolicySchema.parse(body);

    // Criar política
    const newPolicy = await sql`
      INSERT INTO policies (name, description, policy_json, is_active)
      VALUES (
        ${policyData.name}, 
        ${policyData.description || null}, 
        ${JSON.stringify(policyData.policy_json)}, 
        ${policyData.is_active}
      )
      RETURNING *
    `;

    if (newPolicy.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Falha ao criar política' },
        { status: 500 }
      );
    }

    const policy = newPolicy[0];

    // Preparar dados de resposta
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

    console.log('✅ Política criada com sucesso:', responseData.id);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    await sql.end();
    
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação:', error.errors);
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Erro ao criar política:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}