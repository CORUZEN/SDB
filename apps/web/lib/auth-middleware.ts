// Middleware de autenticação para API routes
// Verifica tokens Firebase e gerencia sessões

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from './firebase-admin';
import postgres from 'postgres';

// Tipo para usuário autenticado
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'operator' | 'viewer';
  isActive: boolean;
}

// Middleware de autenticação
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização requerido' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);

    // Verificar token com Firebase Admin
    const { success, decodedToken, error } = await verifyIdToken(idToken);
    if (!success || !decodedToken) {
      return NextResponse.json(
        { error: error || 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar usuário no banco de dados
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    const users = await sql`
      SELECT firebase_uid, email, display_name, role, is_active 
      FROM users 
      WHERE firebase_uid = ${decodedToken.uid} AND is_active = true
    `;

    if (users.length === 0) {
      // Criar usuário automaticamente se não existir (primeira vez)
      await sql`
        INSERT INTO users (firebase_uid, email, display_name, role)
        VALUES (${decodedToken.uid}, ${decodedToken.email || ''}, ${decodedToken.name || decodedToken.email || ''}, 'operator')
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          last_login_at = NOW()
      `;

      const newUsers = await sql`
        SELECT firebase_uid, email, display_name, role, is_active 
        FROM users 
        WHERE firebase_uid = ${decodedToken.uid}
      `;

      if (newUsers.length === 0) {
        return NextResponse.json(
          { error: 'Erro ao criar usuário' },
          { status: 500 }
        );
      }
    }

    // Atualizar último login
    await sql`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE firebase_uid = ${decodedToken.uid}
    `;

    const user = users[0] || await sql`
      SELECT firebase_uid, email, display_name, role, is_active 
      FROM users 
      WHERE firebase_uid = ${decodedToken.uid}
    `.then(result => result[0]);

    await sql.end();

    // Criar objeto AuthUser
    const authUser: AuthUser = {
      uid: user.firebase_uid,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      isActive: user.is_active,
    };

    // Chamar handler com usuário autenticado
    return await handler(request, authUser);

  } catch (error) {
    console.error('Erro no middleware de auth:', error);
    return NextResponse.json(
      { error: 'Erro interno de autenticação' },
      { status: 500 }
    );
  }
}

// Middleware de autorização por papel
export function withRole(requiredRole: 'admin' | 'operator' | 'viewer') {
  return function(
    request: NextRequest,
    handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
  ) {
    return withAuth(request, async (req, user) => {
      const roleHierarchy = { admin: 3, operator: 2, viewer: 1 };
      
      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        return NextResponse.json(
          { error: 'Permissão insuficiente' },
          { status: 403 }
        );
      }

      return await handler(req, user);
    });
  };
}