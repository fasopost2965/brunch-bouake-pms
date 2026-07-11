import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// Routes publicly accessible (no auth required)
const PUBLIC_PATHS = ['/login'];

// Route to permissions mapping
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/reservations/new': ['reservations.create'],
  '/dashboard/reservations/checkin': ['reservations.checkin'],
  '/dashboard/reservations/checkout': ['reservations.checkout'],
  '/dashboard/reservations': ['reservations.write'],
  '/dashboard/housekeeping': ['housekeeping.write'],
  '/dashboard/maintenance': ['maintenance.write'],
  '/dashboard/guests': ['guests.write'],
  '/dashboard/billing': ['billing.write', 'billing.close'],
  '/dashboard/reports': ['reports.read'],
};

// Next.js middleware is a UX layer to prevent displaying unauthorized interfaces.
// Real security is enforced by backend PermissionsGuard.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  const isLoginPage = pathname === '/login';

  // If no token and not on login, let layout TokenRefresher handle it if refreshToken exists
  if (!accessToken) {
    if (!isLoginPage && !refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(accessToken, secret);
    
    // Redirect authenticated users away from login
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // RBAC Check for Dashboard routes
    if (pathname.startsWith('/dashboard')) {
      // Sort routes by length descending so specific routes match first
      const sortedRoutes = Object.entries(ROUTE_PERMISSIONS).sort((a, b) => b[0].length - a[0].length);
      const requiredPerms = sortedRoutes.find(([route]) => 
        pathname.startsWith(route)
      )?.[1];

      if (requiredPerms) {
        const userPerms = (payload.permissions as string[]) || [];
        // Check if user has ALL of the required permissions for this specific route match
        const hasPermission = requiredPerms.every(p => userPerms.includes(p));
        
        if (!hasPermission) {
          // UX layer: redirect to a safe page if unauthorized
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Invalid token
    if (!isLoginPage && !refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, images (.png, .jpg, .svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)',
  ],
};
