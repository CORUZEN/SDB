/**
 * API: Device Test Heartbeat
 * Endpoint simples para testar se a estrutura funciona
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    console.log(`💓 Test heartbeat received from device: ${deviceId}`);

    return NextResponse.json({
      success: true,
      message: 'Test heartbeat received',
      device_id: deviceId,
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('❌ Error in test heartbeat:', error);
    
    return NextResponse.json(
      { 
        error: 'Test heartbeat failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}