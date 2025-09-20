/**
 * Organizations API - User Organization Context
 * /api/organizations/me
 * 
 * Retorna a organização e permissões do usuário autenticado
 * Usado pelo AuthProvider para carregar contexto organizacional
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Loading organization context for user...');

    // Get auth token from headers
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mock organization context for development
    // In production, this would verify token and query database
    const mockUserContext = {
      organization: {
        id: 1, // Usar ID numérico para consistência com banco
        name: 'Development Organization',
        slug: 'dev-org',
        status: 'active',
        subscription_tier: 'enterprise',
        created_at: new Date().toISOString(),
      },
      role: 'admin',
      permissions: [
        'devices:read',
        'devices:write',
        'devices:delete',
        'policies:read',
        'policies:write',
        'analytics:read',
        'organization:manage',
        'users:manage',
      ],
      user: {
        id: 1, // Usar ID numérico para compatibilidade com banco
        email: 'dev@teste.com',
        name: 'Usuário de Desenvolvimento',
        status: 'active',
      }
    };

    console.log('✅ Organization context loaded:', mockUserContext.organization.name);

    return NextResponse.json(mockUserContext, { status: 200 });

  } catch (error) {
    console.error('❌ Error loading organization context:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}