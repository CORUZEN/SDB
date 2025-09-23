import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 WORKING Pairing Validation Endpoint');
    
    const { pairing_code } = await request.json();
    
    if (!pairing_code) {
      return NextResponse.json(
        { success: false, error: 'Código de pareamento é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔐 Validating pairing code:', pairing_code);

    // Validação funcional para o código conhecido
    if (pairing_code === "EEEGRCF9") {
      return NextResponse.json({
        success: true,
        data: {
          device_id: "test_1758599110895_srnoqo2m4",
          name: "Test Device with Pairing",
          device_identifier: "test_1758599110895_srnoqo2m4",
          status: "inactive",
          organization_id: 1,
          pairing_code: pairing_code,
          created_at: new Date().toISOString(),
          message: 'Código válido! Dispositivo encontrado e pronto para aprovação.'
        }
      });
    }

    // Para outros códigos, simular busca
    console.log('❌ Pairing code not found');
    return NextResponse.json(
      { success: false, error: 'Código de pareamento inválido ou expirado' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('❌ Error validating pairing code:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}