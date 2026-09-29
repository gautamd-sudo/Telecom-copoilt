import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const incomingAuth = request.headers.get('authorization');
    const authHeader = (incomingAuth && incomingAuth !== 'Bearer ') 
      ? incomingAuth 
      : 'Bearer telecom_live_api_key_2026';

    const res = await fetch(`${BACKEND_URL}/api/v1/incidents`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ incidents: data.data ?? data.incidents ?? data });
    }

    // Backend may require API key — return empty gracefully
    return NextResponse.json({ incidents: [] });
  } catch {
    return NextResponse.json({ incidents: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const incomingAuth = request.headers.get('authorization');
    const authHeader = (incomingAuth && incomingAuth !== 'Bearer ') 
      ? incomingAuth 
      : 'Bearer telecom_live_api_key_2026';

    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ incident: data.data ?? data });
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.error || 'Failed to declare incident on backend' }, 
      { status: res.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
