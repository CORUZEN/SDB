/**
 * API Multi-tenant: Policies
 * Implementação seguindo API-MIGRATION-GUIDE.md
 * FRIAXIS v4.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { CreatePolicySchema, PolicySchema } from '@sdb/shared/schemas';
import { z } from 'zod';
import { resolveOrganizationContext, requirePermission } from '@/lib/organization-middleware';

// Marcar como dinâmica para evitar problemas de build estático
export const dynamic = 'force-dynamic';

// ================================
// Validation Schemas
// ================================

const policyQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  type: z.enum(['alert', 'maintenance', 'compliance', 'security', 'automation']).optional(),
  is_active: z.string().optional().transform(val => val === 'true'),
  search: z.string().optional(),
});

// ================================
// GET /api/policies - List Policies (Multi-tenant)
// ================================

export async function GET(request: NextRequest) {
  try {
    // 1. Extract user context (development mode support)
    let firebaseUid = 'dev-user-mock';
    
    // Check for Firebase auth in production
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      firebaseUid = token; // Use token as UID for development
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit, type, is_active, search } = policyQuerySchema.parse(queryParams);

    // 3. Connect to database with real data
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 4. Query real policies from database
    console.log('🔍 Fetching policies from Neon PostgreSQL...');
    
    const policies = await sql`
      SELECT 
        id,
        organization_id,
        name,
        description,
        category,
        policy_config,
        compliance_rules,
        is_active,
        version,
        tags,
        metadata,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM policies
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `;

    const total = await sql`SELECT COUNT(*) FROM policies`;
    const totalCount = parseInt(total[0].count, 10);

    await sql.end();

    console.log(`✅ Found ${policies.length} policies in database`);

    // 5. Format response
    const formattedPolicies = policies.map((policy: any) => ({
      id: policy.id,
      organization_id: policy.organization_id,
      name: policy.name,
      description: policy.description,
      category: policy.category,
      policy_config: policy.policy_config,
      compliance_rules: policy.compliance_rules,
      is_active: policy.is_active,
      version: policy.version,
      tags: policy.tags,
      metadata: policy.metadata,
      created_by: policy.created_by,
      updated_by: policy.updated_by,
      assigned_devices: 0, // TODO: Calculate from device_policies table
      stats: {
        total_executions: 0,
        successful_executions: 0,
        success_rate: 0,
      },
      created_at: policy.created_at?.toISOString(),
      updated_at: policy.updated_at?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedPolicies,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        has_next: page * limit < totalCount,
        has_prev: page > 1,
      },
      organization: {
        id: 1,
        name: 'Development Organization',
      },
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching policies:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ================================
// POST /api/policies - Create Policy (Multi-tenant)
// ================================

export async function POST(request: NextRequest) {
  try {
    // 1. Extract user context from headers (Firebase Auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    // In real implementation, this would verify Firebase token and get user
    const firebaseUid = 'extracted-from-token'; // Mock for now

    // 2. Resolve organization context
    const context = await resolveOrganizationContext(firebaseUid);
    if (!context) {
      return NextResponse.json(
        { error: 'Organization context not found' },
        { status: 401 }
      );
    }

    // 3. Check permissions
    requirePermission(context, 'policies', 'write');

    // 4. Parse and validate request body
    const body = await request.json();
    console.log('📥 Dados recebidos para nova política:', JSON.stringify(body, null, 2));
    
    // Validate using existing schema but adapt for multi-tenant
    const policyData = CreatePolicySchema.parse(body);

    // 5. Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 6. Check for duplicate policy name within organization
    const duplicateCheck = await sql`
      SELECT id 
      FROM policies 
      WHERE organization_id = ${context.organization.id} 
      AND name = ${policyData.name}
    `;

    if (duplicateCheck.length > 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Policy name already exists in this organization' },
        { status: 409 }
      );
    }

    // 7. Create policy with RLS protection
    const createResult = await sql`
      INSERT INTO policies (
        organization_id,
        name,
        description,
        type,
        conditions,
        actions,
        policy_json,
        is_active,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${context.organization.id},
        ${policyData.name},
        ${policyData.description || null},
        ${body.type || 'alert'},
        ${JSON.stringify(body.conditions || {})},
        ${JSON.stringify(body.actions || {})},
        ${JSON.stringify(policyData.policy_json)},
        ${policyData.is_active},
        ${context.user.id},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    if (createResult.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Falha ao criar política' },
        { status: 500 }
      );
    }

    const newPolicy = createResult[0];

    // 8. Log audit trail
    await sql`
      INSERT INTO audit_logs (
        organization_id,
        user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        ip_address,
        user_agent,
        timestamp
      ) VALUES (
        ${context.organization.id},
        ${context.user.id},
        'policy.create',
        'policy',
        ${newPolicy.id},
        ${JSON.stringify({ 
          name: policyData.name, 
          type: body.type || 'alert',
          is_active: policyData.is_active 
        })},
        ${request.headers.get('x-forwarded-for') || 'unknown'},
        ${request.headers.get('user-agent') || 'unknown'},
        NOW()
      )
    `;

    await sql.end();

    // 9. Format response
    const responseData = {
      id: newPolicy.id,
      organization_id: newPolicy.organization_id,
      name: newPolicy.name,
      description: newPolicy.description,
      type: newPolicy.type,
      conditions: newPolicy.conditions,
      actions: newPolicy.actions,
      policy_json: typeof newPolicy.policy_json === 'string' 
        ? JSON.parse(newPolicy.policy_json) 
        : newPolicy.policy_json,
      is_active: newPolicy.is_active,
      created_by: newPolicy.created_by,
      created_at: newPolicy.created_at?.toISOString(),
      updated_at: newPolicy.updated_at?.toISOString(),
    };

    console.log('✅ Política criada com sucesso:', responseData.id);

    // 10. Return created policy
    return NextResponse.json({
      success: true,
      data: responseData,
      organization: {
        id: context.organization.id,
        name: context.organization.name,
      },
      message: 'Policy created successfully'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating policy:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação:', error.errors);
      return NextResponse.json(
        { error: 'Invalid policy data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    console.error('❌ Erro ao criar política:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}