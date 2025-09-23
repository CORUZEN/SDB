import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint - testando conexão e tabelas...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 1. Testar conexão básica
    const connectionTest = await sql`SELECT 1 as test`;
    console.log('✅ Conexão OK:', connectionTest);

    // 2. Verificar se a tabela device_registrations existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_registrations'
      );
    `;
    console.log('📋 Tabela device_registrations existe:', tableExists[0].exists);

    // 3. Listar todas as tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('📊 Tabelas existentes:', tables.map(t => t.table_name));

    // 4. Tentar criar a tabela se não existir
    if (!tableExists[0].exists) {
      console.log('🔧 Criando tabela device_registrations...');
      
      await sql`
        CREATE TABLE device_registrations (
            id SERIAL PRIMARY KEY,
            device_id VARCHAR(255) UNIQUE NOT NULL,
            pairing_code VARCHAR(6) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            model VARCHAR(255) NOT NULL,
            android_version VARCHAR(50) NOT NULL,
            firebase_token TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            approved_at TIMESTAMP,
            approved_by VARCHAR(255)
        );
      `;

      console.log('✅ Tabela criada com sucesso!');
    }

    await sql.end();

    return NextResponse.json({
      success: true,
      connectionOk: true,
      tableExists: true,
      tables: tables.map(t => t.table_name),
      message: 'Debug concluído com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      code: error.code
    }, { status: 500 });
  }
}