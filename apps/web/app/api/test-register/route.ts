import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// Endpoint de teste simplificado para debug
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando teste de registro...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Testar conexão
    console.log('🔍 Testando conexão com banco...');
    const testResult = await sql`SELECT NOW() as current_time`;
    console.log('✅ Conexão OK:', testResult[0]);
    
    // Verificar se tabela devices existe
    console.log('🔍 Verificando tabela devices...');
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'devices'
    `;
    console.log('📋 Tabela devices existe:', tableCheck.length > 0);
    
    // Verificar organizações
    console.log('🔍 Verificando organizações...');
    const orgCheck = await sql`SELECT id, name FROM organizations LIMIT 5`;
    console.log('🏢 Organizações encontradas:', orgCheck.length);
    
    if (orgCheck.length === 0) {
      console.log('⚠️ Nenhuma organização encontrada, criando padrão...');
      const newOrg = await sql`
        INSERT INTO organizations (name, slug, domain, is_active) 
        VALUES ('Test Org', 'test', 'test.local', true) 
        RETURNING id, name
      `;
      console.log('✅ Organização criada:', newOrg[0]);
    }
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      message: 'Teste concluído com sucesso',
      data: {
        database_connected: true,
        devices_table_exists: tableCheck.length > 0,
        organizations_count: orgCheck.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}