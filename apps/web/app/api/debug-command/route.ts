import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing command creation step by step...');
    
    const body = await request.json();
    console.log('📥 Received body:', body);
    
    const { deviceId, type, payload } = body;
    
    if (!deviceId || !type) {
      return NextResponse.json({ 
        success: false,
        error: 'deviceId e type são obrigatórios',
        received: { deviceId, type }
      }, { status: 400 });
    }

    console.log('✅ Validation passed');

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    try {
      console.log('🔍 Checking if device exists...');
      const deviceCheck = await sql`
        SELECT id FROM devices WHERE id = ${deviceId}
      `;
      
      console.log('📊 Device check result:', deviceCheck.length);
      
      if (deviceCheck.length === 0) {
        await sql.end();
        return NextResponse.json({ 
          success: false,
          error: 'Device não encontrado',
          device_id: deviceId 
        }, { status: 404 });
      }

      console.log('🔍 Preparing payload...');
      const enrichedPayload = {
        ...payload,
        original_device_id: deviceId
      };
      
      console.log('🔍 Inserting command...');
      const result = await sql`
        INSERT INTO commands (device_id, type, payload_json, status)
        VALUES (
          gen_random_uuid(),
          ${type}, 
          ${JSON.stringify(enrichedPayload)}, 
          'pending'
        )
        RETURNING id, device_id, type, status, created_at
      `;
      
      console.log('✅ Insert successful:', result[0]);
      
      await sql.end();
      
      return NextResponse.json({ 
        success: true,
        data: result[0],
        message: 'Command created successfully!'
      });
      
    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      await sql.end();
      
      return NextResponse.json({ 
        success: false,
        error: 'Database error',
        details: {
          message: dbError.message,
          code: dbError.code,
          detail: dbError.detail
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'General error',
      details: error.message
    }, { status: 500 });
  }
}