import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET() {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
    const result = await sql`SELECT NOW() as now;`;
    return NextResponse.json({ ok: true, dbTime: result[0].now });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}