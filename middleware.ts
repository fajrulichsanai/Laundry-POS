import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SESSION_COOKIE_NAME = 'session_token'

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Cek apakah route adalah auth page
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isRootPage = request.nextUrl.pathname === '/'
  const isProtectedPage = !isAuthPage && !isRootPage

  // Jika ada session token, validasi session
  let isAuthenticated = false

  if (sessionToken) {
    // Validasi session di database
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: session, error } = await supabase
      .from('sessions')
      .select('expires_at, user_id')
      .eq('session_token', sessionToken)
      .single()

    if (!error && session) {
      // Cek apakah session masih valid
      const expiresAt = new Date(session.expires_at)
      const now = new Date()

      if (now <= expiresAt) {
        // Session masih valid, cek apakah user masih aktif
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user_id)
          .eq('active', true)
          .single()

        if (user) {
          isAuthenticated = true
        }
      }
    }
  }

  // Redirect logic
  // 1. Jika belum login dan mencoba akses halaman protected
  if (!isAuthenticated && isProtectedPage) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Jika sudah login dan mencoba akses halaman login
  if (isAuthenticated && isAuthPage) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 3. Jika sudah login dan akses root, redirect ke dashboard
  if (isAuthenticated && isRootPage) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 4. Jika belum login dan akses root, redirect ke login
  if (!isAuthenticated && isRootPage) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
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
