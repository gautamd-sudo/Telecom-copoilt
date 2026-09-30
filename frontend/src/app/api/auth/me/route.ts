import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const cookieToken = request.cookies.get('telecom_auth_token')?.value;
      if (cookieToken) {
        authHeader = `Bearer ${cookieToken}`;
      }
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${backendUrl}/api/v1/auth/me`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch current user' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
