import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar colunas com detalhes
    const columns = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length,
        column_name || ' ' || data_type || ' ' || 
        CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END as column_info
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `;
    
    // Verificar constraints
    const constraints = await sql`
      SELECT 
        constraint_name,
        constraint_type,
        table_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'devices'
    `;
    
    // Verificar se RLS está ativo
    const rlsCheck = await sql`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE tablename = 'devices'
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      table_info: {
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          max_length: col.character_maximum_length,
          full_info: col.column_info
        })),
        constraints: constraints,
        rls_enabled: rlsCheck.length > 0 ? rlsCheck[0].rowsecurity : false
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}