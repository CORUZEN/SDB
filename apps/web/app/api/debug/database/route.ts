import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    const databaseUrl = process.env.DATABASE_URL;
    const hasFirebaseProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL não configurado',
        data: {
          databaseUrl: 'Não configurado',
          hasFirebaseProjectId
        }
      }, { status: 500 });
    }

    // Importar postgres dinamicamente para evitar problemas de webpack
    const { default: postgres } = await import('postgres');
    const sql = postgres(databaseUrl, { ssl: 'require' });

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
        SELECT column_name, data_type, is_nullable, column_default
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
        databaseUrl: 'Configurado',
        hasFirebaseProjectId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar banco:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.name || 'Database connection error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}