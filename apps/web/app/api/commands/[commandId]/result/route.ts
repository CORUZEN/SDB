import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// PUT /api/commands/[commandId]/result - Report command result
export async function PUT(
  request: NextRequest,
  { params }: { params: { commandId: string } }
) {
  try {
    const { commandId } = params;
    const { result } = await request.json();
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Resultado é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📋 Recebendo resultado do comando ${commandId}`);

    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Atualizar resultado do comando
    const updateResult = await sql`
      UPDATE commands 
      SET result_json = ${JSON.stringify(result)}, 
          status = 'completed',
          executed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${commandId}
      RETURNING *
    `;

    await sql.end();

    if (updateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comando não encontrado' },
        { status: 404 }
      );
    }

    const command = updateResult[0];
    console.log(`✅ Resultado do comando ${commandId} salvo com sucesso`);

    return NextResponse.json({
      success: true,
      data: {
        id: command.id,
        device_id: command.device_id,
        type: command.type,
        status: command.status,
        result_json: command.result_json ? JSON.parse(command.result_json) : null,
        executed_at: command.executed_at?.toISOString(),
        updated_at: command.updated_at?.toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao salvar resultado do comando:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}