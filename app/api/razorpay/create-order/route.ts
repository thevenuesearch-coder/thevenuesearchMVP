import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

/*
 * Single source of truth for the booking fee, shared with the
 * client (app/book/page.tsx reads the same NEXT_PUBLIC_ var) so
 * the amount shown to the customer always matches what gets
 * charged.
 */
const BOOKING_AMOUNT =
  Number(process.env.NEXT_PUBLIC_BOOKING_FEE_INR) || 25000;

/*
 * Bookings that already occupy a date for this venue.
 */
const BLOCKING_STATUSES = [
  'held',
  'payment_pending',
  'confirmed',
];

type IncomingEvent = {
  eventDate?: string;
};

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    /*
     * Check environment variables
     */
    if (!keyId || !keySecret) {
      console.error(
        'Razorpay environment variables are missing.'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Razorpay environment variables are missing. Check .env.local.',
        },
        { status: 500 }
      );
    }

    /*
     * Read request body
     */
    const body = await request.json();

    const {
      venueId,
      venueName,
      fullName,
      email,
      mobile,
      eventDate,
      events,
    } = body;

    /*
     * Validate booking information
     */
    if (
      !venueId ||
      !venueName ||
      !fullName ||
      !email ||
      !mobile ||
      !eventDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Required booking information is missing.',
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================================
     * AVAILABILITY PRE-CHECK
     *
     * Before charging anything, confirm none of the requested
     * event dates are already held/pending/confirmed for this
     * venue. This is a best-effort check -- the database's
     * unique index (confirmed_venue_date_unique) remains the
     * final source of truth in case of a race condition between
     * this check and payment completing.
     * ==========================================================
     */

    const eventDates = Array.from(
      new Set(
        (Array.isArray(events) ? events : [])
          .map(
            (event: IncomingEvent) => event?.eventDate
          )
          .filter(Boolean)
          .concat(eventDate ? [eventDate] : [])
      )
    );

    if (eventDates.length > 0) {
      const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!serviceRoleKey || !supabaseUrl) {
        console.error(
          'SUPABASE_SERVICE_ROLE_KEY is missing — cannot run the availability check.'
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Booking service is not fully configured. Please contact support.',
          },
          { status: 500 }
        );
      }

      /*
       * The anon client is bound by RLS ("own bookings" — a
       * user can only SELECT their own rows), which would make
       * this check silently useless: it needs to see OTHER
       * users' held/confirmed bookings to detect a real
       * conflict, so it must run with the service role key.
       */
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

      const { data: conflicts, error: conflictError } =
        await admin
          .from('booking_requests')
          .select('event_date, status')
          .eq('venue_id', venueId)
          .in('event_date', eventDates)
          .in('status', BLOCKING_STATUSES);

      if (conflictError) {
        console.error(
          'Availability check failed:',
          conflictError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Unable to confirm availability right now. Please try again.',
          },
          { status: 500 }
        );
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              'One of the selected dates is no longer available for this venue. Please choose a different date.',
          },
          { status: 409 }
        );
      }
    }

    /*
     * Create Razorpay client
     */
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    /*
     * Create Razorpay order
     *
     * Razorpay amount is always sent in the
     * smallest currency unit.
     */
    const order = await razorpay.orders.create({
      amount: BOOKING_AMOUNT * 100,
      currency: 'INR',
      receipt: `TVS_${Date.now()}`,
      notes: {
        venue_id: String(venueId),
        venue_name: String(venueName),
        customer_name: String(fullName),
        customer_email: String(email),
        customer_mobile: String(mobile),
        event_date: String(eventDate),
        event_dates: eventDates.join(', '),
      },
    });

    console.log(
      'Razorpay order created successfully:',
      order.id
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    /*
     * IMPORTANT:
     * Return the actual Razorpay error so that
     * we can diagnose Test Mode/API problems.
     *
     * Never return the secret key.
     */
    console.error(
      'RAZORPAY CREATE ORDER ERROR:',
      error
    );

    const razorpayError =
      error?.error || error;

    return NextResponse.json(
      {
        success: false,
        error:
          razorpayError?.description ||
          error?.description ||
          error?.message ||
          'Unable to create Razorpay order.',
        code:
          razorpayError?.code ||
          error?.code ||
          null,
      },
      { status: 500 }
    );
  }
}
