import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// GET /api/apply-migration - Aplicar migração device_registrations
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Aplicando migração device_registrations...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se a tabela já existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_registrations'
      );
    `;

    console.log('📋 Tabela device_registrations existe:', tableExists[0].exists);

    if (!tableExists[0].exists) {
      console.log('📦 Criando tabela device_registrations...');
      
      // Aplicar migração
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

      // Criar índices
      await sql`CREATE INDEX idx_device_registrations_pairing_code ON device_registrations(pairing_code);`;
      await sql`CREATE INDEX idx_device_registrations_status ON device_registrations(status);`;
      await sql`CREATE INDEX idx_device_registrations_expires_at ON device_registrations(expires_at);`;

      console.log('✅ Tabela criada com sucesso!');
    }

    await sql.end();

    return NextResponse.json({
      success: true,
      message: tableExists[0].exists ? 'Tabela já existe' : 'Migração aplicada com sucesso',
      tableExists: true
    });

  } catch (error: any) {
    console.error('❌ Erro na migração:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}