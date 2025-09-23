import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// POST /api/test-insert-minimal - Teste de inserção mínima
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Teste de inserção mínima na tabela devices...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Teste 1: Verificar se organization_id=1 existe
    const orgCheck = await sql`SELECT id, name FROM organizations WHERE id = 1`;
    console.log('🏢 Organização encontrada:', orgCheck);

    if (orgCheck.length === 0) {
      await sql.end();
      return NextResponse.json({
        success: false,
        error: 'Organization ID 1 não existe'
      }, { status: 400 });
    }

    // Teste 2: Inserção super mínima
    try {
      const result = await sql`
        INSERT INTO devices (organization_id, name) 
        VALUES (1, 'Test Minimal Device') 
        RETURNING id, name, created_at
      `;
      console.log('✅ Inserção mínima OK:', result[0]);
      
      // Teste 3: Inserção com mais campos um por vez
      const result2 = await sql`
        INSERT INTO devices (organization_id, name, device_type) 
        VALUES (1, 'Test Device Type', 'smartphone') 
        RETURNING id, name, device_type
      `;
      console.log('✅ Inserção com device_type OK:', result2[0]);
      
      // Teste 4: Inserção com metadata
      const result3 = await sql`
        INSERT INTO devices (organization_id, name, device_type, metadata) 
        VALUES (1, 'Test Metadata Device', 'smartphone', '{"test": true}'::jsonb) 
        RETURNING id, name, metadata
      `;
      console.log('✅ Inserção com metadata OK:', result3[0]);
      
      await sql.end();
      
      return NextResponse.json({
        success: true,
        message: 'Todos os testes de inserção passaram',
        results: [result[0], result2[0], result3[0]]
      });
      
    } catch (insertError: any) {
      console.error('❌ Erro específico na inserção:', insertError);
      await sql.end();
      
      return NextResponse.json({
        success: false,
        error: 'Erro na inserção',
        details: insertError.message,
        code: insertError.code,
        stack: insertError.stack
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}