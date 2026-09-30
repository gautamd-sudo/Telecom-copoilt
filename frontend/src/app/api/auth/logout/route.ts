import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json().catch(() => ({}));

    await fetch(`${backendUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    }).catch(() => {});

    const response = NextResponse.json({ status: 'success', message: 'Logged out successfully' });
    response.cookies.delete('telecom_auth_token');
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
