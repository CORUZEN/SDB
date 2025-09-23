import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Verificar estrutura da tabela commands
    const structure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'commands'
      ORDER BY ordinal_position
    `;

    // Contar registros existentes
    const count = await sql`SELECT COUNT(*) as total FROM commands`;

    // Buscar alguns registros de exemplo
    const examples = await sql`
      SELECT * FROM commands 
      ORDER BY created_at DESC 
      LIMIT 3
    `;

    await sql.end();

    return NextResponse.json({
      success: true,
      data: {
        table_structure: structure,
        total_records: count[0].total,
        example_records: examples
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao analisar tabela commands:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}