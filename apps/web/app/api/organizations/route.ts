/**
 * API Multi-tenant: Organizations
 * Implementação seguindo API-MIGRATION-GUIDE.md
 * FRIAXIS v4.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { z } from 'zod';
import { resolveOrganizationContext, requirePermission } from '@/lib/organization-middleware';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ================================
// Validation Schemas
// ================================

const organizationUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(20).optional(),
  settings: z.object({
    timezone: z.string().optional(),
    language: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      webhook: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

// ================================
// GET /api/organizations - Get Current Organization
// ================================

export async function GET(request: NextRequest) {
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
    requirePermission(context, 'settings', 'read');

    // 4. Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 5. Get organization details with usage statistics
    const [orgResult, statsResult, membersResult] = await Promise.all([
      // Organization details
      sql`
        SELECT 
          o.*,
          s.plan_type,
          s.max_devices,
          s.max_users,
          s.max_storage_gb,
          s.status as subscription_status,
          s.current_period_end,
          s.trial_ends_at
        FROM organizations o
        LEFT JOIN subscriptions s ON o.id = s.organization_id
        WHERE o.id = ${context.organization.id}
      `,
      
      // Usage statistics
      sql`
        SELECT 
          COUNT(DISTINCT d.id) as device_count,
          COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) as active_devices,
          COALESCE(SUM(dt.data_size_mb), 0) / 1024 as storage_used_gb,
          COUNT(DISTINCT al.id) as total_events
        FROM organizations o
        LEFT JOIN devices d ON o.id = d.organization_id
        LEFT JOIN device_telemetry dt ON d.id = dt.device_id AND dt.organization_id = o.id
        LEFT JOIN audit_logs al ON o.id = al.organization_id AND al.timestamp > NOW() - INTERVAL '30 days'
        WHERE o.id = ${context.organization.id}
        GROUP BY o.id
      `,
      
      // Member count
      sql`
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'operator' THEN 1 END) as operator_count,
          COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_count
        FROM organization_members 
        WHERE organization_id = ${context.organization.id}
        AND status = 'active'
      `
    ]);

    await sql.end();

    if (orgResult.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organization = orgResult[0];
    const stats = statsResult[0];
    const members = membersResult[0];

    // 6. Format response
    const response = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        display_name: organization.display_name,
        contact_email: organization.contact_email,
        contact_phone: organization.contact_phone,
        settings: organization.settings,
        plan_type: organization.plan_type,
        status: organization.status,
        created_at: organization.created_at.toISOString(),
        updated_at: organization.updated_at.toISOString(),
      },
      subscription: {
        plan_type: organization.plan_type,
        status: organization.subscription_status,
        limits: {
          devices: organization.max_devices,
          users: organization.max_users,
          storage_gb: organization.max_storage_gb,
        },
        current_period_end: organization.current_period_end?.toISOString(),
        trial_ends_at: organization.trial_ends_at?.toISOString(),
      },
      usage: {
        devices: {
          total: parseInt(stats.device_count, 10),
          active: parseInt(stats.active_devices, 10),
          limit: organization.max_devices,
        },
        users: {
          total: parseInt(members.total_members, 10),
          admins: parseInt(members.admin_count, 10),
          operators: parseInt(members.operator_count, 10),
          viewers: parseInt(members.viewer_count, 10),
          limit: organization.max_users,
        },
        storage: {
          used_gb: parseFloat(stats.storage_used_gb) || 0,
          limit_gb: organization.max_storage_gb,
        },
        events_30_days: parseInt(stats.total_events, 10),
      },
      permissions: context.permissions,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error: unknown) {
    console.error('Error fetching organization:', error);
    
    if (error instanceof Error && error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ================================
// PUT /api/organizations - Update Organization
// ================================

export async function PUT(request: NextRequest) {
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
    requirePermission(context, 'settings', 'write');

    // 4. Parse and validate request body
    const body = await request.json();
    const updateData = organizationUpdateSchema.parse(body);

    // 5. Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // 6. Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateData.display_name) {
      updateFields.push(`display_name = $${paramIndex}`);
      updateValues.push(updateData.display_name);
      paramIndex++;
    }

    if (updateData.contact_email) {
      updateFields.push(`contact_email = $${paramIndex}`);
      updateValues.push(updateData.contact_email);
      paramIndex++;
    }

    if (updateData.contact_phone) {
      updateFields.push(`contact_phone = $${paramIndex}`);
      updateValues.push(updateData.contact_phone);
      paramIndex++;
    }

    if (updateData.settings) {
      // Merge with existing settings
      const currentOrg = await sql`
        SELECT settings FROM organizations WHERE id = ${context.organization.id}
      `;
      
      const currentSettings = currentOrg[0].settings || {};
      const newSettings = { ...currentSettings, ...updateData.settings };
      
      updateFields.push(`settings = $${paramIndex}`);
      updateValues.push(JSON.stringify(newSettings));
      paramIndex++;
    }

    if (updateFields.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(context.organization.id);

    // 7. Execute update
    const updateQuery = `
      UPDATE organizations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updateResult = await sql.unsafe(updateQuery, updateValues);

    if (updateResult.length === 0) {
      await sql.end();
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

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
        'organization.update',
        'organization',
        ${context.organization.id},
        ${JSON.stringify({ updated_fields: Object.keys(updateData) })},
        ${request.headers.get('x-forwarded-for') || 'unknown'},
        ${request.headers.get('user-agent') || 'unknown'},
        NOW()
      )
    `;

    await sql.end();

    const updatedOrganization = updateResult[0];

    // 9. Format response
    const response = {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      slug: updatedOrganization.slug,
      display_name: updatedOrganization.display_name,
      contact_email: updatedOrganization.contact_email,
      contact_phone: updatedOrganization.contact_phone,
      settings: updatedOrganization.settings,
      status: updatedOrganization.status,
      updated_at: updatedOrganization.updated_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Organization updated successfully',
    });

  } catch (error: unknown) {
    console.error('Error updating organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid organization data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}