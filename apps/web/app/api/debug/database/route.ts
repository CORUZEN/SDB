import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se a tabela device_registrations existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_registrations'
      );
    `;

    // Verificar estrutura da tabela se existir
    let tableStructure = null;
    if (tableExists[0].exists) {
      tableStructure = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'device_registrations'
        ORDER BY ordinal_position;
      `;
    }

    // Contar registros na tabela
    let recordCount = 0;
    if (tableExists[0].exists) {
      const count = await sql`SELECT COUNT(*) FROM device_registrations`;
      recordCount = parseInt(count[0].count);
    }

    await sql.end();

    return NextResponse.json({
      success: true,
      data: {
        tableExists: tableExists[0].exists,
        tableStructure,
        recordCount,
        databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar banco:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}