import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'thevenuesearch@gmail.com';

export async function GET() {
  try {
    /*
     * ==========================================================
     * VERIFY THE CALLER IS THE ADMIN
     *
     * The /admin page itself is already gated by proxy.ts
     * (middleware), but this API route is a separate request
     * and isn't covered by that matcher -- it checks the
     * session independently rather than relying on the page
     * having already gated access.
     * ==========================================================
     */

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Supabase is not configured.' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            /* Read-only in a route handler. */
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdmin =
      user?.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized.' },
        { status: 403 }
      );
    }

    /*
     * ==========================================================
     * FETCH ALL ENQUIRIES (service role -- enquiries has no
     * public SELECT policy, by design)
     * ==========================================================
     */

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key is not configured.' },
        { status: 500 }
      );
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await admin
      .from('enquiries')
      .select(
        `
          id,
          booking_type,
          full_name,
          email,
          mobile,
          event_date,
          event_type,
          guest_count,
          budget,
          checkin_date,
          checkout_date,
          num_rooms,
          room_guest_count,
          room_type,
          guest_details,
          message,
          status,
          created_at,
          venues (
            id,
            name,
            slug
          )
        `
      )
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error(
      'Admin enquiries fetch error:',
      err
    );

    return NextResponse.json(
      { error: 'Unable to load enquiries.' },
      { status: 500 }
    );
  }
}
