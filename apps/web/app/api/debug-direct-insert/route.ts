import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Inserindo device de teste com pairing code...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Gerar um device_identifier no mesmo formato
    const deviceId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pairingCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    console.log('📱 Inserindo device:', deviceId);
    console.log('🔐 Com pairing code:', pairingCode);
    
    try {
      // Inserir device com pairing code no metadata
      const result = await sql`
        INSERT INTO devices (
          id,
          organization_id,
          name,
          device_identifier,
          status,
          metadata
        ) VALUES (
          ${deviceId},
          1,
          'Test Device with Pairing',
          ${deviceId},
          'inactive',
          ${JSON.stringify({ pairing_code: pairingCode })}
        ) RETURNING id, name, organization_id, status, metadata, created_at
      `;
      
      console.log('✅ Device inserido com sucesso:', result[0]);
      
      await sql.end();
      
      return NextResponse.json({
        success: true,
        message: 'Device de teste criado com pairing code!',
        new_device: result[0],
        pairing_code: pairingCode
      });
      
    } catch (insertError: any) {
      console.error('❌ Erro na inserção:', insertError);
      
      await sql.end();
      
      return NextResponse.json({
        success: false,
        error: 'Erro na inserção',
        details: {
          message: insertError.message,
          code: insertError.code,
          detail: insertError.detail
        }
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}