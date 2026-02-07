import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/courses', '/lecture', '/dashboard', '/settings']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // If user is not signed in and the path is protected, redirect to sign-in
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is signed in and tries to access auth pages, redirect to courses
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    // Don't redirect from callback
    if (!request.nextUrl.pathname.includes('/callback')) {
      return NextResponse.redirect(new URL('/courses', request.url))
    }
  }

  return supabaseResponse
}
