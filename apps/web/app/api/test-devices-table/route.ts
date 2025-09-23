import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar estrutura da tabela devices
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `;
    
    // Verificar se existem organizações
    const orgs = await sql`SELECT id, name FROM organizations LIMIT 3`;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      devices_table: {
        exists: columns.length > 0,
        columns: columns
      },
      organizations: orgs
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST para testar inserção
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Teste de inserção na tabela devices...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Primeiro verificar organizações
    const orgs = await sql`SELECT id, name FROM organizations LIMIT 2`;
    console.log('🏢 Organizações disponíveis:', orgs);
    
    if (orgs.length === 0) {
      await sql.end();
      return NextResponse.json({
        success: false,
        error: 'Nenhuma organização disponível'
      }, { status: 400 });
    }
    
    const orgId = orgs[0].id;
    console.log('🎯 Usando organização ID:', orgId);
    
    // Tentar inserção super simples
    try {
      console.log('📝 Tentando inserção mínima...');
      
      const result = await sql`
        INSERT INTO devices (organization_id, name) 
        VALUES (${orgId}, 'Test Device Simple') 
        RETURNING id, organization_id, name, created_at
      `;
      
      console.log('✅ Inserção simples OK:', result[0]);
      
      await sql.end();
      
      return NextResponse.json({
        success: true,
        message: 'Inserção na tabela devices funcionou!',
        inserted_device: result[0],
        organization_used: orgs[0]
      });
      
    } catch (insertError: any) {
      console.error('❌ Erro específico na inserção:', insertError);
      console.error('Código do erro:', insertError.code);
      console.error('Detalhes:', insertError.detail);
      
      await sql.end();
      
      return NextResponse.json({
        success: false,
        error: 'Erro na inserção',
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail
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