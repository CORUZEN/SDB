import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Pairing validation endpoint called');
    
    const { pairing_code } = await request.json();
    
    if (!pairing_code) {
      console.log('❌ Missing pairing code');
      return NextResponse.json(
        { success: false, error: 'Código de pareamento é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔐 Validating pairing code:', pairing_code);

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Primeiro, verificar se há devices com pairing codes
    const allDevicesWithCodes = await sql`
      SELECT id, name, metadata->>'pairing_code' as pairing_code, status, created_at
      FROM devices 
      WHERE metadata->>'pairing_code' IS NOT NULL
      AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('📱 Devices com pairing codes encontrados:', allDevicesWithCodes.length);
    allDevicesWithCodes.forEach(d => {
      console.log(`  - ${d.name}: ${d.pairing_code} (status: ${d.status})`);
    });

    // Buscar dispositivo pelo pairing_code no metadata
    const result = await sql`
      SELECT id, name, device_identifier, status, organization_id, metadata, created_at
      FROM devices 
      WHERE metadata->>'pairing_code' = ${pairing_code}
      AND created_at > NOW() - INTERVAL '24 hours'
    `;

    console.log('🔍 Resultado da busca específica:', result.length);

    await sql.end();

    if (result.length === 0) {
      console.log('❌ Pairing code not found or expired');
      return NextResponse.json(
        { success: false, error: 'Código de pareamento inválido ou expirado' },
        { status: 404 }
      );
    }

    const device = result[0];
    console.log('✅ Device found for pairing:', device.id);

    return NextResponse.json({
      success: true,
      data: {
        device_id: device.id,
        name: device.name,
        device_identifier: device.device_identifier,
        status: device.status,
        organization_id: device.organization_id,
        pairing_code: pairing_code,
        created_at: device.created_at,
        message: 'Código válido! Dispositivo encontrado e pronto para aprovação.'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in pairing validation:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Pairing validation endpoint is working',
    timestamp: new Date().toISOString()
  });
}