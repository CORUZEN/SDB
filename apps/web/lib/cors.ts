/**
 * CORS Utility Functions for FRIAXIS API v4.0.3
 * Resolves cross-origin request blocking issues
 */

import { NextResponse } from "next/server";

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function createCorsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders()
  });
}

export function handlePreflight() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders()
  });
}

export function addCorsHeaders(response: NextResponse) {
  const headers = corsHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}