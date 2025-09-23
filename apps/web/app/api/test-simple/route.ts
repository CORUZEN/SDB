import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Teste GET funcionando'
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Teste POST funcionando'
  });
}