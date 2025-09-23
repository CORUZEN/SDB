import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing postgres connection...');
    
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    const result = await sql`SELECT COUNT(*) as total FROM devices`;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      message: 'Postgres connection working',
      device_count: result[0].total
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}