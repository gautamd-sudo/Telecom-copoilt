import { NextResponse } from 'next/server';

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${AI_URL}/anomalies`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ anomalies: data.anomalies ?? data });
    }

    // If AI service doesn't have an anomalies endpoint, return empty
    return NextResponse.json({ anomalies: [] });
  } catch {
    // AI service unreachable — return empty list gracefully
    return NextResponse.json({ anomalies: [] });
  }
}
