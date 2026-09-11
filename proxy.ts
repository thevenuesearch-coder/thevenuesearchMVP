import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /*
   * If Supabase environment variables are not configured,
   * allow the application to continue running locally.
   */
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  /*
   * Get the currently authenticated user.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
   * =====================================================
   * ADMIN CONFIGURATION
   * =====================================================
   */

  const ADMIN_EMAIL =
    'thevenuesearch@gmail.com';

  const isAdmin =
    user?.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase();

  /*
   * =====================================================
   * PROFILE
   * =====================================================
   *
   * Only authenticated users can access /profile.
   */

  if (pathname.startsWith('/profile')) {
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }
  }

  /*
   * =====================================================
   * PLANNER
   * =====================================================
   *
   * Planner is ONLY for:
   *
   * thevenuesearch@gmail.com
   *
   * Everyone else is redirected to the homepage.
   */

  if (pathname.startsWith('/planner')) {
    /*
     * User is not logged in.
     */
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }

    /*
     * User is logged in but is NOT the admin.
     */
    if (!isAdmin) {
      return NextResponse.redirect(
        new URL('/', request.url)
      );
    }

    /*
     * Admin is allowed to continue.
     */
  }

  /*
   * =====================================================
   * ADMIN ROUTES
   * =====================================================
   *
   * /admin is also restricted to the admin account.
   */

  if (pathname.startsWith('/admin')) {
    /*
     * User is not logged in.
     */
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }

    /*
     * Logged-in user is not admin.
     */
    if (!isAdmin) {
      return NextResponse.redirect(
        new URL('/', request.url)
      );
    }
  }

  /*
   * =====================================================
   * WISHLIST
   * =====================================================
   *
   * Shortlist/wishlist requires login.
   */

  if (pathname.startsWith('/wishlist')) {
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }
  }

  /*
   * =====================================================
   * BOOKING / ENQUIRY
   * =====================================================
   *
   * Booking/enquiry requires login.
   */

  if (pathname.startsWith('/book')) {
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }
  }

  /*
   * Everything else is public.
   */
  return response;
}

/*
 * Middleware only runs for protected routes.
 *
 * Public pages such as:
 *
 * /
 * /explore
 * /collections
 * /how-it-works
 * /for-venues
 * /login
 *
 * remain publicly accessible.
 */

export const config = {
  matcher: [
    '/planner/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
    '/book/:path*',
  ],
};
