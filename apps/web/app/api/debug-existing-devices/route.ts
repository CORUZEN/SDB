import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Ver dispositivos existentes para entender a estrutura
    const existingDevices = await sql`
      SELECT * FROM devices LIMIT 2
    `;
    
    // Ver quais campos são NOT NULL
    const notNullColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      AND is_nullable = 'NO'
      ORDER BY ordinal_position
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      existing_devices: existingDevices,
      required_fields: notNullColumns.map(col => col.column_name),
      analysis: {
        devices_count: existingDevices.length,
        has_data: existingDevices.length > 0
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST para tentar inserção baseada em dispositivo existente
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Analisando dispositivos existentes para inserção...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Ver um dispositivo existente
    const existing = await sql`SELECT * FROM devices LIMIT 1`;
    
    if (existing.length === 0) {
      await sql.end();
      return NextResponse.json({
        success: false,
        error: 'Nenhum dispositivo existente para usar como modelo'
      }, { status: 400 });
    }
    
    const model = existing[0];
    console.log('📱 Usando dispositivo modelo:', model.id);
    
    // Tentar inserir um similar
    try {
      const result = await sql`
        INSERT INTO devices (
          organization_id,
          name,
          device_identifier,
          device_type,
          os_type,
          status
        ) VALUES (
          ${model.organization_id},
          'Test Copy Device',
          'test_copy_' + ${Date.now()},
          ${model.device_type || 'smartphone'},
          ${model.os_type || 'android'},
          'inactive'
        ) RETURNING id, name, organization_id, created_at
      `;
      
      console.log('✅ Inserção baseada em modelo funcionou:', result[0]);
      
      await sql.end();
      
      return NextResponse.json({
        success: true,
        message: 'Inserção funcionou usando modelo existente!',
        model_device: {
          id: model.id,
          name: model.name,
          organization_id: model.organization_id
        },
        new_device: result[0]
      });
      
    } catch (insertError: any) {
      console.error('❌ Erro na inserção baseada em modelo:', insertError);
      await sql.end();
      
      return NextResponse.json({
        success: false,
        error: 'Erro na inserção mesmo com modelo',
        details: insertError.message,
        code: insertError.code
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