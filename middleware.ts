import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './app/utils/supabase/middleware'
import { createClient } from './app/utils/supabase/server'

export async function middleware(request: NextRequest) {
  // Update session for all requests
  const response = await updateSession(request)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Protected route logic
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isLoginPage && !isAuthCallback) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
