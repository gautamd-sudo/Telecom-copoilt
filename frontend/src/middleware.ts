import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('telecom_auth_token')?.value;
  
  // Validate token presence and JWT structure (3 parts separated by dots)
  const isAuthenticated = Boolean(
    token && 
    token.trim() !== '' && 
    token !== 'undefined' && 
    token !== 'null' && 
    token.split('.').length === 3
  );

  // If user is at root path "/"
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user tries to access /dashboard or any dashboard subpath while unauthenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clean up any stale/invalid cookie
      if (token) {
        response.cookies.delete('telecom_auth_token');
      }
      return response;
    }
  }

  // If user is already authenticated and visits /login, redirect to /dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - static files (_next/static/*)
     * - image optimization files (_next/image/*)
     * - metadata files (favicon.ico, sitemap.xml, robots.txt, fonts)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|fonts).*)',
  ],
};
