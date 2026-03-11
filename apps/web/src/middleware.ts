import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/vendor/edit', '/vendor/signup', '/reviews/new'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/vendor/edit/:path*',
    '/vendor/signup/:path*',
    '/reviews/new/:path*',
  ],
};
