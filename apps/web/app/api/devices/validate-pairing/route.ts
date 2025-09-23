import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// POST /api/devices/validate-pairing - Validar código de emparelhamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pairingCode } = body;
    
    if (!pairingCode) {
      return NextResponse.json({ 
        success: false,
        error: 'Código de emparelhamento é obrigatório' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se existe dispositivo com este pairing code
    const devices = await sql`
      SELECT 
        d.id,
        d.organization_id,
        d.name,
        d.status,
        d.metadata,
        o.name as organization_name
      FROM devices d
      JOIN organizations o ON o.id = d.organization_id
      WHERE d.metadata->>'pairing_code' = ${pairingCode}
      AND d.status = 'inactive'
      AND d.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY d.created_at DESC
      LIMIT 1
    `;

    await sql.end();

    if (devices.length === 0) {
      return NextResponse.json({
        isValid: false,
        error: 'Código de emparelhamento inválido ou expirado'
      }, { status: 404 });
    }

    const device = devices[0];

    return NextResponse.json({
      isValid: true,
      organizationId: device.organization_id.toString(),
      organizationName: device.organization_name,
      deviceId: device.id,
      deviceName: device.name,
      expiresAt: null // Para simplicidade, não vamos implementar expiração por enquanto
    });

  } catch (error: any) {
    console.error('Erro ao validar pairing code:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}