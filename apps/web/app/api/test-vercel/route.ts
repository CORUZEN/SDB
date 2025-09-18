import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'ok',
      message: 'API funcionando no Vercel',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Erro no API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}