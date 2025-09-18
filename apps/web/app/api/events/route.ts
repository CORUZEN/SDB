import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { EventSchema, EventFilterSchema } from '@sdb/shared/schemas';
import { z } from 'zod';

// GET /api/events - Lista eventos/auditoria
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parse = EventFilterSchema.safeParse(params);

  if (!parse.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos', details: parse.error.errors }, { status: 400 });
  }

  const { device_id, type, severity, date_from, date_to } = parse.data;
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  let query = 'SELECT * FROM events WHERE 1=1';
  const values: any[] = [];

  if (device_id) {
    query += ' AND device_id = $' + (values.length + 1);
    values.push(device_id);
  }
  if (type) {
    query += ' AND type = $' + (values.length + 1);
    values.push(type);
  }
  if (severity) {
    query += ' AND severity = $' + (values.length + 1);
    values.push(severity);
  }
  if (date_from) {
    query += ' AND created_at >= $' + (values.length + 1);
    values.push(date_from);
  }
  if (date_to) {
    query += ' AND created_at <= $' + (values.length + 1);
    values.push(date_to);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  try {
    const result = await sql.unsafe(query, values);
    const events = result.map((e: any) => {
      // Convert dates to ISO strings for Zod validation
      // Parse data_json if it's a string
      let dataJson = e.data_json;
      if (typeof dataJson === 'string') {
        try {
          dataJson = JSON.parse(dataJson);
        } catch {
          dataJson = null;
        }
      }
      
      const eventData = {
        ...e,
        created_at: e.created_at?.toISOString() || null,
        data_json: dataJson,
      };
      return EventSchema.parse(eventData);
    });
    await sql.end();
    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
