import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
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

    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
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
