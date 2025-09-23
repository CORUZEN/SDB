import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando conexão com banco...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Teste básico de conexão
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    console.log('✅ Conexão bem-sucedida:', result[0]);
    
    // Listar tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      timestamp: result[0].current_time,
      database_version: result[0].db_version,
      tables: tables.map(t => t.table_name)
    });
    
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}