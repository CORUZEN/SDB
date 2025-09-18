import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return NextResponse.json({
      message: 'Autenticação funcionando!',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    });
  });
}