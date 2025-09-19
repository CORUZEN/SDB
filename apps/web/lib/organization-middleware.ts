/**
 * Middleware para Multi-tenancy com Row Level Security (RLS)
 * FRIAXIS v4.0.0 - Sistema Multi-tenant
 * 
 * Este middleware gerencia:
 * - Contexto da organização baseado no usuário autenticado
 * - Configuração de RLS no PostgreSQL
 * - Validação de permissões de acesso
 * - Cache de contexto para performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { Organization, OrganizationMember, User } from '../../../packages/shared/types';

// ================================
// Types and Interfaces
// ================================

export interface OrganizationContext {
  organization: Organization;
  user: User;
  member: OrganizationMember;
  permissions: {
    devices: { read: boolean; write: boolean; delete: boolean };
    policies: { read: boolean; write: boolean; delete: boolean };
    users: { read: boolean; write: boolean; delete: boolean };
    analytics: { read: boolean };
    settings: { read: boolean; write: boolean };
  };
}

export interface RequestWithOrganization extends NextRequest {
  organization?: OrganizationContext;
}

// ================================
// Cache Management
// ================================

const organizationCache = new Map<string, {
  context: OrganizationContext;
  expires: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedContext(userId: string): OrganizationContext | null {
  const cached = organizationCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.context;
  }
  organizationCache.delete(userId);
  return null;
}

function setCachedContext(userId: string, context: OrganizationContext): void {
  organizationCache.set(userId, {
    context,
    expires: Date.now() + CACHE_TTL,
  });
}

// ================================
// Database Connection with RLS
// ================================

export async function createRLSConnection(organizationId: string, userId: string) {
  // TODO: Implement database connection with RLS
  // This will be implemented when we integrate with Neon PostgreSQL
  console.log(`Setting RLS context: org=${organizationId}, user=${userId}`);
  
  // Placeholder for RLS setup
  return {
    setRLSContext: async () => {
      // Execute: SET LOCAL app.current_organization_id = organizationId;
      // Execute: SET LOCAL app.current_user_id = userId;
    }
  };
}

// ================================
// Organization Context Resolution
// ================================

export async function resolveOrganizationContext(
  firebaseUid: string,
  organizationSlug?: string
): Promise<OrganizationContext | null> {
  // Check cache first
  const cached = getCachedContext(firebaseUid);
  if (cached) {
    return cached;
  }

  try {
    // TODO: Replace with actual database queries
    // This is a placeholder implementation
    
    // Mock context for development
    const mockContext: OrganizationContext = {
      organization: {
        id: 'org_1',
        name: 'Empresa Teste',
        slug: 'empresa-teste',
        display_name: 'Empresa Teste Ltda',
        contact_email: 'contato@empresateste.com',
        settings: {
          max_devices: 100,
          max_users: 10,
          features: ['device_management', 'policy_enforcement'],
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          notifications: {
            email: true,
            sms: false,
            webhook: true,
          },
        },
        plan_type: 'professional',
        plan_limits: {
          devices: 100,
          users: 10,
          storage_gb: 50,
          api_calls_month: 10000,
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      user: {
        id: 'user_1',
        firebase_uid: firebaseUid,
        email: 'admin@empresateste.com',
        email_verified: true,
        display_name: 'Administrador',
        preferences: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            desktop: true,
          },
          dashboard: {
            default_view: 'devices',
            widgets: ['device_status', 'recent_alerts', 'compliance'],
          },
        },
        login_count: 1,
        two_factor_enabled: false,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      member: {
        id: 'member_1',
        organization_id: 'org_1',
        user_id: 'user_1',
        role: 'admin',
        permissions: {
          devices: { read: true, write: true, delete: true },
          policies: { read: true, write: true, delete: true },
          users: { read: true, write: true, delete: true },
          analytics: { read: true },
          settings: { read: true, write: true },
        },
        status: 'active',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      permissions: {
        devices: { read: true, write: true, delete: true },
        policies: { read: true, write: true, delete: true },
        users: { read: true, write: true, delete: true },
        analytics: { read: true },
        settings: { read: true, write: true },
      },
    };

    // Cache the context
    setCachedContext(firebaseUid, mockContext);

    return mockContext;
  } catch (error) {
    console.error('Error resolving organization context:', error);
    return null;
  }
}

// ================================
// Middleware Function
// ================================

export async function organizationMiddleware(
  request: NextRequest,
  organizationSlug?: string
): Promise<NextResponse | null> {
  try {
    // TODO: Replace with actual Firebase Auth session check
    // For now, we'll use a mock session
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Mock Firebase UID for development
    const firebaseUid = 'mock_firebase_uid';

    // Resolve organization context
    const context = await resolveOrganizationContext(
      firebaseUid,
      organizationSlug
    );

    if (!context) {
      // No organization access - redirect to onboarding or error page
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Check if organization is active
    if (context.organization.status !== 'active') {
      return NextResponse.redirect(new URL('/organization/suspended', request.url));
    }

    // Create response with organization context
    const response = NextResponse.next();
    
    // Add organization context to headers for API routes
    response.headers.set('x-organization-id', context.organization.id);
    response.headers.set('x-organization-slug', context.organization.slug);
    response.headers.set('x-user-id', context.user.id);
    response.headers.set('x-member-role', context.member.role);

    // Set RLS context for this request
    await createRLSConnection(context.organization.id, context.user.id);

    return response;

  } catch (error) {
    console.error('Organization middleware error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

// ================================
// Permission Checking Utilities
// ================================

export function hasPermission(
  context: OrganizationContext,
  resource: keyof OrganizationContext['permissions'],
  action: 'read' | 'write' | 'delete'
): boolean {
  const resourcePermissions = context.permissions[resource];
  
  if (!resourcePermissions) {
    return false;
  }

  // Type assertion to handle different permission structures
  if (typeof resourcePermissions === 'object' && 'read' in resourcePermissions) {
    return (resourcePermissions as any)[action] === true;
  }

  // For analytics which only has read permission
  if (resource === 'analytics' && action === 'read') {
    return resourcePermissions as boolean;
  }

  return false;
}

export function requirePermission(
  context: OrganizationContext,
  resource: keyof OrganizationContext['permissions'],
  action: 'read' | 'write' | 'delete'
): void {
  if (!hasPermission(context, resource, action)) {
    throw new Error(`Insufficient permissions: ${resource}:${action}`);
  }
}

// ================================
// Organization Switching
// ================================

export async function switchOrganization(
  userId: string,
  newOrganizationSlug: string
): Promise<OrganizationContext | null> {
  // Clear cache for user
  organizationCache.delete(userId);
  
  // Resolve new organization context
  return resolveOrganizationContext(userId, newOrganizationSlug);
}

// ================================
// Context Helpers for API Routes
// ================================

export async function getOrganizationFromHeaders(request: NextRequest): Promise<{
  organizationId: string;
  userId: string;
  role: string;
} | null> {
  const organizationId = request.headers.get('x-organization-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-member-role');

  if (!organizationId || !userId || !role) {
    return null;
  }

  return { organizationId, userId, role };
}

export function createAPIResponse(data: any, context?: OrganizationContext) {
  return NextResponse.json({
    data,
    organization: context ? {
      id: context.organization.id,
      name: context.organization.name,
      slug: context.organization.slug,
    } : null,
    timestamp: new Date().toISOString(),
  });
}

// ================================
// Subscription and Limits Checking
// ================================

export async function checkOrganizationLimits(
  context: OrganizationContext,
  resource: 'devices' | 'users' | 'storage_gb' | 'api_calls_month',
  currentCount: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const limit = context.organization.plan_limits[resource];
  const remaining = limit - currentCount;
  const allowed = currentCount < limit;

  return {
    allowed,
    limit,
    remaining,
  };
}

export async function validateSubscriptionStatus(
  context: OrganizationContext
): Promise<{ valid: boolean; reason?: string }> {
  const org = context.organization;

  // Check if trial has expired
  if (org.plan_type === 'trial' && org.trial_ends_at) {
    const trialEnd = new Date(org.trial_ends_at);
    if (new Date() > trialEnd) {
      return { valid: false, reason: 'trial_expired' };
    }
  }

  // Check organization status
  if (org.status !== 'active') {
    return { valid: false, reason: `organization_${org.status}` };
  }

  return { valid: true };
}

// ================================
// Cleanup Function
// ================================

export function clearOrganizationCache(userId?: string): void {
  if (userId) {
    organizationCache.delete(userId);
  } else {
    organizationCache.clear();
  }
}

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of organizationCache.entries()) {
    if (value.expires <= now) {
      organizationCache.delete(key);
    }
  }
}, CACHE_TTL);

export default organizationMiddleware;