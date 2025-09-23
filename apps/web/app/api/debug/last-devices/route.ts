import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Buscar os últimos 5 dispositivos registrados
    const result = await sql`
      SELECT id, name, device_identifier, status, metadata, created_at
      FROM devices 
      ORDER BY created_at DESC
      LIMIT 5
    `;

    await sql.end();

    console.log('📱 Últimos dispositivos:', result);

    return NextResponse.json({
      success: true,
      data: {
        count: result.length,
        devices: result.map(device => ({
          id: device.id,
          name: device.name,
          device_identifier: device.device_identifier,
          status: device.status,
          metadata: device.metadata,
          pairing_code: device.metadata ? (device.metadata as any).pairing_code : null,
          created_at: device.created_at
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar dispositivos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}