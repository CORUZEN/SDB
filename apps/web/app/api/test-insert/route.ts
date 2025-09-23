import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// Endpoint super simples para teste de inserção
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Teste de inserção simplificado...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Inserção mínima na tabela devices
    const result = await sql`
      INSERT INTO devices (
        organization_id,
        name,
        device_type,
        os_type,
        status,
        metadata
      ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Teste Device',
        'smartphone',
        'android',
        'inactive',
        '{"test": true}'::jsonb
      ) RETURNING id, name, status
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      message: 'Inserção realizada com sucesso',
      data: result[0]
    });
    
  } catch (error: any) {
    console.error('❌ Erro na inserção:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}