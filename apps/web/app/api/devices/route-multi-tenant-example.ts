/**
 * API Route Multi-tenant Example
 * FRIAXIS v4.0.0 - Devices API with Multi-tenant Support
 * 
 * Este exemplo demonstra como adaptar uma API route para:
 * - Usar contexto de organização
 * - Implementar Row Level Security (RLS)
 * - Validar permissões
 * - Retornar dados isolados por organização
 */

import { NextRequest } from 'next/server';
import { 
  getOrganizationFromHeaders, 
  createAPIResponse,
  resolveOrganizationContext,
  hasPermission,
  checkOrganizationLimits 
} from '../../../lib/organization-middleware';
import { Device } from '../../../../../packages/shared/types';

// ================================
// Utility Functions
// ================================

async function getOrganizationContext(request: NextRequest) {
  const orgData = await getOrganizationFromHeaders(request);
  
  if (!orgData) {
    throw new Error('Organization context not found');
  }

  // In production, this would come from the middleware
  // For now, we'll resolve it directly
  const context = await resolveOrganizationContext(orgData.userId);
  
  if (!context) {
    throw new Error('Failed to resolve organization context');
  }

  return context;
}

// ================================
// GET /api/devices - List devices
// ================================

export async function GET(request: NextRequest) {
  try {
    // Get organization context from middleware headers
    const context = await getOrganizationContext(request);
    
    // Check permissions
    if (!hasPermission(context, 'devices', 'read')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }), 
        { status: 403 }
      );
    }

    // TODO: Replace with actual database query with RLS
    // Example query that would be executed:
    // SELECT * FROM devices WHERE organization_id = $1 AND deleted_at IS NULL
    
    // Mock data for demonstration
    const devices: Device[] = [
      {
        id: 'device_1',
        organization_id: context.organization.id,
        name: 'Samsung Galaxy A54',
        device_identifier: 'SM-A546B',
        serial_number: 'R58R703DVCR',
        status: 'online',
        health_score: 95,
        compliance_status: 'compliant',
        device_type: 'smartphone',
        manufacturer: 'Samsung',
        model: 'Galaxy A54 5G',
        os_type: 'android',
        os_version: '14',
        app_version: '3.0.0',
        owner_name: 'João Silva',
        owner_email: 'joao.silva@empresateste.com',
        department: 'Vendas',
        location_name: 'Escritório SP',
        tags: ['vendas', 'campo'],
        metadata: {
          imei: '356938035643809',
          phone_number: '+5511999887766'
        },
        settings: {
          auto_update: true,
          backup_enabled: true,
          location_tracking: true,
          screenshot_allowed: false,
          remote_wipe_enabled: true,
        },
        last_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
        last_checkin_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
        first_enrolled_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        enrolled_by: context.user.id,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'device_2',
        organization_id: context.organization.id,
        name: 'iPhone 14 Pro',
        device_identifier: 'iPhone15,3',
        serial_number: 'F2LNX1YZPQ',
        status: 'offline',
        health_score: 88,
        compliance_status: 'non_compliant',
        device_type: 'smartphone',
        manufacturer: 'Apple',
        model: 'iPhone 14 Pro',
        os_type: 'ios',
        os_version: '17.1.2',
        app_version: '3.0.0',
        owner_name: 'Maria Santos',
        owner_email: 'maria.santos@empresateste.com',
        department: 'Marketing',
        location_name: 'Escritório RJ',
        tags: ['marketing', 'executivo'],
        metadata: {
          imei: '356123456789012',
          phone_number: '+5521988776655'
        },
        settings: {
          auto_update: true,
          backup_enabled: true,
          location_tracking: false,
          screenshot_allowed: true,
          remote_wipe_enabled: true,
        },
        last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        last_checkin_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        first_enrolled_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        enrolled_by: context.user.id,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    // Apply any additional filtering based on query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const department = url.searchParams.get('department');
    
    let filteredDevices = devices;
    
    if (status) {
      filteredDevices = filteredDevices.filter(d => d.status === status);
    }
    
    if (department) {
      filteredDevices = filteredDevices.filter(d => d.department === department);
    }

    // Return response with organization context
    return createAPIResponse({
      devices: filteredDevices,
      total: filteredDevices.length,
      filters: { status, department },
    }, context);

  } catch (error) {
    console.error('Error in GET /api/devices:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}

// ================================
// POST /api/devices - Create device
// ================================

export async function POST(request: NextRequest) {
  try {
    // Get organization context
    const context = await getOrganizationContext(request);
    
    // Check permissions
    if (!hasPermission(context, 'devices', 'write')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }), 
        { status: 403 }
      );
    }

    // Check organization limits
    const currentDeviceCount = 2; // This would come from database count
    const limitsCheck = await checkOrganizationLimits(
      context, 
      'devices', 
      currentDeviceCount
    );
    
    if (!limitsCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Device limit exceeded',
          limit: limitsCheck.limit,
          current: currentDeviceCount,
          plan: context.organization.plan_type
        }), 
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.device_identifier) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['name', 'device_identifier']
        }), 
        { status: 400 }
      );
    }

    // Create new device (this would be a database insert)
    const newDevice: Device = {
      id: `device_${Date.now()}`, // In production, use UUID
      organization_id: context.organization.id, // Automatically set from context
      name: body.name,
      device_identifier: body.device_identifier,
      serial_number: body.serial_number,
      status: 'offline', // Default status
      health_score: 0,
      compliance_status: 'unknown',
      device_type: body.device_type || 'smartphone',
      manufacturer: body.manufacturer,
      model: body.model,
      os_type: body.os_type,
      os_version: body.os_version,
      app_version: '3.0.0',
      owner_name: body.owner_name,
      owner_email: body.owner_email,
      department: body.department,
      location_name: body.location_name,
      tags: body.tags || [],
      metadata: body.metadata || {},
      settings: {
        auto_update: true,
        backup_enabled: true,
        location_tracking: true,
        screenshot_allowed: false,
        remote_wipe_enabled: true,
        ...body.settings
      },
      first_enrolled_at: new Date().toISOString(),
      enrolled_by: context.user.id, // Automatically set from context
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: Insert into database with RLS
    // Example query:
    // INSERT INTO devices (organization_id, name, device_identifier, ...) 
    // VALUES ($1, $2, $3, ...)

    return createAPIResponse({
      device: newDevice,
      message: 'Device created successfully'
    }, context);

  } catch (error) {
    console.error('Error in POST /api/devices:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}

// ================================
// PUT /api/devices/[id] - Update device
// ================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(request);
    
    // Check permissions
    if (!hasPermission(context, 'devices', 'write')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }), 
        { status: 403 }
      );
    }

    const deviceId = params.id;
    const body = await request.json();

    // TODO: Check if device exists and belongs to organization
    // Example query with RLS:
    // SELECT * FROM devices WHERE id = $1 AND organization_id = $2

    // Mock update (in production, this would be a database update)
    const updatedDevice = {
      id: deviceId,
      organization_id: context.organization.id,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return createAPIResponse({
      device: updatedDevice,
      message: 'Device updated successfully'
    }, context);

  } catch (error) {
    console.error('Error in PUT /api/devices:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}

// ================================
// DELETE /api/devices/[id] - Delete device
// ================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getOrganizationContext(request);
    
    // Check permissions
    if (!hasPermission(context, 'devices', 'delete')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }), 
        { status: 403 }
      );
    }

    const deviceId = params.id;

    // TODO: Soft delete device with RLS
    // Example query:
    // UPDATE devices 
    // SET deleted_at = NOW(), updated_at = NOW() 
    // WHERE id = $1 AND organization_id = $2

    return createAPIResponse({
      message: 'Device deleted successfully',
      deleted_id: deviceId
    }, context);

  } catch (error) {
    console.error('Error in DELETE /api/devices:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}