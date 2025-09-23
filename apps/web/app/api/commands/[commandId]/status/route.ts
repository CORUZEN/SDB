import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// PUT /api/commands/[commandId]/status - Update command status
export async function PUT(
  request: NextRequest,
  { params }: { params: { commandId: string } }
) {
  try {
    const { commandId } = params;
    const { status } = await request.json();
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🔄 Atualizando status do comando ${commandId} para: ${status}`);

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Atualizar status do comando
    const result = await sql`
      UPDATE commands 
      SET status = ${status}, 
          updated_at = NOW(),
          ${status === 'sent' ? sql`sent_at = NOW()` : sql``}
          ${status === 'executed' ? sql`executed_at = NOW()` : sql``}
      WHERE id = ${commandId}
      RETURNING *
    `;

    await sql.end();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comando não encontrado' },
        { status: 404 }
      );
    }

    const command = result[0];
    console.log(`✅ Status do comando ${commandId} atualizado para: ${status}`);

    return NextResponse.json({
      success: true,
      data: {
        id: command.id,
        device_id: command.device_id,
        type: command.type,
        status: command.status,
        updated_at: command.updated_at?.toISOString(),
        sent_at: command.sent_at?.toISOString() || null,
        executed_at: command.executed_at?.toISOString() || null
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar status do comando:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}