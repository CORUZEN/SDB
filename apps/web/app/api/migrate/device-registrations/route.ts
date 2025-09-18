import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Executar migração para criar a tabela device_registrations
    await sql`
      CREATE TABLE IF NOT EXISTS device_registrations (
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
    await sql`CREATE INDEX IF NOT EXISTS idx_device_registrations_pairing_code ON device_registrations(pairing_code);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_device_registrations_expires_at ON device_registrations(expires_at);`;

    // Inserir alguns dados de teste
    await sql`
      INSERT INTO device_registrations (
        device_id, pairing_code, name, model, android_version, expires_at
      ) VALUES 
      ('test-device-1', '123456', 'Smartphone Teste', 'Samsung Galaxy S21', '13', NOW() + INTERVAL '24 hours'),
      ('test-device-2', '789012', 'Tablet Corporativo', 'iPad Pro', '14', NOW() + INTERVAL '24 hours')
      ON CONFLICT (device_id) DO NOTHING;
    `;

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Migração executada com sucesso e dados de teste inseridos'
    });

  } catch (error: any) {
    console.error('Erro na migração:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}