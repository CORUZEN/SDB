import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// GET /api/devices/register/[code] - Verificar status de aprovação
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;

    if (!code) {
      return NextResponse.json({ 
        success: false,
        error: 'Código de emparelhamento é obrigatório' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar status do registro
    const result = await sql`
      SELECT * FROM device_registrations 
      WHERE pairing_code = ${code} 
      AND expires_at > NOW()
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Código inválido ou expirado' 
      }, { status: 404 });
    }

    const registration = result[0];

    return NextResponse.json({ 
      success: true,
      data: {
        device_id: registration.device_id,
        status: registration.status,
        approved: registration.status === 'approved'
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar registro:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}