import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'thevenuesearch@gmail.com';

export async function POST(request: Request) {
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
      return NextResponse.json(
        { success: false, error: 'Booking service is not fully configured.' },
        { status: 500 }
      );
    }

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

    const body = await request.json();
    const bookingId = body?.bookingId;

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required.' },
        { status: 400 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: booking, error: bookingError } = await admin
      .from('booking_requests')
      .select('id, status, payment_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error('Admin booking lookup failed:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Unable to load the booking.' },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

    if (!booking.payment_id) {
      return NextResponse.json(
        { success: false, error: 'This booking has not completed payment.' },
        { status: 409 }
      );
    }

    if (
      booking.status !== 'under_review' &&
      booking.status !== 'confirmed'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'This booking is not awaiting admin confirmation.',
        },
        { status: 409 }
      );
    }

    const { data: updated, error: updateError } = await admin
      .from('booking_requests')
      .update({
        status: 'confirmed',
      })
      .eq('id', bookingId)
      .select('id, status')
      .single();

    if (updateError || !updated) {
      console.error('Admin booking confirmation failed:', updateError);
      return NextResponse.json(
        { success: false, error: 'Unable to confirm the booking.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error) {
    console.error('Admin booking confirmation API error:', error);

    return NextResponse.json(
      { success: false, error: 'Unable to confirm the booking.' },
      { status: 500 }
    );
  }
}
