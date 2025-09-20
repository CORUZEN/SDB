import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se as tabelas existem
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    // Verificar device_registrations
    let deviceRegistrations = null;
    try {
      deviceRegistrations = await sql`
        SELECT COUNT(*) as count, 
               array_agg(status) as statuses
        FROM device_registrations
      `;
    } catch (e) {
      deviceRegistrations = { error: 'Table does not exist' };
    }

    // Verificar devices
    let devices = null;
    try {
      devices = await sql`
        SELECT COUNT(*) as count
        FROM devices
      `;
    } catch (e) {
      devices = { error: 'Table does not exist' };
    }

    await sql.end();

    return NextResponse.json({
      tables: tables.map(t => t.table_name),
      device_registrations: deviceRegistrations,
      devices: devices,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error checking tables:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}