import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'thevenuesearch@gmail.com';

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice('Bearer '.length).trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Admin booking API is missing Supabase environment variables.');
      return NextResponse.json(
        { success: false, error: 'Booking service is not fully configured.' },
        { status: 500 }
      );
    }

    /*
     * Validate the caller with Supabase Auth first.
     * The service-role client is used only after this check and
     * never receives the token from the browser.
     */
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session.' },
        { status: 401 }
      );
    }

    if ((user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Admin access required.' },
        { status: 403 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await admin
      .from('booking_requests')
      .select(
        `
          id,
          user_id,
          venue_id,
          created_at,
          event_date,
          event_type,
          guest_count,
          notes,
          status,
          payment_order_id,
          payment_id,
          booking_type,
          checkin_date,
          checkout_date,
          num_rooms,
          nightly_room_selections,
          guest_details,
          venue:venues(
            id,
            name,
            slug,
            city
          )
        `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin booking request query failed:', error);

      return NextResponse.json(
        { success: false, error: 'Unable to load booking requests.' },
        { status: 500 }
      );
    }

    const bookings = data || [];

    /*
     * Customer contact details live in profiles, not in the
     * booking row. Load them server-side so the admin can review
     * the same customer information without exposing other users'
     * profiles through the browser.
     */
    const userIds = Array.from(
      new Set(
        bookings
          .map((booking: any) => booking.user_id)
          .filter(Boolean)
      )
    ) as string[];

    let profiles: any[] = [];

    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await admin
        .from('profiles')
        .select('id, full_name, email, mobile')
        .in('id', userIds);

      if (profileError) {
        console.error('Admin booking profile query failed:', profileError);
      } else {
        profiles = profileData || [];
      }
    }

    const profileMap = new Map(
      profiles.map((profile: any) => [
        profile.id,
        {
          full_name: profile.full_name || null,
          email: profile.email || null,
          mobile: profile.mobile || null,
        },
      ])
    );

    const enrichedBookings = bookings.map((booking: any) => ({
      ...booking,
      customer: booking.user_id
        ? profileMap.get(booking.user_id) || null
        : null,
    }));

    return NextResponse.json({
      success: true,
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.error('Admin booking request API error:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to load booking requests.' },
      { status: 500 }
    );
  }
}
