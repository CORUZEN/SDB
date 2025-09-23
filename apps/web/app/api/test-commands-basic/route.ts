import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing basic commands table access...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Testar SELECT simples na tabela commands
    const result = await sql`
      SELECT COUNT(*) as total FROM commands
    `;
    
    console.log('✅ Commands table accessible, count:', result[0].total);
    
    await sql.end();
    
    return NextResponse.json({ 
      success: true,
      message: 'Commands table accessible',
      count: result[0].total
    });
    
  } catch (error: any) {
    console.error('❌ Error accessing commands table:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing minimal command insert...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Teste de inserção mínima
    const result = await sql`
      INSERT INTO commands (device_id, type, status)
      VALUES (gen_random_uuid(), 'test', 'pending')
      RETURNING id, type, status, created_at
    `;
    
    console.log('✅ Minimal insert successful:', result[0]);
    
    await sql.end();
    
    return NextResponse.json({ 
      success: true,
      message: 'Minimal command insert successful',
      data: result[0]
    });
    
  } catch (error: any) {
    console.error('❌ Error inserting command:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}