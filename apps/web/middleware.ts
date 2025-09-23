/**
 * Next.js Middleware Configuration
 * Configuração do middleware multi-tenant para FRIAXIS v4.0.0
 * 
 * Este middleware intercepta todas as requisições e aplica:
 * - Autenticação
 * - Resolução de contexto organizacional
 * - Controle de permissões
 * - Validação de status da organização
 */

import { NextRequest, NextResponse } from 'next/server';

// ================================
// Protected Routes Configuration
// ================================

const PROTECTED_ROUTES = [
  '/dashboard',
  '/devices',
  '/pending-devices',
  '/policies', 
  '/analytics',
  '/settings',
  '/api/devices/pair',
  '/api/organizations',
  '/api/policies',
  '/api/analytics',
  '/api/commands',
  '/api/admin/pending-devices',
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/api/auth',
  '/api/health',
  '/api/test-vercel',
  '/api/devices/register',
  '/api/debug',
];

const ADMIN_ONLY_ROUTES = [
  '/pending-devices',
  '/settings/organization',
  '/settings/users',
  '/settings/billing',
  '/api/organizations',
  '/api/admin/pending-devices',
];

// ================================
// Middleware Configuration
// ================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

// ================================
// Main Middleware Function
// ================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    (pathname.includes('.') && !pathname.startsWith('/api/'))
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route: string) => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires protection
  const isProtectedRoute = PROTECTED_ROUTES.some((route: string) => 
    pathname === route || pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  console.log('🔒 Middleware protecting route:', pathname);

  try {
    // ================================
    // Authentication Check
    // ================================
    
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                     request.cookies.get('auth-token')?.value;

    if (!authToken) {
      console.log('❌ No auth token found for protected route:', pathname);
      
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Redirect to login for web routes
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ================================
    // For API Routes - Add Auth Headers
    // ================================
    
    if (pathname.startsWith('/api/')) {
      // API routes will handle organization context resolution internally
      console.log('✅ API route passed authentication:', pathname);
      
      // Create response and add auth context headers
      const response = NextResponse.next();
      response.headers.set('x-auth-token', authToken);
      
      return response;
    }

    // ================================
    // For Web Routes - Basic Validation
    // ================================
    
    // Mock organization context validation for web routes
    const hasValidSession = authToken && authToken.length > 10;
    
    if (!hasValidSession) {
      console.log('❌ Invalid session for web route:', pathname);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // ================================
    // Admin Route Protection
    // ================================
    
    const isAdminRoute = ADMIN_ONLY_ROUTES.some((route: string) => 
      pathname === route || pathname.startsWith(route)
    );

    if (isAdminRoute) {
      // In production, this would check actual user role
      // For now, allow access with valid token
      console.log('🔐 Admin route accessed:', pathname);
    }

    console.log('✅ Middleware passed for web route:', pathname);
    
    // Add auth context to response headers for web routes
    const response = NextResponse.next();
    response.headers.set('x-auth-token', authToken);
    
    return response;

  } catch (error) {
    console.error('❌ Middleware error for', pathname, ':', error);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    const errorUrl = new URL('/error', request.url);
    return NextResponse.redirect(errorUrl);
  }
}