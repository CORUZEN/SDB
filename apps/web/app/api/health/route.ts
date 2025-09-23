import { NextResponse } from "next/server";
import postgres from 'postgres';

export async function GET() {
  let migrationResult = { applied: false, error: null };
  
  try {
    // Aplicar migração device_registrations se não existir
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se a tabela existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_registrations'
      );
    `;

    if (!tableExists[0].exists) {
      // Criar tabela
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
      await sql`CREATE INDEX IF NOT EXISTS idx_device_registrations_pairing_code ON device_registrations(pairing_code);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_device_registrations_expires_at ON device_registrations(expires_at);`;

      migrationResult.applied = true;
    }

    await sql.end();
  } catch (error: any) {
    migrationResult.error = error.message;
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID
    },
    migration: migrationResult
  });
}