import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar colunas detalhadamente
    const columns = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `;
    
    // Tentar inserção super simples primeiro
    try {
      const testResult = await sql`
        INSERT INTO devices (organization_id, name) 
        VALUES (1, 'Test Simple Device') 
        RETURNING id, name
      `;
      console.log('✅ Inserção simples OK:', testResult[0]);
    } catch (insertError: any) {
      console.error('❌ Erro na inserção simples:', insertError.message);
    }
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      columns: columns,
      test_insert: 'Check logs for results'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}