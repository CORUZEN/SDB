import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// GET /api/admin/pending-devices - Listar dispositivos pendentes de aprovação
export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Buscar registros pendentes não expirados
    const result = await sql`
      SELECT 
        device_id,
        pairing_code,
        name,
        model,
        android_version,
        status,
        created_at,
        expires_at
      FROM device_registrations 
      WHERE status = 'pending' 
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    await sql.end();

    const pendingDevices = result.map((device: any) => ({
      device_id: device.device_id,
      pairing_code: device.pairing_code,
      name: device.name,
      model: device.model,
      android_version: device.android_version,
      status: device.status,
      created_at: device.created_at?.toISOString(),
      expires_at: device.expires_at?.toISOString()
    }));

    return NextResponse.json({ 
      success: true,
      data: pendingDevices
    });

  } catch (error: any) {
    console.error('Erro ao buscar dispositivos pendentes:', error);
    
    // Se a tabela não existe, retornar resposta específica
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ 
        success: false,
        error: 'Tabela device_registrations não existe. Configure o banco de dados.',
        needsSetup: true
      }, { status: 200 }); // 200 para permitir que o frontend processe
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST /api/admin/pending-devices - Aprovar/rejeitar dispositivo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pairing_code, action } = body; // action: 'approve' ou 'reject'

    if (!pairing_code || !action) {
      return NextResponse.json({ 
        success: false,
        error: 'pairing_code e action são obrigatórios' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false,
        error: 'action deve ser "approve" ou "reject"' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    if (action === 'approve') {
      // Aprovar dispositivo - primeiro buscar dados do registro
      const registration = await sql`
        SELECT * FROM device_registrations 
        WHERE pairing_code = ${pairing_code} 
        AND status = 'pending'
        AND expires_at > NOW()
      `;

      if (registration.length === 0) {
        await sql.end();
        return NextResponse.json({ 
          success: false,
          error: 'Registro não encontrado ou expirado' 
        }, { status: 404 });
      }

      const reg = registration[0];

      // Criar dispositivo na tabela principal
      await sql`
        INSERT INTO devices (
          name, 
          status, 
          owner,
          os_version,
          created_at, 
          updated_at
        ) VALUES (
          ${reg.name},
          'online',
          'Sistema',
          ${reg.android_version},
          NOW(),
          NOW()
        )
      `;

      // Marcar registro como aprovado
      await sql`
        UPDATE device_registrations 
        SET status = 'approved', approved_at = NOW(), approved_by = 'admin'
        WHERE pairing_code = ${pairing_code}
      `;

    } else {
      // Rejeitar dispositivo
      await sql`
        UPDATE device_registrations 
        SET status = 'rejected', approved_at = NOW(), approved_by = 'admin'
        WHERE pairing_code = ${pairing_code}
      `;
    }

    await sql.end();

    return NextResponse.json({ 
      success: true,
      message: `Dispositivo ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`
    });

  } catch (error: any) {
    console.error('Erro ao processar aprovação:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}