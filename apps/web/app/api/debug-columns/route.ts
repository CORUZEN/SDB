import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar colunas detalhadamente
    const columns = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `;
    
    // Verificar se tabela devices tem dados
    const deviceCount = await sql`SELECT COUNT(*) as count FROM devices`;
    console.log('📱 Total de devices na tabela:', deviceCount[0].count);
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      columns: columns,
      device_count: deviceCount[0].count,
      message: 'Column structure verified successfully'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}