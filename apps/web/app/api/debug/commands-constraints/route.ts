import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    
    // Verificar constraints da tabela commands
    const constraints = await sql`
      SELECT 
        constraint_name, 
        constraint_type, 
        column_name,
        foreign_table_name,
        foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'commands'
    `;
    
    // Verificar indexes
    const indexes = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'commands'
    `;
    
    await sql.end();
    
    return NextResponse.json({
      success: true,
      data: {
        constraints: constraints,
        indexes: indexes
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}