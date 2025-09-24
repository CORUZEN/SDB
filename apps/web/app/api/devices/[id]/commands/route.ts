/**
 * API: Device Commands
 * GET /api/devices/[id]/commands - Get commands for device
 * POST /api/devices/[id]/commands - Send command to device
 * FRIAXIS v4.0.7
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// ================================
// GET /api/devices/[id]/commands - Get commands for device
// ================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    console.log(`🔍 Fetching commands for device: ${id}`);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Query commands for device
    const commands = await sql`
      SELECT 
        id,
        device_id,
        organization_id,
        command_type as type,
        status,
        payload,
        result,
        created_at,
        executed_at,
        created_by_user_id
      FROM device_commands 
      WHERE device_id = ${id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    await sql.end();

    console.log(`✅ Found ${commands.length} commands for device`);

    return NextResponse.json({
      success: true,
      data: commands.map(cmd => ({
        id: cmd.id,
        device_id: cmd.device_id,
        organization_id: cmd.organization_id,
        type: cmd.type,
        status: cmd.status,
        payload: cmd.payload,
        result: cmd.result,
        created_at: cmd.created_at,
        executed_at: cmd.executed_at,
        created_by_user_id: cmd.created_by_user_id
      }))
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching commands:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// ================================
// POST /api/devices/[id]/commands - Send command to device
// ================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`📤 Sending command to device: ${id}`, body);
    
    // Connect to database
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

    // Create command
    const newCommand = await sql`
      INSERT INTO device_commands (
        device_id,
        organization_id,
        command_type,
        status,
        payload,
        created_by_user_id,
        created_at
      ) VALUES (
        ${id},
        1,
        ${body.type || 'locate'},
        'pending',
        ${JSON.stringify(body.payload || {})},
        1,
        NOW()
      )
      RETURNING *
    `;

    await sql.end();

    if (!newCommand || newCommand.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create command' 
        },
        { status: 500 }
      );
    }

    const command = newCommand[0];

    console.log(`✅ Command created: ${command.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: command.id,
        device_id: command.device_id,
        organization_id: command.organization_id,
        type: command.command_type,
        status: command.status,
        payload: command.payload,
        result: command.result,
        created_at: command.created_at,
        executed_at: command.executed_at,
        created_by_user_id: command.created_by_user_id
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error creating command:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}