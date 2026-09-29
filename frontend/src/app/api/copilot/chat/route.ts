import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars';

function createJwt(payload: Record<string, unknown>, secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, image_url, tenant_id = 'demo-tenant-001', user_id = 'admin-user' } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const token = createJwt({ tenantId: tenant_id, userId: user_id, exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);

    const res = await fetch(`${AI_URL}/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tenant_id, user_id, message, image_url })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      return NextResponse.json({ error: err.detail || 'AI Service Error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reach AI copilot';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
