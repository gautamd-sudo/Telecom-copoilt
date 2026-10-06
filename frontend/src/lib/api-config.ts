/**
 * Universal backend URL resolver.
 * Ensures that both client-side and server-side Next.js route handlers
 * always target the correct backend URL in development and production.
 */
export function getBackendUrl(): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/, '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // In production (Vercel, Render, etc.), fallback to the live Vercel backend.
  if (process.env.NODE_ENV === 'production') {
    if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return 'https://telecom-copilot-backend.vercel.app';
    }
  }

  return (apiUrl || 'http://localhost:3001').replace(/\/+$/, '');
}
