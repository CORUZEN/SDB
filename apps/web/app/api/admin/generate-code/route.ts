import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/generate-code - Gerar código de pareamento manual
export async function POST(request: NextRequest) {
  let sql: any;
  
  try {
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        success: false,
        error: 'Database not configured' 
      }, { status: 500 });
    }

    const body = await request.json();
    
    // Validar dados opcionais para contexto
    const { description = 'Código gerado pelo administrador', duration = 1 } = body;
    
    if (duration < 0.1 || duration > 24) {
      return NextResponse.json({ 
        success: false,
        error: 'Duração deve estar entre 0.1 e 24 horas' 
      }, { status: 400 });
    }

    // Dynamic import to avoid webpack issues
    const { default: postgres } = await import('postgres');
    sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    // Gerar código único de 6 dígitos
    let pairingCode: string;
    let isUnique = false;
    let attempts = 0;
    
    // Garantir que o código seja único (máximo 10 tentativas)
    while (!isUnique && attempts < 10) {
      pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const existing = await sql`
        SELECT pairing_code FROM device_registrations 
        WHERE pairing_code = ${pairingCode} 
        AND expires_at > NOW()
      `;
      
      if (existing.length === 0) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      await sql.end();
      return NextResponse.json({ 
        success: false,
        error: 'Não foi possível gerar código único. Tente novamente.' 
      }, { status: 500 });
    }
    
    // Gerar ID único
    const deviceId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Inserir registro pendente com nova estrutura
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
    
    const result = await sql`
      INSERT INTO device_registrations (
        organization_id,
        pairing_code,
        device_info,
        status,
        created_by_admin,
        created_at,
        expires_at,
        updated_at
      ) VALUES (
        1,
        ${pairingCode!},
        ${JSON.stringify({
          name: `Dispositivo - ${pairingCode!}`,
          device_name: `Dispositivo - ${pairingCode!}`,
          model: 'Pendente de Configuração',
          device_model: 'Pendente de Configuração',
          android_version: 'Detectar Automaticamente',
          device_id: deviceId,
          description: description
        })},
        'pending',
        true,
        NOW(),
        ${expiresAt.toISOString()},
        NOW()
      ) RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao gerar código de pareamento' 
      }, { status: 500 });
    }

    const registration = result[0];
    const deviceInfo = registration.device_info || {};

    return NextResponse.json({ 
      success: true,
      data: {
        pairing_code: registration.pairing_code,
        device_id: deviceInfo.device_id || deviceId,
        expires_at: registration.expires_at,
        created_at: registration.created_at,
        duration_hours: duration,
        description,
        message: `Código ${registration.pairing_code} gerado com validade de ${duration}h`
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao gerar código:', error);
    
    if (sql) {
      try {
        await sql.end();
      } catch (endError) {
        console.error('Error closing database connection:', endError);
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/admin/generate-code - Estatísticas de códigos ativos
export async function GET(request: NextRequest) {
  let sql: any;
  
  try {
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        success: false,
        error: 'Database not configured' 
      }, { status: 500 });
    }

    // Dynamic import to avoid webpack issues
    const { default: postgres } = await import('postgres');
    sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    // Buscar estatísticas dos códigos
    const stats = await sql`
      SELECT 
        COUNT(*) as total_active,
        COUNT(CASE WHEN created_by_admin = true THEN 1 END) as admin_generated,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired,
        AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/3600) as avg_duration_hours
      FROM device_registrations 
      WHERE expires_at > NOW() - INTERVAL '24 hours'
    `;

    // Buscar códigos ativos recentes
    const recentCodes = await sql`
      SELECT 
        pairing_code,
        device_info,
        status,
        created_at,
        expires_at,
        created_by_admin,
        EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutes_remaining
      FROM device_registrations 
      WHERE expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 10
    `;

    await sql.end();

    return NextResponse.json({ 
      success: true,
      data: {
        statistics: stats[0],
        recent_codes: recentCodes.map((code: any) => {
          const deviceInfo = code.device_info || {};
          return {
            pairing_code: code.pairing_code,
            device_name: deviceInfo.name || deviceInfo.device_name || 'Dispositivo',
            device_id: deviceInfo.device_id || 'N/A',
            status: code.status,
            created_at: code.created_at,
            expires_at: code.expires_at,
            created_by_admin: code.created_by_admin,
            minutes_remaining: Math.max(0, Math.floor(Number(code.minutes_remaining)))
          };
        })
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    
    if (sql) {
      try {
        await sql.end();
      } catch (endError) {
        console.error('Error closing database connection:', endError);
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}