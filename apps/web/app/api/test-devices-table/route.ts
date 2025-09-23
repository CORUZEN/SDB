import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar estrutura da tabela devices
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `;
    
    // Verificar se existem organizações
    const orgs = await sql`SELECT id, name FROM organizations LIMIT 3`;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      devices_table: {
        exists: columns.length > 0,
        columns: columns
      },
      organizations: orgs
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}