import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Let the landing page show for unauthenticated users
  // The login page and landing page are always accessible
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Redirect root to dashboard (authenticated users go to dashboard)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
