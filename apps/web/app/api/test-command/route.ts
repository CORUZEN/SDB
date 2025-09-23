import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Testing command creation:', body);
    
    const { deviceId, type } = body;
    
    if (!deviceId || !type) {
      return NextResponse.json({ 
        success: false,
        error: 'deviceId e type são obrigatórios' 
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    try {
      // Test simples inserção
      const result = await sql`
        INSERT INTO commands (device_id, type, status)
        VALUES (${deviceId}, ${type}, 'pending')
        RETURNING id, device_id, type, status, created_at
      `;
      
      await sql.end();
      
      return NextResponse.json({ 
        success: true, 
        data: result[0],
        message: 'Command created successfully'
      });
      
    } catch (insertError: any) {
      console.error('❌ SQL Error:', insertError);
      await sql.end();
      
      return NextResponse.json({ 
        success: false,
        error: insertError.message,
        code: insertError.code 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ General Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}