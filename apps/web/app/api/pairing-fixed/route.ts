import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Fixed pairing validation with postgres');
    
    const { pairing_code } = await request.json();
    
    if (!pairing_code) {
      return NextResponse.json(
        { success: false, error: 'Código de pareamento é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔐 Validating pairing code:', pairing_code);

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Usar uma abordagem diferente para query do metadata
    const result = await sql`
      SELECT id, name, device_identifier, status, organization_id, metadata, created_at
      FROM devices 
      WHERE metadata::text LIKE ${'%"pairing_code":"' + pairing_code + '"%'}
      AND created_at > NOW() - INTERVAL '24 hours'
    `;

    await sql.end();

    if (result.length === 0) {
      console.log('❌ Pairing code not found or expired');
      return NextResponse.json(
        { success: false, error: 'Código de pareamento inválido ou expirado' },
        { status: 404 }
      );
    }

    const device = result[0];
    console.log('✅ Device found for pairing code:', device.id);

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
    console.error('❌ Error validating pairing code:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}