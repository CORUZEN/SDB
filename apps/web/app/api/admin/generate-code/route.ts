import { NextRequest, NextResponse } from 'next/server';
import { createCorsResponse, handlePreflight } from "@/lib/cors";

export async function OPTIONS() {
  return handlePreflight();
}

// POST /api/admin/generate-code - Gerar código de pareamento manual
export async function POST(request: NextRequest) {
  let sql: any;
  
  try {
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return createCorsResponse({ 
        success: false,
        error: 'Database not configured' 
      }, 500);
    }

    const body = await request.json();
    
    // Validar dados opcionais para contexto
    const { description = 'Código gerado pelo administrador', duration = 1 } = body;
    
    if (duration < 0.1 || duration > 24) {
      return createCorsResponse({ 
        success: false,
        error: 'Duração deve estar entre 0.1 e 24 horas' 
      }, 400);
    }

    // Dynamic import to avoid webpack issues
    const { default: postgres } = await import('postgres');
    sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    // Gerar código único de 6 dígitos
    let pairingCode: string = '';
    let isUnique = false;
    let attempts = 0;
    
    // Garantir que o código seja único (máximo 10 tentativas)
    while (!isUnique && attempts < 10) {
      pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const existing = await sql`
        SELECT code FROM pairing_codes 
        WHERE code = ${pairingCode} 
        AND expires_at > NOW()
        AND used = FALSE
      `;
      
      if (existing.length === 0) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      await sql.end();
      return createCorsResponse({ 
        success: false,
        error: 'Não foi possível gerar código único. Tente novamente.' 
      }, 500);
    }
    
    // Criar tabela de códigos temporários se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS pairing_codes (
        code VARCHAR(6) PRIMARY KEY,
        description TEXT,
        duration_hours FLOAT DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        organization_id INTEGER DEFAULT 1
      )
    `;

    // Inserir apenas o código na tabela temporária
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
    
    const result = await sql`
      INSERT INTO pairing_codes (
        code,
        description,
        duration_hours,
        created_at,
        expires_at,
        used,
        organization_id
      ) VALUES (
        ${pairingCode},
        ${description},
        ${duration},
        NOW(),
        ${expiresAt.toISOString()},
        FALSE,
        1
      ) RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return createCorsResponse({ 
        success: false,
        error: 'Erro ao gerar código de pareamento' 
      }, 500);
    }

    const codeData = result[0];

    return createCorsResponse({ 
      success: true,
      data: {
        pairing_code: codeData.code,
        expires_at: codeData.expires_at,
        created_at: codeData.created_at,
        duration_hours: duration,
        description,
        message: `Código ${codeData.code} gerado com validade de ${duration}h`
      }
    }, 201);

  } catch (error: any) {
    console.error('Erro ao gerar código:', error);
    
    if (sql) {
      try {
        await sql.end();
      } catch (endError) {
        console.error('Error closing database connection:', endError);
      }
    }
    
    return createCorsResponse({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, 500);
  }
}

// GET /api/admin/generate-code - Estatísticas de códigos ativos
export async function GET() {
  let sql: any;
  
  try {
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return createCorsResponse({ 
        success: false,
        error: 'Database not configured' 
      }, 500);
    }

    // Dynamic import to avoid webpack issues
    const { default: postgres } = await import('postgres');
    sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    // Buscar estatísticas dos códigos
    const stats = await sql`
      SELECT 
        COUNT(*) as total_codes,
        COUNT(CASE WHEN used = false AND expires_at > NOW() THEN 1 END) as active_codes,
        COUNT(CASE WHEN used = true THEN 1 END) as used_codes,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_codes,
        AVG(duration_hours) as avg_duration_hours
      FROM pairing_codes 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;

    // Buscar códigos ativos recentes
    const recentCodes = await sql`
      SELECT 
        code,
        description,
        created_at,
        expires_at,
        used,
        duration_hours,
        EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutes_remaining
      FROM pairing_codes 
      WHERE expires_at > NOW() AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 10
    `;

    await sql.end();

    return createCorsResponse({ 
      success: true,
      data: {
        statistics: stats[0],
        recent_codes: recentCodes.map((code: any) => {
          return {
            pairing_code: code.code,
            description: code.description || 'Código gerado pelo administrador',
            status: code.used ? 'used' : 'available',
            created_at: code.created_at,
            expires_at: code.expires_at,
            duration_hours: code.duration_hours,
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
    
    return createCorsResponse({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, 500);
  }
}