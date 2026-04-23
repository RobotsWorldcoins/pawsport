import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const sessionToken = req.cookies.get('pawsport_admin_session')?.value;
  const { pathname } = req.nextUrl;

  // Allow login page and API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
