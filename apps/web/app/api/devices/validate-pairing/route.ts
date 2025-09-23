import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    const { pairing_code } = await request.json();
    
    console.log('🔍 Validando pairing code:', pairing_code);

    if (!pairing_code) {
      return NextResponse.json(
        { success: false, error: 'Código de pareamento é obrigatório' },
        { status: 400 }
      );
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar se o código existe na tabela pairing_codes e ainda é válido
    const codeResult = await sql`
      SELECT code, description, expires_at, used, created_at
      FROM pairing_codes 
      WHERE code = ${pairing_code}
      AND expires_at > NOW()
      AND used = FALSE
    `;

    if (codeResult.length === 0) {
      await sql.end();
      console.log('❌ Pairing code não encontrado, expirado ou já usado');
      return NextResponse.json(
        { success: false, error: 'Código de pareamento inválido, expirado ou já utilizado' },
        { status: 404 }
      );
    }

    const codeData = codeResult[0];
    console.log('✅ Código válido encontrado:', codeData);

    // Verificar se já existe um dispositivo com este código (evitar duplicatas)
    const existingDevice = await sql`
      SELECT id FROM devices 
      WHERE metadata->>'pairing_code' = ${pairing_code}
    `;

    await sql.end();

    if (existingDevice.length > 0) {
      console.log('⚠️ Dispositivo já existe com este código');
      return NextResponse.json(
        { success: false, error: 'Este código já foi utilizado por outro dispositivo' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pairing_code: pairing_code,
        description: codeData.description,
        expires_at: codeData.expires_at,
        created_at: codeData.created_at,
        message: 'Código válido! Você pode usar este código para pareamento.'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na validação do pairing code:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}