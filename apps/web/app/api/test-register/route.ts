import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// Endpoint de teste simplificado para debug
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando teste completo de registro...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Testar conexão
    console.log('🔍 Testando conexão com banco...');
    const testResult = await sql`SELECT NOW() as current_time`;
    console.log('✅ Conexão OK:', testResult[0]);
    
    // Verificar organizações
    console.log('🔍 Verificando organizações...');
    const orgCheck = await sql`SELECT id, name FROM organizations ORDER BY id LIMIT 5`;
    console.log('🏢 Organizações encontradas:', orgCheck);
    
    if (orgCheck.length === 0) {
      await sql.end();
      return NextResponse.json({
        success: false,
        error: 'Nenhuma organização encontrada'
      }, { status: 400 });
    }

    // TESTE CRÍTICO: Tentar inserção simples na tabela devices
    console.log('🔍 Testando inserção simples...');
    try {
      const insertResult = await sql`
        INSERT INTO devices (organization_id, name) 
        VALUES (${orgCheck[0].id}, 'Test Simple Insert') 
        RETURNING id, name, created_at
      `;
      console.log('✅ Inserção simples funcionou:', insertResult[0]);
      
      // Agora testar inserção com mais campos
      const insertResult2 = await sql`
        INSERT INTO devices (
          organization_id, 
          name, 
          device_identifier,
          device_type,
          os_type,
          status
        ) VALUES (
          ${orgCheck[0].id}, 
          'Test Complete Insert',
          'test_device_123',
          'smartphone',
          'android',
          'inactive'
        ) RETURNING id, name, device_identifier, status
      `;
      console.log('✅ Inserção completa funcionou:', insertResult2[0]);
      
      await sql.end();
      
      return NextResponse.json({
        success: true,
        message: 'Testes de inserção passaram com sucesso!',
        data: {
          connection_test: testResult[0],
          organizations_found: orgCheck.length,
          simple_insert: insertResult[0],
          complete_insert: insertResult2[0]
        }
      });
      
    } catch (insertError: any) {
      console.error('❌ ERRO NA INSERÇÃO:', insertError);
      await sql.end();
      
      return NextResponse.json({
        success: false,
        error: 'Erro na inserção da tabela devices',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}