import { NextRequest, NextResponse } from 'next/server';

// Routes publicly accessible (no auth required)
const PUBLIC_PATHS = ['/login'];

// Role → default landing page after login
const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  Admin: '/dashboard',
  Manager: '/dashboard',
  Réceptionniste: '/dashboard',
  Housekeeping: '/housekeeping',
  Maintenance: '/maintenance',
  Comptable: '/billing',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Not authenticated
  if (!accessToken && !refreshToken) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login page → redirect to their dashboard
  if (isPublic && (accessToken || refreshToken)) {
    const destination = (userRole && ROLE_DEFAULT_ROUTES[userRole]) ?? '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Access token expired but refresh token present → let the page load
  // The server component will call refreshAccessToken() and set new cookies
  if (!accessToken && refreshToken) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
